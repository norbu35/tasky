#!/usr/bin/env python3
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
MIGRATION_DIR = REPO_ROOT / "services" / "api" / "src" / "main" / "resources" / "db" / "migration"
VERSIONED_RE = re.compile(r"^V([0-9]+(?:_[0-9]+)*)__[A-Za-z0-9_]+\.sql$")
REPEATABLE_RE = re.compile(r"^R__[A-Za-z0-9_]+\.sql$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Flyway migration naming and immutability."
    )
    parser.add_argument(
        "--base",
        default="",
        help="Git base ref for committed-diff validation (defaults to SELF_VERIFY_BASE_REF or merge-base).",
    )
    return parser.parse_args()


def run_git(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )


def git_available() -> bool:
    result = run_git(["rev-parse", "--is-inside-work-tree"])
    return result.returncode == 0 and result.stdout.strip() == "true"


def resolve_base_ref(cli_base: str) -> str:
    if cli_base:
        return cli_base

    env_base = os.environ.get("SELF_VERIFY_BASE_REF", "").strip()
    if env_base:
        return env_base

    for ref in ("origin/main", "main", "origin/master", "master"):
        if run_git(["rev-parse", "--verify", ref]).returncode != 0:
            continue
        merge_base = run_git(["merge-base", "HEAD", ref])
        if merge_base.returncode == 0 and merge_base.stdout.strip():
            return merge_base.stdout.strip()

    if run_git(["rev-parse", "--verify", "HEAD~1"]).returncode == 0:
        return "HEAD~1"
    return ""


def is_versioned_path(path: str) -> bool:
    path_obj = Path(path)
    if path_obj.suffix.lower() != ".sql":
        return False
    if path_obj.parent != MIGRATION_DIR:
        return False
    return VERSIONED_RE.match(path_obj.name) is not None


def detect_naming_errors(files: list[Path]) -> list[str]:
    errors: list[str] = []
    seen_versions: set[str] = set()

    for path in files:
        name = path.name
        versioned = VERSIONED_RE.match(name)
        if versioned:
            version = versioned.group(1)
            if version in seen_versions:
                errors.append(f"Duplicate Flyway version detected: {version} ({name})")
            seen_versions.add(version)
            continue
        if REPEATABLE_RE.match(name):
            continue
        errors.append(f"Invalid Flyway migration naming: {name}")

    return errors


def parse_name_status_line(line: str) -> tuple[str, str, str]:
    parts = line.split("\t")
    status = parts[0]
    code = status[0] if status else ""
    if code in {"R", "C"} and len(parts) >= 3:
        return code, parts[1], parts[2]
    if len(parts) >= 2:
        return code, parts[1], ""
    return "", "", ""


def detect_versioned_mutations_from_diff(base_ref: str) -> list[str]:
    if not base_ref:
        return []

    result = run_git(
        [
            "diff",
            "--name-status",
            "--find-renames",
            f"{base_ref}...HEAD",
            "--",
            str(MIGRATION_DIR),
        ]
    )
    if result.returncode != 0:
        return [f"Unable to diff migrations against base ref '{base_ref}': {result.stderr.strip()}"]

    errors: list[str] = []
    for line in result.stdout.splitlines():
        code, old_path, new_path = parse_name_status_line(line)
        if not code:
            continue
        if code == "A":
            # New versioned migrations are allowed.
            continue
        if code in {"M", "D", "T", "U"} and is_versioned_path(old_path):
            errors.append(
                f"Immutable versioned migration changed in commit range ({base_ref}...HEAD): {old_path} [{code}]"
            )
        if code in {"R", "C"}:
            if is_versioned_path(old_path):
                errors.append(
                    f"Immutable versioned migration renamed/copied in commit range ({base_ref}...HEAD): {old_path} -> {new_path} [{code}]"
                )
            elif is_versioned_path(new_path):
                errors.append(
                    f"Versioned migration introduced via rename/copy (use a new V* file instead): {old_path} -> {new_path} [{code}]"
                )

    return errors


def detect_versioned_mutations_in_worktree() -> list[str]:
    result = run_git(["status", "--porcelain", "--", str(MIGRATION_DIR)])
    if result.returncode != 0:
        return [f"Unable to inspect working tree migration status: {result.stderr.strip()}"]

    errors: list[str] = []
    for raw_line in result.stdout.splitlines():
        line = raw_line.rstrip()
        if len(line) < 4:
            continue
        status = line[:2]
        path_spec = line[3:]
        if status == "??":
            # Untracked files are additions and are allowed.
            continue

        if " -> " in path_spec:
            old_path, new_path = path_spec.split(" -> ", 1)
            if is_versioned_path(old_path):
                errors.append(
                    f"Immutable versioned migration renamed in working tree: {old_path} -> {new_path}"
                )
            elif is_versioned_path(new_path):
                errors.append(
                    f"Versioned migration introduced via rename in working tree (create a new V* file instead): {old_path} -> {new_path}"
                )
            continue

        x_status, y_status = status[0], status[1]
        if not is_versioned_path(path_spec):
            continue
        if x_status in {"M", "D", "T", "U"} or y_status in {"M", "D", "T", "U"}:
            errors.append(
                f"Immutable versioned migration changed in working tree: {path_spec} [{status}]"
            )

    return errors


def main() -> int:
    args = parse_args()

    if not MIGRATION_DIR.exists():
        print(f"Migration directory missing: {MIGRATION_DIR}", file=sys.stderr)
        return 1

    files = sorted(p for p in MIGRATION_DIR.glob("*.sql"))
    if not files:
        print("No migration SQL files found. Migration safety check passed.")
        return 0

    errors = detect_naming_errors(files)

    if git_available():
        base_ref = resolve_base_ref(args.base)
        errors.extend(detect_versioned_mutations_from_diff(base_ref))
        errors.extend(detect_versioned_mutations_in_worktree())

    if errors:
        unique_errors = list(dict.fromkeys(errors))
        print("Migration validation errors:", file=sys.stderr)
        for item in unique_errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    print(f"Migration safety check passed. Files checked: {len(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
