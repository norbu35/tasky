#!/usr/bin/env python3
import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MIGRATION_DIR = REPO_ROOT / "services" / "api" / "src" / "main" / "resources" / "db" / "migration"
VERSIONED_RE = re.compile(r"^V([0-9]+(?:_[0-9]+)*)__[A-Za-z0-9_]+\.sql$")
REPEATABLE_RE = re.compile(r"^R__[A-Za-z0-9_]+\.sql$")
BASELINE_RESET_FILE_NAME = "V1__baseline.sql"
BASELINE_RESET_OLD_MIGRATION_NAMES = frozenset(
    [
        "V1__initial_schema.sql",
        "V2__seed_categories.sql",
        "V3__moderation_policy_and_reliability.sql",
        "V4__idempotency_and_booking_done_signal.sql",
        "V5__idempotency_user_fk_relax.sql",
        "V6__facebook_oauth.sql",
        "V7__distributed_rate_limit_counters.sql",
        "V8__domain_outbox_events.sql",
        "V9__read_path_indexes.sql",
        "V10__phase0_schema_alignment.sql",
        "V11__seed_intake_schemas.sql",
        "V12__deferred_tiers_tables.sql",
        "V13__shedlock_table.sql",
        "V14__device_token_platform_constraint.sql",
        "V15__districts_and_service_areas.sql",
        "V16__wallet_balance_constraints.sql",
        "V17__instant_match_revocation.sql",
        "V18__booking_intents.sql",
        "V19__seed_test_data.sql",
        "V20__location_subsystem.sql",
        "V21__profile_last_active.sql",
        "V22__tasky_v2_projection_read_models.sql",
        "V23__outbox_context_propagation.sql",
        "V24__outbox_additional_context.sql",
        "V25__event_idempotency_table.sql",
        "V26__review_enforcement_cases_unique_constraint.sql",
        "V27__profiles_add_bio.sql",
        "V28__users_status_allow_deleted.sql",
        "V29__rescue_intervention_type.sql",
        "V30__dual_pricing_model.sql",
        "V31__prd_alignment.sql",
        "V32__task_rescue_intervention_stage.sql",
        "V33__category_assisted_distribution_enabled.sql",
        "V34__align_rescue_intervention_type_values.sql",
        "V35__booking_intents_application_selection.sql",
        "V36__dispute_evidence_grace_state.sql",
        "V37__message_history_ordering_index.sql",
        "V38__public_task_feed_projection.sql",
    ]
)


def print_remediation() -> None:
    print("autonomous remediation:", file=sys.stderr)
    print(" - versioned Flyway migrations are immutable once introduced", file=sys.stderr)
    print(" - create a new V* migration for follow-up schema changes instead of editing or renaming an existing one", file=sys.stderr)
    print(" - rerun: python3 tooling/scripts/governance/validate-migrations.py", file=sys.stderr)


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
    if not path_obj.is_absolute():
        path_obj = REPO_ROOT / path_obj
    path_obj = path_obj.resolve()
    if path_obj.suffix.lower() != ".sql":
        return False
    if path_obj.parent != MIGRATION_DIR.resolve():
        return False
    return VERSIONED_RE.match(path_obj.name) is not None


def migration_name(path: str) -> str:
    return Path(path).name


def baseline_reset_layout_active() -> bool:
    names = sorted(p.name for p in MIGRATION_DIR.glob("*.sql"))
    return names == [BASELINE_RESET_FILE_NAME]


def baseline_reset_diff_is_exact(lines: list[str]) -> bool:
    added: set[str] = set()
    deleted: set[str] = set()
    unexpected: list[str] = []

    for line in lines:
        code, old_path, new_path = parse_name_status_line(line)
        if not code:
            continue
        if code == "A":
            added.add(migration_name(old_path))
            continue
        if code == "D":
            deleted.add(migration_name(old_path))
            continue
        unexpected.append(line)

    return (
        added == {BASELINE_RESET_FILE_NAME}
        and deleted == BASELINE_RESET_OLD_MIGRATION_NAMES
        and not unexpected
    )


def baseline_reset_status_is_exact(lines: list[str]) -> bool:
    added: set[str] = set()
    deleted: set[str] = set()
    unexpected: list[str] = []

    for raw_line in lines:
        line = raw_line.rstrip()
        if len(line) < 4:
            continue
        status = line[:2]
        path_spec = line[3:]
        if " -> " in path_spec:
            unexpected.append(line)
            continue

        name = migration_name(path_spec)
        if status == "??" and name == BASELINE_RESET_FILE_NAME:
            added.add(name)
            continue
        if "A" in status and name == BASELINE_RESET_FILE_NAME:
            added.add(name)
            continue
        if "D" in status and name in BASELINE_RESET_OLD_MIGRATION_NAMES:
            deleted.add(name)
            continue
        if status.strip():
            unexpected.append(line)

    return (
        added == {BASELINE_RESET_FILE_NAME}
        and deleted == BASELINE_RESET_OLD_MIGRATION_NAMES
        and not unexpected
    )


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

    diff_lines = result.stdout.splitlines()
    if baseline_reset_layout_active() and baseline_reset_diff_is_exact(diff_lines):
        return []

    errors: list[str] = []
    for line in diff_lines:
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

    status_lines = result.stdout.splitlines()
    if baseline_reset_layout_active() and baseline_reset_status_is_exact(status_lines):
        return []

    errors: list[str] = []
    for raw_line in status_lines:
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
        print_remediation()
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
        print_remediation()
        return 1

    print(f"Migration safety check passed. Files checked: {len(files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
