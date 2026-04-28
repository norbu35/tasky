#!/usr/bin/env python3
"""Validate that documentation references resolve to live repo surfaces.

This guard catches surface-name drift in architecture and operating docs:
renamed classes, dropped tables/columns, removed env vars, stale endpoint
operationIds, deleted workflows, and similar inventory mismatches.

The validator intentionally focuses on *existence* rather than behavioral
accuracy. It answers "does the referenced thing still exist?" not
"does the prose perfectly describe runtime behavior?".
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import yaml


REPO_ROOT = Path(__file__).resolve().parents[3]
ALLOWLIST_FILE = REPO_ROOT / "tooling" / "config" / "doc-references-allowlist.yaml"
SCHEMA_FILE = REPO_ROOT / "tooling" / "config" / "expected-schema.json"
JAVA_ROOT = REPO_ROOT / "services" / "api" / "src" / "main" / "java"
MIGRATION_ROOT = REPO_ROOT / "services" / "api" / "src" / "main" / "resources" / "db" / "migration"
CONFIG_ROOT = REPO_ROOT / "services" / "api" / "src" / "main" / "resources"
OPENAPI_BUNDLE = REPO_ROOT / "docs" / "API.yaml"
OPENAPI_SOURCE = REPO_ROOT / "docs" / "openapi" / "openapi.yaml"
PRD_FILE = REPO_ROOT / "docs" / "PRD.md"
WORKFLOWS_ROOT = REPO_ROOT / ".github" / "workflows"

BACKEND_CLASS_DOCS = {
    Path("docs/architecture/api.md"),
    Path("docs/architecture/common.md"),
}

PACKAGE_RE = re.compile(r"^\s*package\s+([\w.]+)\s*;", re.MULTILINE)
CLASS_RE = re.compile(
    r"^\s*(?:public\s+|private\s+|protected\s+)?"
    r"(?:(?:abstract|final|sealed|static|non-sealed)\s+)*"
    r"(class|interface|enum|record)\s+([A-Z][A-Za-z0-9_]*)\b",
    re.MULTILINE,
)
METHOD_RE = re.compile(
    r"^\s*(?:@\w+(?:\([^)]*\))?\s*)*"
    r"(?:(?:public|private|protected)\s+)?"
    r"(?:(?:static|final|abstract|default|synchronized|native)\s+)*"
    r"(?:<[^>\n]+>\s*)?"
    r"[\w.<>\[\], ?@]+\s+([a-z][A-Za-z0-9_]*)\s*\(",
    re.MULTILINE,
)
FIELD_RE = re.compile(
    r"^\s*(?:@\w+(?:\([^)]*\))?\s*)*"
    r"(?:(?:public|private|protected)\s+)?"
    r"(?:(?:static|final|volatile|transient)\s+)*"
    r"[\w.<>\[\], ?@]+\s+([a-z][A-Za-z0-9_]*)\s*(?:=|;)",
    re.MULTILINE,
)

FENCED_CLAIM_START_RE = re.compile(r"^\s*```claim\s+([\w-]+)\s*$")
FENCED_BLOCK_RE = re.compile(r"^\s*```")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
JAVA_FQN_RE = re.compile(r"(?<![\w.])([a-z][\w]*(?:\.[a-z][\w]*)+\.[A-Z][A-Za-z0-9_]*)\b")
JAVA_CLASS_CALL_RE = re.compile(r"\b([A-Z][A-Za-z0-9_]{4,})\.[a-z][A-Za-z0-9_]*\(")
JAVA_CLASS_FILE_RE = re.compile(r"\b([A-Z][A-Za-z0-9_]{4,})\.(?:java|class|kt)\b")
ENV_PLACEHOLDER_RE = re.compile(r"\$\{([A-Z][A-Z0-9_]{4,})")
ENV_INLINE_RE = re.compile(r"(?<![\w.])([A-Z][A-Z0-9_]{4,})(?![\w.])")
TABLE_CONTEXT_RE = re.compile(r"\btable\s+`([a-z][a-z0-9_]*)`", re.IGNORECASE)
COLUMN_PREFIX_RE = re.compile(r"\bcolumn\s+`([a-z][a-z0-9_]*)`", re.IGNORECASE)
COLUMN_SUFFIX_RE = re.compile(r"`([a-z][a-z0-9_]*)`\s+column\b", re.IGNORECASE)
SNAKE_CODE_RE = re.compile(r"`([a-z][a-z0-9_]{2,})`")
CONFIG_KEY_RE = re.compile(r"`((?:tasky|spring|server|management)\.[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[:=][^`]*)?`")
OPERATION_RE = re.compile(r"\boperationId\s+`?([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)`?")
HTTP_PATH_RE = re.compile(r"\b(GET|POST|PUT|PATCH|DELETE)\s+(/api(?:/[^\s`*]+)+)\b")
FLYWAY_RE = re.compile(r"\b(V(\d+(?:_\d+)*)__[A-Za-z0-9_]+(?:\.sql)?)\b")
WORKFLOW_RE = re.compile(r"(?:workflow\s+)?`?([\w.-]+\.yml)`?", re.IGNORECASE)
PRD_REQ_RE = re.compile(r"\b(?:REQ-P1|NFR)-[A-Z]+-\d+\b")
VALUE_CONFIG_RE = re.compile(r'@Value\("\$\{([a-z0-9.-]+)(?::[^}]*)?\}"\)')
CONDITIONAL_PROPERTY_RE = re.compile(r"@ConditionalOnProperty\((.*?)\)", re.DOTALL)
CONDITIONAL_NAME_RE = re.compile(r'name\s*=\s*"([a-z0-9.-]+)"')
CONDITIONAL_PREFIX_RE = re.compile(r'prefix\s*=\s*"([a-z0-9.-]+)"')

BUILTIN_ENV_FALSE_POSITIVES = {"PATH", "HOME", "USER", "CI"}
LOW_SIGNAL_CLASS_NAMES = {
    "Route",
    "Screen",
    "Shared",
    "Every",
    "Module",
    "Update",
    "Design",
    "Product",
    "Feature",
    "Section",
    "ScreenA",
    "ScreenB",
}
YAML_TRUE_KEYS = {True, "true", "True"}
HTTP_METHODS = {"get", "post", "put", "patch", "delete"}
GENERIC_DB_COLUMNS = {"id", "status", "created_at", "updated_at"}


@dataclass(frozen=True)
class Reference:
    kind: str
    value: str
    source_file: Path
    line: int
    table: str | None = None
    method: str | None = None
    path: str | None = None
    profile: str | None = None


@dataclass(frozen=True)
class Failure:
    source_file: Path
    line: int
    message: str
    suggestion: str | None = None

    def as_json(self) -> dict[str, Any]:
        return {
            "file": self.source_file.as_posix(),
            "line": self.line,
            "message": self.message,
            "suggestion": self.suggestion,
        }


@dataclass(frozen=True)
class WarningRecord:
    source_file: Path
    line: int
    message: str


@dataclass
class ClassMembers:
    methods: set[str]
    fields: set[str]


@dataclass
class JavaInventory:
    by_short_name: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    by_fqn: dict[str, Path] = field(default_factory=dict)
    package_by_fqn: dict[str, str] = field(default_factory=dict)
    _member_cache: dict[str, ClassMembers] = field(default_factory=dict)

    def resolve(self, class_name: str, package: str | None = None) -> list[str]:
        if "." in class_name:
            return [class_name] if class_name in self.by_fqn else []
        if package:
            fqn = f"{package}.{class_name}"
            return [fqn] if fqn in self.by_fqn else []
        return self.by_short_name.get(class_name, [])

    def members_for(self, fqn: str) -> ClassMembers:
        if fqn in self._member_cache:
            return self._member_cache[fqn]
        path = self.by_fqn[fqn]
        text = path.read_text(encoding="utf-8")
        methods = {match.group(1) for match in METHOD_RE.finditer(text)}
        fields = {match.group(1) for match in FIELD_RE.finditer(text)}
        self._member_cache[fqn] = ClassMembers(methods=methods, fields=fields)
        return self._member_cache[fqn]


@dataclass
class SchemaInventory:
    tables: dict[str, set[str]]


@dataclass
class ConfigInventory:
    keys: set[str]
    by_profile: dict[str, set[str]]


@dataclass
class EndpointInventory:
    by_operation_id: dict[str, tuple[str, str]]
    by_method_path: dict[tuple[str, str], str]


@dataclass
class FlywayInventory:
    versions: set[str]
    filenames: set[str]


@dataclass
class WorkflowInventory:
    filenames: set[str]
    names: set[str]
    by_filename: dict[str, dict[str, Any]]


@dataclass
class PrdRequirementInventory:
    ids: set[str]


@dataclass(frozen=True)
class SuppressRule:
    kind: str
    value: str


@dataclass(frozen=True)
class IntentionalRule:
    kind: str
    value: str
    reason: str
    expires: date | None


@dataclass
class Allowlist:
    java_class_false_positives: set[str]
    env_var_false_positives: set[str]
    intentional: list[IntentionalRule]
    per_file: dict[Path, set[SuppressRule]]

    def evaluate(self, ref: Reference) -> tuple[bool, WarningRecord | None, Failure | None]:
        if ref.kind == "java-class" and ref.value in self.java_class_false_positives:
            return True, None, None
        if ref.kind == "env-var" and ref.value in self.env_var_false_positives:
            return True, None, None

        rel = ref.source_file
        if rel in self.per_file and SuppressRule(ref.kind, ref.value) in self.per_file[rel]:
            return True, None, None

        for entry in self.intentional:
            if entry.kind != ref.kind or entry.value != ref.value:
                continue
            if entry.expires is None:
                return True, None, None
            today = date.today()
            if today <= entry.expires:
                return True, None, None
            overdue = today - entry.expires
            if overdue <= timedelta(days=30):
                warning = WarningRecord(
                    source_file=ref.source_file,
                    line=ref.line,
                    message=(
                        f"Allowlist entry for {ref.kind} `{ref.value}` expired on "
                        f"{entry.expires.isoformat()}: {entry.reason}"
                    ),
                )
                return True, warning, None
            failure = Failure(
                source_file=ref.source_file,
                line=ref.line,
                message=(
                    f"Allowlist entry for {ref.kind} `{ref.value}` expired on "
                    f"{entry.expires.isoformat()} and is now blocking: {entry.reason}"
                ),
            )
            return True, None, failure
        return False, None, None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate doc surface references against live inventories.")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON instead of human-readable text.")
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Report findings but do not exit non-zero. Useful for phased rollout cleanup.",
    )
    parser.add_argument(
        "--files",
        nargs="+",
        help="Limit scanning to the provided repo-relative changed files that are in this validator's doc scope.",
    )
    return parser.parse_args()


def collect_scan_files(selected_files: list[Path] | None = None) -> list[Path]:
    files: list[Path] = []
    for path in sorted((REPO_ROOT / "docs" / "architecture").rglob("*.md")):
        files.append(path)
    for path in sorted((REPO_ROOT / "docs" / "maintenance").glob("*.md")):
        files.append(path)
    for path in sorted((JAVA_ROOT / "mn" / "tasky").glob("*/AGENTS.md")):
        files.append(path)
    if selected_files is None:
        return files

    selected: set[Path] = set()
    for raw_path in selected_files:
        path = raw_path if raw_path.is_absolute() else REPO_ROOT / raw_path
        try:
            selected.add(path.resolve().relative_to(REPO_ROOT))
        except ValueError:
            continue
    return [path for path in files if relative(path) in selected]


def load_allowlist() -> Allowlist:
    if not ALLOWLIST_FILE.exists():
        return Allowlist(set(), set(BUILTIN_ENV_FALSE_POSITIVES), [], {})

    data = yaml.safe_load(ALLOWLIST_FILE.read_text(encoding="utf-8")) or {}
    intentional = []
    for item in data.get("intentional", []):
        expires_raw = item.get("expires")
        expires = date.fromisoformat(str(expires_raw)) if expires_raw else None
        intentional.append(
            IntentionalRule(
                kind=str(item["kind"]),
                value=str(item["value"]),
                reason=str(item.get("reason", "no reason provided")),
                expires=expires,
            )
        )
    per_file: dict[Path, set[SuppressRule]] = {}
    for entry in data.get("per_file", []):
        rel = Path(entry["file"])
        rules = {
            SuppressRule(kind=str(rule["kind"]), value=str(rule["value"]))
            for rule in entry.get("suppress", [])
        }
        per_file[rel] = rules

    return Allowlist(
        java_class_false_positives=set(data.get("java_class_false_positives", [])),
        env_var_false_positives=set(data.get("env_var_false_positives", [])) | BUILTIN_ENV_FALSE_POSITIVES,
        intentional=intentional,
        per_file=per_file,
    )


def build_java_inventory() -> JavaInventory:
    inventory = JavaInventory()
    java_roots = [
        REPO_ROOT / "services" / "api" / "src" / "main" / "java",
        REPO_ROOT / "services" / "api" / "src" / "test" / "java",
    ]
    for root in java_roots:
        if not root.exists():
            continue
        for path in root.rglob("*.java"):
            text = path.read_text(encoding="utf-8")
            package_match = PACKAGE_RE.search(text)
            package_name = package_match.group(1) if package_match else ""
            for class_match in CLASS_RE.finditer(text):
                class_name = class_match.group(2)
                fqn = f"{package_name}.{class_name}" if package_name else class_name
                inventory.by_short_name[class_name].append(fqn)
                inventory.by_fqn[fqn] = path
                inventory.package_by_fqn[fqn] = package_name
    return inventory


def build_schema_inventory() -> SchemaInventory:
    data = json.loads(SCHEMA_FILE.read_text(encoding="utf-8"))
    tables = {
        table_name: set(table_data.get("columns", []))
        for table_name, table_data in data.get("tables", {}).items()
    }
    return SchemaInventory(tables=tables)


def build_env_inventory() -> set[str]:
    env_vars: set[str] = set()
    env_example_paths = [
        *REPO_ROOT.glob(".env*.example"),
        *(REPO_ROOT / "apps").glob("*/.env*.example"),
    ]
    for path in sorted(env_example_paths):
        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key = stripped.split("=", 1)[0].strip()
            if re.fullmatch(r"[A-Z][A-Z0-9_]{1,}", key):
                env_vars.add(key)
    return env_vars


def flatten_config(prefix: str, value: Any, output: set[str]) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            output.add(child_prefix)
            flatten_config(child_prefix, child, output)
        return
    if isinstance(value, list):
        if prefix:
            output.add(prefix)


def build_config_inventory() -> ConfigInventory:
    all_keys: set[str] = set()
    by_profile: dict[str, set[str]] = defaultdict(set)
    for path in sorted(CONFIG_ROOT.glob("application*.yml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        profile = "default"
        if path.stem != "application":
            profile = path.stem.removeprefix("application-")
        keys: set[str] = set()
        flatten_config("", data, keys)
        all_keys |= keys
        by_profile[profile] |= keys

    for path in JAVA_ROOT.rglob("*.java"):
        text = path.read_text(encoding="utf-8")
        for match in VALUE_CONFIG_RE.finditer(text):
            all_keys.add(match.group(1))
        for match in CONDITIONAL_PROPERTY_RE.finditer(text):
            block = match.group(1)
            name_match = CONDITIONAL_NAME_RE.search(block)
            if not name_match:
                continue
            prefix_match = CONDITIONAL_PREFIX_RE.search(block)
            if prefix_match:
                all_keys.add(f"{prefix_match.group(1)}.{name_match.group(1)}")
            else:
                all_keys.add(name_match.group(1))
    return ConfigInventory(keys=all_keys, by_profile=dict(by_profile))


def build_endpoint_inventory() -> EndpointInventory:
    source = OPENAPI_BUNDLE if OPENAPI_BUNDLE.exists() else OPENAPI_SOURCE
    data = yaml.safe_load(source.read_text(encoding="utf-8")) or {}
    servers = data.get("servers") or []
    base_path = ""
    if servers:
        base_path = str(servers[0].get("url", "")).rstrip("/")
    by_operation_id: dict[str, tuple[str, str]] = {}
    by_method_path: dict[tuple[str, str], str] = {}
    for raw_path, path_item in (data.get("paths") or {}).items():
        if not isinstance(path_item, dict):
            continue
        full_path = f"{base_path}{raw_path}" if base_path else str(raw_path)
        for method, operation in path_item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            operation_id = operation.get("operationId")
            if not operation_id:
                continue
            normalized_method = method.upper()
            by_operation_id[str(operation_id)] = (normalized_method, full_path)
            by_method_path[(normalized_method, full_path)] = str(operation_id)
    return EndpointInventory(by_operation_id=by_operation_id, by_method_path=by_method_path)


def normalize_flyway_version(raw: str) -> str:
    return raw.replace("_", ".")


def build_flyway_inventory() -> FlywayInventory:
    versions: set[str] = set()
    filenames: set[str] = set()
    for path in sorted(MIGRATION_ROOT.glob("V*.sql")):
        filenames.add(path.name)
        match = re.match(r"^V(\d+(?:_\d+)*)__", path.name)
        if match:
            versions.add(normalize_flyway_version(match.group(1)))
    return FlywayInventory(versions=versions, filenames=filenames)


def workflow_triggers(data: dict[str, Any]) -> set[str]:
    raw_on = data.get("on")
    if raw_on is None and True in data:
        raw_on = data[True]
    if raw_on is None:
        return set()
    if isinstance(raw_on, str):
        return {raw_on}
    if isinstance(raw_on, list):
        return {str(item) for item in raw_on}
    if isinstance(raw_on, dict):
        return {str(key) for key in raw_on.keys()}
    return set()


def build_workflow_inventory() -> WorkflowInventory:
    filenames: set[str] = set()
    names: set[str] = set()
    by_filename: dict[str, dict[str, Any]] = {}
    for path in sorted(WORKFLOWS_ROOT.glob("*.yml")):
        data = yaml.load(path.read_text(encoding="utf-8"), Loader=yaml.BaseLoader) or {}
        filename = path.name
        filenames.add(filename)
        name = str(data.get("name", filename))
        names.add(name)
        by_filename[filename] = {"name": name, "triggers": workflow_triggers(data)}
    return WorkflowInventory(filenames=filenames, names=names, by_filename=by_filename)


def build_prd_requirement_inventory() -> PrdRequirementInventory:
    if not PRD_FILE.exists():
        return PrdRequirementInventory(ids=set())
    return PrdRequirementInventory(ids=set(PRD_REQ_RE.findall(PRD_FILE.read_text(encoding="utf-8"))))


def relative(path: Path) -> Path:
    return path.relative_to(REPO_ROOT)


def should_scan_backend_symbols(rel: Path) -> bool:
    return rel in BACKEND_CLASS_DOCS or (
        len(rel.parts) >= 8
        and rel.parts[:5] == ("services", "api", "src", "main", "java")
        and rel.name == "AGENTS.md"
    )


def looks_like_class_name(token: str) -> bool:
    if not token or not token[0].isupper():
        return False
    if token in LOW_SIGNAL_CLASS_NAMES:
        return False
    if len(token) < 5:
        return False
    if "_" in token:
        return False
    if token.upper() == token:
        return False
    if not any(ch.islower() for ch in token):
        return False
    return True


def looks_like_env_var(token: str) -> bool:
    prefixes = (
        "APP_",
        "POSTGRES_",
        "MINIO_",
        "FIREBASE_",
        "VITE_",
        "EXPO_",
        "SPRING_",
        "HIKARI_",
        "PGBOUNCER_",
        "STAGING_",
        "TASKY_",
    )
    return token.startswith(prefixes)


def add_reference(seen: set[tuple[Any, ...]], refs: list[Reference], ref: Reference) -> None:
    key = (ref.kind, ref.value, ref.source_file, ref.line, ref.table, ref.method, ref.path, ref.profile)
    if key in seen:
        return
    seen.add(key)
    refs.append(ref)


def extract_line_references(line: str, rel: Path, line_no: int, seen: set[tuple[Any, ...]]) -> list[Reference]:
    refs: list[Reference] = []

    for match in JAVA_FQN_RE.finditer(line):
        add_reference(seen, refs, Reference("java-fqn", match.group(1), rel, line_no))

    for match in ENV_PLACEHOLDER_RE.finditer(line):
        add_reference(seen, refs, Reference("env-var", match.group(1), rel, line_no))

    for match in HTTP_PATH_RE.finditer(line):
        add_reference(
            seen,
            refs,
            Reference("endpoint", f"{match.group(1)} {match.group(2)}", rel, line_no, method=match.group(1), path=match.group(2)),
        )

    for match in OPERATION_RE.finditer(line):
        add_reference(seen, refs, Reference("endpoint", match.group(1), rel, line_no))

    for match in FLYWAY_RE.finditer(line):
        full = match.group(1)
        if full.endswith(".sql"):
            value = full
        else:
            value = normalize_flyway_version(match.group(2))
        add_reference(seen, refs, Reference("flyway", value, rel, line_no))

    for match in CONFIG_KEY_RE.finditer(line):
        add_reference(seen, refs, Reference("config-key", match.group(1), rel, line_no))

    for match in TABLE_CONTEXT_RE.finditer(line):
        add_reference(seen, refs, Reference("db-table", match.group(1), rel, line_no))

    table_context = None
    table_match = TABLE_CONTEXT_RE.search(line)
    if table_match:
        table_context = table_match.group(1)

    for match in COLUMN_PREFIX_RE.finditer(line):
        add_reference(seen, refs, Reference("db-column", match.group(1), rel, line_no, table=table_context))
    for match in COLUMN_SUFFIX_RE.finditer(line):
        add_reference(seen, refs, Reference("db-column", match.group(1), rel, line_no, table=table_context))

    if "workflow" in line.lower() or ".yml" in line:
        for match in WORKFLOW_RE.finditer(line):
            value = match.group(1)
            if value.startswith("application") or value.startswith("docker-compose") or value.startswith("registry") or "/" in value:
                continue
            add_reference(seen, refs, Reference("workflow", value, rel, line_no))

    if should_scan_backend_symbols(rel):
        for span in CODE_SPAN_RE.finditer(line):
            code = span.group(1).strip()
            if "<" in code or ">" in code:
                continue
            if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", code) and looks_like_class_name(code):
                add_reference(seen, refs, Reference("java-class", code, rel, line_no))
            elif re.fullmatch(r"[a-z][a-z0-9_]*", code):
                if "table" in line.lower():
                    add_reference(seen, refs, Reference("db-table", code, rel, line_no))
                if "column" in line.lower():
                    add_reference(seen, refs, Reference("db-column", code, rel, line_no, table=table_context))

        for match in JAVA_CLASS_CALL_RE.finditer(line):
            name = match.group(1)
            if looks_like_class_name(name):
                add_reference(seen, refs, Reference("java-class", name, rel, line_no))

        for match in JAVA_CLASS_FILE_RE.finditer(line):
            name = match.group(1)
            if looks_like_class_name(name):
                add_reference(seen, refs, Reference("java-class", name, rel, line_no))

    for match in SNAKE_CODE_RE.finditer(line):
        token = match.group(1)
        if "table" in line.lower():
            add_reference(seen, refs, Reference("db-table", token, rel, line_no))

    if "${" not in line:
        for match in ENV_INLINE_RE.finditer(line):
            token = match.group(1)
            if token in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                continue
            if not looks_like_env_var(token):
                continue
            add_reference(seen, refs, Reference("env-var", token, rel, line_no))

    return refs


def parse_claim_block(claim_type: str, body: str, rel: Path, line_no: int) -> tuple[list[Reference], list[Failure]]:
    try:
        data = yaml.safe_load(body) or {}
    except yaml.YAMLError as exc:
        return [], [Failure(rel, line_no, f"Claim block parse error for `{claim_type}`: {exc}")]
    if not isinstance(data, dict):
        return [], [Failure(rel, line_no, f"Claim block `{claim_type}` must decode to a YAML mapping.")]

    refs: list[Reference] = []
    failures: list[Failure] = []

    def require(key: str) -> Any | None:
        if key not in data:
            failures.append(Failure(rel, line_no, f"Claim `{claim_type}` is missing required key `{key}`."))
            return None
        return data[key]

    if claim_type == "symbol-exists":
        class_name = require("class")
        if class_name is not None:
            refs.append(
                Reference(
                    kind="claim:symbol-exists",
                    value=str(class_name),
                    source_file=rel,
                    line=line_no,
                    method=str(data["method"]) if "method" in data else None,
                )
            )
    elif claim_type == "db-table":
        table = require("table")
        if table is not None:
            refs.append(Reference("claim:db-table", str(table), rel, line_no))
    elif claim_type == "env-var":
        name = require("name")
        if name is not None:
            refs.append(Reference("env-var", str(name), rel, line_no))
    elif claim_type == "endpoint":
        operation_id = require("operationId")
        if operation_id is not None:
            refs.append(
                Reference(
                    "claim:endpoint",
                    str(operation_id),
                    rel,
                    line_no,
                    method=str(data["method"]).upper() if "method" in data else None,
                    path=str(data["path"]) if "path" in data else None,
                )
            )
    elif claim_type == "config-key":
        key = require("key")
        if key is not None:
            refs.append(
                Reference(
                    "claim:config-key",
                    str(key),
                    rel,
                    line_no,
                    profile=str(data["profile"]) if "profile" in data else None,
                )
            )
    elif claim_type == "flyway":
        version = data.get("version")
        filename = data.get("filename")
        if version is None and filename is None:
            failures.append(Failure(rel, line_no, "Claim `flyway` requires `version` or `filename`."))
        if version is not None:
            refs.append(Reference("claim:flyway-version", normalize_flyway_version(str(version)), rel, line_no))
        if filename is not None:
            refs.append(Reference("claim:flyway-filename", str(filename), rel, line_no))
    elif claim_type == "workflow":
        filename = require("filename")
        if filename is not None:
            refs.append(Reference("claim:workflow", str(filename), rel, line_no))
    elif claim_type == "prd-req":
        req_id = require("id")
        if req_id is not None:
            refs.append(Reference("claim:prd-req", str(req_id), rel, line_no))
    else:
        failures.append(Failure(rel, line_no, f"Unsupported claim type `{claim_type}`."))

    return refs, failures


def scan_doc(path: Path) -> tuple[list[Reference], list[Failure]]:
    refs: list[Reference] = []
    failures: list[Failure] = []
    seen: set[tuple[Any, ...]] = set()
    rel = relative(path)
    lines = path.read_text(encoding="utf-8").splitlines()
    in_claim = False
    claim_type = ""
    claim_start = 0
    claim_lines: list[str] = []

    for index, line in enumerate(lines, start=1):
        claim_start_match = FENCED_CLAIM_START_RE.match(line)
        if claim_start_match and not in_claim:
            in_claim = True
            claim_type = claim_start_match.group(1)
            claim_start = index
            claim_lines = []
            continue

        if in_claim:
            if FENCED_BLOCK_RE.match(line):
                claim_refs, claim_failures = parse_claim_block(claim_type, "\n".join(claim_lines), rel, claim_start)
                refs.extend(claim_refs)
                failures.extend(claim_failures)
                in_claim = False
                claim_type = ""
                claim_lines = []
            else:
                claim_lines.append(line)
            continue

        refs.extend(extract_line_references(line, rel, index, seen))

    if in_claim:
        failures.append(Failure(rel, claim_start, f"Unterminated claim block `{claim_type}`."))

    return refs, failures


def closest(value: str, choices: set[str] | list[str], cutoff: float = 0.7) -> str | None:
    matches = difflib.get_close_matches(value, list(choices), n=2, cutoff=cutoff)
    return matches[0] if matches else None


def validate_java_class(ref: Reference, inventory: JavaInventory) -> list[Failure]:
    if inventory.resolve(ref.value):
        return []
    suggestion = closest(ref.value, set(inventory.by_short_name))
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Java class `{ref.value}` not found in services/api/src/main/java.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_java_fqn(ref: Reference, inventory: JavaInventory) -> list[Failure]:
    if ref.value in inventory.by_fqn:
        return []
    suggestion = closest(ref.value, set(inventory.by_fqn), cutoff=0.6)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Java FQN `{ref.value}` not found in services/api/src/main/java.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_db_table(ref: Reference, inventory: SchemaInventory) -> list[Failure]:
    if ref.value in inventory.tables:
        return []
    suggestion = closest(ref.value, set(inventory.tables))
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"DB table `{ref.value}` not found in tooling/config/expected-schema.json.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_db_column(ref: Reference, inventory: SchemaInventory) -> list[Failure]:
    if ref.table:
        if ref.table not in inventory.tables:
            table_hint = closest(ref.table, set(inventory.tables))
            return [
                Failure(
                    ref.source_file,
                    ref.line,
                    f"DB table `{ref.table}` not found while checking column `{ref.value}`.",
                    f"Did you mean table: {table_hint}?" if table_hint else None,
                )
            ]
        if ref.value in inventory.tables[ref.table]:
            return []
        suggestion = closest(ref.value, inventory.tables[ref.table], cutoff=0.6)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"DB column `{ref.value}` does not exist on table `{ref.table}`.",
                (
                    f"Did you mean: {suggestion}? Available columns: "
                    f"{', '.join(sorted(inventory.tables[ref.table]))}"
                )
                if suggestion
                else f"Available columns: {', '.join(sorted(inventory.tables[ref.table]))}",
            )
        ]

    matches = sorted(table for table, columns in inventory.tables.items() if ref.value in columns)
    if matches:
        return []
    all_columns = {column for columns in inventory.tables.values() for column in columns}
    suggestion = closest(ref.value, all_columns, cutoff=0.7)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"DB column `{ref.value}` not found on any known table. Use a claim block or `table ...` context for table-specific checks.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def generic_unscoped_db_column_warning(ref: Reference, inventory: SchemaInventory) -> WarningRecord | None:
    if ref.kind != "db-column" or ref.table or ref.value not in GENERIC_DB_COLUMNS:
        return None
    matches = sorted(table for table, columns in inventory.tables.items() if ref.value in columns)
    if not matches:
        return None
    return WarningRecord(
        ref.source_file,
        ref.line,
        (
            f"Generic DB column `{ref.value}` is referenced without table context. "
            "Use same-line table context or a claim:db-table block for precise schema assertions. "
            f"Matching tables: {', '.join(matches)}"
        ),
    )


def validate_env_var(ref: Reference, inventory: set[str]) -> list[Failure]:
    if ref.value in inventory:
        return []
    suggestion = closest(ref.value, inventory, cutoff=0.6)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Env var `{ref.value}` not found in root or app-level .env*.example files.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_config_key(ref: Reference, inventory: ConfigInventory) -> list[Failure]:
    keys = inventory.keys if ref.profile is None else inventory.by_profile.get(ref.profile, set())
    if ref.value in keys:
        return []
    scope = f" for profile `{ref.profile}`" if ref.profile else ""
    suggestion = closest(ref.value, keys, cutoff=0.6)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Config key `{ref.value}` not found in application*.yml{scope}.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_endpoint(ref: Reference, inventory: EndpointInventory) -> list[Failure]:
    if ref.method and ref.path:
        key = (ref.method.upper(), ref.path)
        if key in inventory.by_method_path:
            return []
        suggestion_path = None
        known_paths = {path for method, path in inventory.by_method_path if method == ref.method.upper()}
        if known_paths:
            suggestion_path = closest(ref.path, known_paths, cutoff=0.5)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Endpoint `{ref.method.upper()} {ref.path}` not found in bundled OpenAPI.",
                (
                    f"Closest {ref.method.upper()} path: {suggestion_path}"
                    if suggestion_path
                    else None
                ),
            )
        ]
    if ref.value in inventory.by_operation_id:
        return []
    suggestion = closest(ref.value, set(inventory.by_operation_id), cutoff=0.6)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"OpenAPI operationId `{ref.value}` not found in bundled OpenAPI.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_flyway(ref: Reference, inventory: FlywayInventory) -> list[Failure]:
    if ref.value.endswith(".sql"):
        if ref.value in inventory.filenames:
            return []
        suggestion = closest(ref.value, inventory.filenames, cutoff=0.5)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Flyway migration file `{ref.value}` not found under db/migration.",
                f"Did you mean: {suggestion}?" if suggestion else None,
            )
        ]
    if ref.value in inventory.versions:
        return []
    suggestion = closest(ref.value, inventory.versions, cutoff=0.5)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Flyway migration version `{ref.value}` not found under db/migration.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def validate_workflow(ref: Reference, inventory: WorkflowInventory) -> list[Failure]:
    if ref.value in inventory.filenames:
        return []
    suggestion = closest(ref.value, inventory.filenames, cutoff=0.5)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Workflow `{ref.value}` not found under .github/workflows.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def claim_payload(path: Path, line_no: int) -> dict[str, Any]:
    lines = path.read_text(encoding="utf-8").splitlines()
    body: list[str] = []
    started = False
    for index, line in enumerate(lines, start=1):
        if index == line_no:
            started = True
            continue
        if started:
            if FENCED_BLOCK_RE.match(line):
                break
            body.append(line)
    data = yaml.safe_load("\n".join(body)) or {}
    return data if isinstance(data, dict) else {}


def validate_claim_symbol_exists(ref: Reference, inventory: JavaInventory, payload: dict[str, Any]) -> list[Failure]:
    package = str(payload["package"]) if "package" in payload else None
    candidates = inventory.resolve(ref.value, package=package)
    if not candidates:
        suggestion = closest(ref.value, set(inventory.by_short_name), cutoff=0.6)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Claim symbol-exists failed: class `{ref.value}` not found.",
                f"Did you mean: {suggestion}?" if suggestion else None,
            )
        ]
    if "." not in ref.value and package is None and len(candidates) > 1:
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Claim symbol-exists is ambiguous for class `{ref.value}`. Use a FQN or `package`.",
            )
        ]
    target = candidates[0]
    failures: list[Failure] = []
    if "method" in payload:
        method = str(payload["method"])
        members = inventory.members_for(target)
        if method not in members.methods:
            suggestion = closest(method, members.methods, cutoff=0.5)
            failures.append(
                Failure(
                    ref.source_file,
                    ref.line,
                    f"Claim symbol-exists failed: method `{method}` not found on `{target}`.",
                    f"Did you mean: {suggestion}?" if suggestion else None,
                )
            )
    if "field" in payload:
        field_name = str(payload["field"])
        members = inventory.members_for(target)
        if field_name not in members.fields:
            suggestion = closest(field_name, members.fields, cutoff=0.5)
            failures.append(
                Failure(
                    ref.source_file,
                    ref.line,
                    f"Claim symbol-exists failed: field `{field_name}` not found on `{target}`.",
                    f"Did you mean: {suggestion}?" if suggestion else None,
                )
            )
    return failures


def validate_claim_db_table(ref: Reference, inventory: SchemaInventory, payload: dict[str, Any]) -> list[Failure]:
    table = ref.value
    if table not in inventory.tables:
        suggestion = closest(table, set(inventory.tables), cutoff=0.6)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Claim db-table failed: table `{table}` not found.",
                f"Did you mean: {suggestion}?" if suggestion else None,
            )
        ]
    columns = inventory.tables[table]
    failures: list[Failure] = []
    for column in payload.get("required_columns", []) or []:
        if column not in columns:
            suggestion = closest(str(column), columns, cutoff=0.6)
            failures.append(
                Failure(
                    ref.source_file,
                    ref.line,
                    f"Claim db-table failed: required column `{column}` not present on `{table}`.",
                    (
                        f"Did you mean: {suggestion}? Available: {', '.join(sorted(columns))}"
                        if suggestion
                        else f"Available: {', '.join(sorted(columns))}"
                    ),
                )
            )
    for column in payload.get("forbidden_columns", []) or []:
        if column in columns:
            failures.append(
                Failure(
                    ref.source_file,
                    ref.line,
                    f"Claim db-table failed: forbidden column `{column}` is still present on `{table}`.",
                    f"Available: {', '.join(sorted(columns))}",
                )
            )
    return failures


def validate_claim_endpoint(ref: Reference, inventory: EndpointInventory, payload: dict[str, Any]) -> list[Failure]:
    if ref.value not in inventory.by_operation_id:
        suggestion = closest(ref.value, set(inventory.by_operation_id), cutoff=0.6)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Claim endpoint failed: operationId `{ref.value}` not found.",
                f"Did you mean: {suggestion}?" if suggestion else None,
            )
        ]
    actual_method, actual_path = inventory.by_operation_id[ref.value]
    failures: list[Failure] = []
    if "method" in payload and str(payload["method"]).upper() != actual_method:
        failures.append(
            Failure(
                ref.source_file,
                ref.line,
                f"Claim endpoint failed: operationId `{ref.value}` is `{actual_method}`, not `{str(payload['method']).upper()}`.",
            )
        )
    if "path" in payload and str(payload["path"]) != actual_path:
        failures.append(
            Failure(
                ref.source_file,
                ref.line,
                f"Claim endpoint failed: operationId `{ref.value}` path is `{actual_path}`, not `{payload['path']}`.",
            )
        )
    return failures


def validate_claim_workflow(ref: Reference, inventory: WorkflowInventory, payload: dict[str, Any]) -> list[Failure]:
    filename = ref.value
    if filename not in inventory.by_filename:
        suggestion = closest(filename, inventory.filenames, cutoff=0.5)
        return [
            Failure(
                ref.source_file,
                ref.line,
                f"Claim workflow failed: file `{filename}` not found.",
                f"Did you mean: {suggestion}?" if suggestion else None,
            )
        ]
    info = inventory.by_filename[filename]
    failures: list[Failure] = []
    if "name" in payload and str(payload["name"]) != info["name"]:
        failures.append(
            Failure(
                ref.source_file,
                ref.line,
                f"Claim workflow failed: `{filename}` name is `{info['name']}`, not `{payload['name']}`.",
            )
        )
    for trigger in payload.get("triggers", []) or []:
        if str(trigger) not in info["triggers"]:
            failures.append(
                Failure(
                    ref.source_file,
                    ref.line,
                    f"Claim workflow failed: `{filename}` does not declare trigger `{trigger}`.",
                    f"Available triggers: {', '.join(sorted(info['triggers']))}" if info["triggers"] else None,
                )
            )
    return failures


def validate_claim_prd_req(ref: Reference, inventory: PrdRequirementInventory) -> list[Failure]:
    if ref.value in inventory.ids:
        return []
    suggestion = closest(ref.value, inventory.ids, cutoff=0.55)
    return [
        Failure(
            ref.source_file,
            ref.line,
            f"Claim prd-req failed: PRD requirement `{ref.value}` not found in docs/PRD.md.",
            f"Did you mean: {suggestion}?" if suggestion else None,
        )
    ]


def sort_failures(failures: list[Failure]) -> list[Failure]:
    return sorted(failures, key=lambda item: (item.source_file.as_posix(), item.line, item.message))


def main() -> int:
    args = parse_args()
    allowlist = load_allowlist()
    java_inventory = build_java_inventory()
    schema_inventory = build_schema_inventory()
    env_inventory = build_env_inventory()
    config_inventory = build_config_inventory()
    endpoint_inventory = build_endpoint_inventory()
    flyway_inventory = build_flyway_inventory()
    workflow_inventory = build_workflow_inventory()
    prd_requirement_inventory = build_prd_requirement_inventory()

    selected_files = [Path(item) for item in args.files] if args.files is not None else None
    scan_files = collect_scan_files(selected_files)
    failures: list[Failure] = []
    warnings: list[WarningRecord] = []
    claim_payloads: dict[tuple[Path, int], dict[str, Any]] = {}

    for path in scan_files:
        refs, scan_failures = scan_doc(path)
        failures.extend(scan_failures)
        rel = relative(path)
        for ref in refs:
            suppressed, warning, allowlist_failure = allowlist.evaluate(ref)
            if warning:
                warnings.append(warning)
            if allowlist_failure:
                failures.append(allowlist_failure)
            if suppressed:
                continue

            if ref.kind == "java-class":
                failures.extend(validate_java_class(ref, java_inventory))
            elif ref.kind == "java-fqn":
                failures.extend(validate_java_fqn(ref, java_inventory))
            elif ref.kind == "db-table":
                failures.extend(validate_db_table(ref, schema_inventory))
            elif ref.kind == "db-column":
                failures.extend(validate_db_column(ref, schema_inventory))
                if args.report_only:
                    generic_warning = generic_unscoped_db_column_warning(ref, schema_inventory)
                    if generic_warning:
                        warnings.append(generic_warning)
            elif ref.kind == "env-var":
                failures.extend(validate_env_var(ref, env_inventory))
            elif ref.kind == "config-key":
                failures.extend(validate_config_key(ref, config_inventory))
            elif ref.kind == "endpoint":
                failures.extend(validate_endpoint(ref, endpoint_inventory))
            elif ref.kind == "flyway":
                failures.extend(validate_flyway(ref, flyway_inventory))
            elif ref.kind == "workflow":
                failures.extend(validate_workflow(ref, workflow_inventory))
            elif ref.kind.startswith("claim:"):
                key = (rel, ref.line)
                if key not in claim_payloads:
                    claim_payloads[key] = claim_payload(path, ref.line)
                payload = claim_payloads[key]
                if ref.kind == "claim:symbol-exists":
                    failures.extend(validate_claim_symbol_exists(ref, java_inventory, payload))
                elif ref.kind == "claim:db-table":
                    failures.extend(validate_claim_db_table(ref, schema_inventory, payload))
                elif ref.kind == "claim:endpoint":
                    failures.extend(validate_claim_endpoint(ref, endpoint_inventory, payload))
                elif ref.kind == "claim:config-key":
                    failures.extend(validate_config_key(Reference("config-key", ref.value, ref.source_file, ref.line, profile=ref.profile), config_inventory))
                elif ref.kind == "claim:flyway-version":
                    failures.extend(validate_flyway(Reference("flyway", ref.value, ref.source_file, ref.line), flyway_inventory))
                elif ref.kind == "claim:flyway-filename":
                    failures.extend(validate_flyway(Reference("flyway", ref.value, ref.source_file, ref.line), flyway_inventory))
                elif ref.kind == "claim:workflow":
                    failures.extend(validate_claim_workflow(ref, workflow_inventory, payload))
                elif ref.kind == "claim:prd-req":
                    failures.extend(validate_claim_prd_req(ref, prd_requirement_inventory))

    failures = sort_failures(failures)
    warnings = sorted(warnings, key=lambda item: (item.source_file.as_posix(), item.line, item.message))

    if args.json:
        print(
            json.dumps(
                {
                    "status": "report" if args.report_only else ("fail" if failures else "pass"),
                    "failures": [failure.as_json() for failure in failures],
                    "warnings": [
                        {
                            "file": warning.source_file.as_posix(),
                            "line": warning.line,
                            "message": warning.message,
                        }
                        for warning in warnings
                    ],
                    "files_scanned": len(scan_files),
                },
                indent=2,
            )
        )
        return 0 if (args.report_only or not failures) else 1

    status = "PASS" if not failures else ("REPORT" if args.report_only else "FAIL")
    print(f"doc-claims: {status}")
    for failure in failures:
        print(f" - {failure.source_file.as_posix()}:{failure.line}: {failure.message}")
        if failure.suggestion:
            print(f"     {failure.suggestion}")
    for warning in warnings:
        print(f" - {warning.source_file.as_posix()}:{warning.line}: warning: {warning.message}")

    if failures:
        print(
            f"doc-claims: {len(failures)} failure(s) across "
            f"{len({failure.source_file for failure in failures})} file(s). Run with --json for structured output."
        )
        print("autonomous remediation:")
        print(" - run: pnpm repo:docs:claims:triage")
        print(" - follow: tooling/skills/doc-claims-remediation/SKILL.md")
        print(" - fix prose first, add claim blocks for load-bearing assertions, touch allowlist only for intentional historical/external refs")
        print(" - rerun: pnpm repo:docs:check")
    else:
        print(f"doc-claims: PASS ({len(scan_files)} files scanned)")

    return 0 if (args.report_only or not failures) else 1


if __name__ == "__main__":
    sys.exit(main())
