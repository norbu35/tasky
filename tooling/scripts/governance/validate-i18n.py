#!/usr/bin/env python3
"""Validate locale resources and i18n callsite conventions."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]

CLIENT_LOCALE_SETS = {
    "web": {
        "en": REPO_ROOT / "apps/web/src/locales/en/translation.json",
        "mn": REPO_ROOT / "apps/web/src/locales/mn/translation.json",
    },
    "mobile": {
        "en": REPO_ROOT / "apps/mobile/src/locales/en/translation.json",
        "mn": REPO_ROOT / "apps/mobile/src/locales/mn/translation.json",
    },
}

BACKEND_MESSAGE_SETS = {
    "api": {
        "en": REPO_ROOT / "services/api/src/main/resources/i18n/messages_en.properties",
        "mn": REPO_ROOT / "services/api/src/main/resources/i18n/messages_mn.properties",
    },
}

SOURCE_ROOTS = [
    REPO_ROOT / "apps/web/src",
    REPO_ROOT / "apps/mobile/src",
]
SHARED_SOURCE_ROOTS = [
    REPO_ROOT / "packages/core/src",
]

SOURCE_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}
SKIP_SOURCE_MARKERS = (".test.", ".spec.")

INTERPOLATION_RE = re.compile(r"\{\{\s*([^}\s]+)\s*}}")
MESSAGE_FORMAT_RE = re.compile(r"\{(\d+)}")
FALLBACK_T_RE = re.compile(
    r"\b(?:[A-Za-z_$][\w$]*\.)?t\(\s*([\"'])[^\"']+\1\s*,\s*([\"'])",
    re.DOTALL,
)
STATIC_T_KEY_RE = re.compile(
    r"\b(?:[A-Za-z_$][\w$]*\.)?t\(\s*([\"'])([^\"'`{}]+)\1",
    re.DOTALL,
)
T_CALL_START_RE = re.compile(r"\b(?:[A-Za-z_$][\w$]*\.)?t\(\s*", re.DOTALL)


def format_key_list(keys: list[str]) -> str:
    return ", ".join(keys)


def flatten_json(value: Any, prefix: str = "") -> dict[str, str]:
    flattened: dict[str, str] = {}
    if not isinstance(value, dict):
        raise ValueError("locale root must be an object")

    for key, child in value.items():
        next_key = f"{prefix}.{key}" if prefix else key
        if isinstance(child, dict):
            flattened.update(flatten_json(child, next_key))
        elif isinstance(child, str):
            flattened[next_key] = child
        else:
            raise ValueError(f"{next_key} must be a string or object, got {type(child).__name__}")
    return flattened


def load_json(path: Path) -> dict[str, str]:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, dict):
        data.pop("_translationMeta", None)
    return flatten_json(data)


def load_properties(path: Path) -> dict[str, str]:
    entries: dict[str, str] = {}
    continuation_key: str | None = None
    continuation_value = ""

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("!"):
            continue

        if continuation_key is not None:
            continuation_value += line.rstrip("\\")
            if not line.endswith("\\"):
                entries[continuation_key] = continuation_value
                continuation_key = None
                continuation_value = ""
            continue

        separator_positions = [pos for pos in (line.find("="), line.find(":")) if pos >= 0]
        if not separator_positions:
            continue
        separator = min(separator_positions)
        key = line[:separator].strip()
        value = line[separator + 1 :].strip()

        if value.endswith("\\"):
            continuation_key = key
            continuation_value = value.rstrip("\\")
        else:
            entries[key] = value

    if continuation_key is not None:
        entries[continuation_key] = continuation_value

    return entries


def compare_key_sets(label: str, localized: dict[str, dict[str, str]], failures: list[str]) -> None:
    baseline_locale = "en"
    baseline_keys = set(localized[baseline_locale])

    for locale, values in localized.items():
        keys = set(values)
        missing = sorted(baseline_keys - keys)
        extra = sorted(keys - baseline_keys)
        if missing:
            failures.append(f"{label} {locale}: missing keys: {format_key_list(missing)}")
        if extra:
            failures.append(f"{label} {locale}: extra keys: {format_key_list(extra)}")


def check_empty_values(label: str, localized: dict[str, dict[str, str]], failures: list[str]) -> None:
    for locale, values in localized.items():
        empty_keys = sorted(key for key, value in values.items() if value == "")
        if empty_keys:
            failures.append(f"{label} {locale}: empty values: {format_key_list(empty_keys)}")


def compare_placeholders(
    label: str,
    localized: dict[str, dict[str, str]],
    placeholder_re: re.Pattern[str],
    failures: list[str],
) -> None:
    keys = set.intersection(*(set(values) for values in localized.values()))
    for key in sorted(keys):
        tokens_by_locale = {
            locale: sorted(set(placeholder_re.findall(values[key])))
            for locale, values in localized.items()
        }
        unique_token_sets = {tuple(tokens) for tokens in tokens_by_locale.values()}
        if len(unique_token_sets) > 1:
            rendered = ", ".join(
                f"{locale}={tokens}" for locale, tokens in sorted(tokens_by_locale.items())
            )
            failures.append(f"{label} {key}: placeholder mismatch ({rendered})")


def source_files_for_root(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix not in SOURCE_EXTENSIONS:
            continue
        if any(marker in path.name for marker in SKIP_SOURCE_MARKERS):
            continue
        files.append(path)
    return files


def source_roots_for_label(label: str) -> list[Path]:
    app_roots = [REPO_ROOT / f"apps/{label}/src"]
    return [root for root in [*app_roots, *SHARED_SOURCE_ROOTS] if root.exists()]


def source_files_for_roots(roots: list[Path]) -> list[Path]:
    files: list[Path] = []
    for root in roots:
        files.extend(source_files_for_root(root))
    return files


def source_files() -> list[Path]:
    return source_files_for_roots([*SOURCE_ROOTS, *SHARED_SOURCE_ROOTS])


def used_translation_keys(source_roots: list[Path]) -> set[str]:
    keys: set[str] = set()
    for path in source_files_for_roots(source_roots):
        text = path.read_text(encoding="utf-8")
        for match in STATIC_T_KEY_RE.finditer(text):
            keys.add(match.group(2))
    return keys


def dynamic_t_call_count(text: str) -> int:
    count = 0
    for match in T_CALL_START_RE.finditer(text):
        index = match.end()
        while index < len(text) and text[index].isspace():
            index += 1
        if index >= len(text):
            continue
        if text[index] in {"'", '"'}:
            continue
        count += 1
    return count


def dynamic_t_callsite_count(files: list[Path]) -> int:
    return sum(dynamic_t_call_count(path.read_text(encoding="utf-8")) for path in files)


def check_used_keys(
    label: str,
    source_roots: list[Path],
    localized: dict[str, dict[str, str]],
    failures: list[str],
) -> None:
    known_keys = set.intersection(*(set(values) for values in localized.values()))
    missing = sorted(used_translation_keys(source_roots) - known_keys)
    if missing:
        failures.append(f"{label}: source references missing locale keys: {format_key_list(missing)}")


def check_t_fallbacks(failures: list[str]) -> None:
    for path in source_files():
        text = path.read_text(encoding="utf-8")
        for match in FALLBACK_T_RE.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            relative = path.relative_to(REPO_ROOT)
            failures.append(
                f"{relative}:{line}: remove literal fallback from t(...) and use locale files"
            )


def main() -> int:
    failures: list[str] = []
    dynamic_callsite_count = dynamic_t_callsite_count(source_files())

    for label, locale_paths in CLIENT_LOCALE_SETS.items():
        try:
            localized = {locale: load_json(path) for locale, path in locale_paths.items()}
        except Exception as error:  # noqa: BLE001 - report all malformed locale failures.
            failures.append(f"{label}: failed to load locale JSON: {error}")
            continue
        compare_key_sets(label, localized, failures)
        check_empty_values(label, localized, failures)
        compare_placeholders(label, localized, INTERPOLATION_RE, failures)
        check_used_keys(label, source_roots_for_label(label), localized, failures)

    for label, message_paths in BACKEND_MESSAGE_SETS.items():
        try:
            localized = {locale: load_properties(path) for locale, path in message_paths.items()}
        except Exception as error:  # noqa: BLE001 - report all malformed properties failures.
            failures.append(f"{label}: failed to load message properties: {error}")
            continue
        compare_key_sets(label, localized, failures)
        check_empty_values(label, localized, failures)
        compare_placeholders(label, localized, MESSAGE_FORMAT_RE, failures)

    check_t_fallbacks(failures)

    if failures:
        print("i18n validation: FAIL", file=sys.stderr)
        for failure in failures:
            print(f" - {failure}", file=sys.stderr)
        print("autonomous remediation:", file=sys.stderr)
        print(" - add missing locale keys to every supported locale", file=sys.stderr)
        print(" - keep interpolation placeholders identical across locales", file=sys.stderr)
        print(" - remove literal t(...) fallback strings from source callsites", file=sys.stderr)
        print(" - prefer static string-literal t('namespace.key') calls so locale coverage can be checked", file=sys.stderr)
        print(" - rerun: pnpm verify:i18n", file=sys.stderr)
        return 1

    if dynamic_callsite_count:
        print(f"i18n validation: PASS ({dynamic_callsite_count} dynamic t(...) callsite(s) skipped)")
    else:
        print("i18n validation: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
