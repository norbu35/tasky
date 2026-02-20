#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


SECURITY_TYPES = {"security", "abuse"}

# Patterns that identify test source files across all platform stacks.
# Used to distinguish test files from production code or documentation in the
# changed-files list.
TEST_FILE_PATTERNS = [
    r"\.test\.(tsx?|jsx?)$",
    r"\.spec\.(tsx?|jsx?)$",
    r"(Integration|Unit)Tests?\.java$",
    r"__tests__[\\/].*\.(tsx?|jsx?)$",
    r"e2e[\\/].*\.ts$",
    r"maestro[\\/].*\.yaml$",
]


def is_test_file(path: str) -> bool:
    return any(re.search(p, path) for p in TEST_FILE_PATTERNS)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate acceptance criteria to test evidence coverage."
    )
    parser.add_argument(
        "--normalized",
        required=True,
        help="Path to normalized ticket spec output from validate-ticket-spec.py",
    )
    parser.add_argument("--ticket", required=True, help="Ticket ID")
    parser.add_argument("--risk", required=True, choices=["low", "medium", "high"])
    parser.add_argument("--logs-dir", required=True, help="Directory containing check logs")
    parser.add_argument("--out", required=True, help="Coverage summary output JSON path")
    parser.add_argument(
        "--changed-files",
        default=None,
        help=(
            "Path to a newline-delimited file listing paths changed on this branch "
            "(typically artifacts/checks/changed-files.txt). When provided, each "
            "required TID must appear in at least one changed test file in addition "
            "to appearing in the test runner logs. This enforces that the agent "
            "actually wrote or updated the test, not just ran pre-existing ones."
        ),
    )
    return parser.parse_args()


def load_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def match_test_id(test_id: str, text: str) -> bool:
    pattern = re.compile(rf"(?<![A-Z0-9_-]){re.escape(test_id)}(?![A-Z0-9_-])", re.IGNORECASE)
    return bool(pattern.search(text))


def collect_logs(logs_dir: Path) -> tuple[list[Path], str]:
    if not logs_dir.is_dir():
        return [], ""
    logs = sorted(p for p in logs_dir.glob("*.log") if p.is_file())
    ignored = {"ticket_spec_validation.log", "ac_coverage_gate.log"}
    filtered = [p for p in logs if p.name not in ignored]
    merged = "\n".join(load_text(path) for path in filtered)
    return filtered, merged


def load_changed_test_content(changed_files_path: Path) -> tuple[list[str], str]:
    """
    Read the changed-files list, filter to test files, read their content.
    Returns (list_of_changed_test_file_paths, merged_content).
    Paths are resolved relative to cwd (the repo root as set by self-verify.sh).
    """
    if not changed_files_path.is_file():
        return [], ""

    changed_paths = [
        line.strip()
        for line in changed_files_path.read_text(encoding="utf-8").splitlines()
        if line.strip() and line.strip() != "NO_FILE_CHANGE_DETECTED"
    ]

    test_files = [p for p in changed_paths if is_test_file(p)]

    repo_root = Path.cwd()
    parts: list[str] = []
    for rel in test_files:
        abs_path = repo_root / rel
        if abs_path.is_file():
            parts.append(abs_path.read_text(encoding="utf-8", errors="ignore"))

    return test_files, "\n".join(parts)


def main() -> int:
    args = parse_args()
    normalized_path = Path(args.normalized)
    logs_dir = Path(args.logs_dir)
    out_path = Path(args.out)

    if not normalized_path.is_file():
        print(f"Normalized ticket spec not found: {normalized_path}", file=sys.stderr)
        return 1

    try:
        ticket_spec = json.loads(normalized_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Failed to parse normalized ticket spec: {exc}", file=sys.stderr)
        return 1

    ticket = ticket_spec.get("ticket")
    risk = ticket_spec.get("risk_level")
    criteria = ticket_spec.get("acceptance_criteria", [])
    if ticket != args.ticket:
        print(f"Ticket mismatch: normalized={ticket} runtime={args.ticket}", file=sys.stderr)
        return 1
    if risk != args.risk:
        print(f"Risk mismatch: normalized={risk} runtime={args.risk}", file=sys.stderr)
        return 1
    if not isinstance(criteria, list) or not criteria:
        print("acceptance_criteria must be a non-empty array in normalized spec.", file=sys.stderr)
        return 1

    logs, merged_log_text = collect_logs(logs_dir)
    failures: list[str] = []
    if not logs:
        failures.append("No test logs found for acceptance coverage validation.")

    # Load changed test files when --changed-files is provided.
    check_authorship = args.changed_files is not None
    changed_test_files: list[str] = []
    changed_test_content = ""
    if check_authorship:
        changed_test_files, changed_test_content = load_changed_test_content(
            Path(args.changed_files)
        )
        if not changed_test_files:
            failures.append(
                "No test files found in the changed-files list. "
                "At least one test file must be added or modified on this branch "
                "so that each required TID is verifiably written by the implementing agent."
            )

    mapping: list[dict] = []
    total_test_ids = 0
    covered_test_ids = 0
    fully_covered_ac = 0

    for criterion in criteria:
        ac_id = criterion.get("id")
        ac_type = criterion.get("type")
        test_ids = criterion.get("test_ids", [])
        negative_test_ids = criterion.get("negative_test_ids", [])

        # Check 1: TID appeared in test runner output (test ran).
        ran = [tid for tid in test_ids if match_test_id(tid, merged_log_text)]
        not_ran = [tid for tid in test_ids if tid not in ran]

        # Check 2: TID appears in a test file changed on this branch (test was written).
        not_written: list[str] = []
        if check_authorship and changed_test_files:
            not_written = [
                tid for tid in test_ids
                if not match_test_id(tid, changed_test_content)
            ]

        # Security/abuse ACs at high risk require negative test IDs.
        missing_negative: list[str] = []
        if args.risk == "high" and ac_type in SECURITY_TYPES:
            if not negative_test_ids:
                failures.append(
                    f"{ac_id}: high-risk security/abuse criterion requires negative_test_ids."
                )
            else:
                missing_negative = [
                    tid for tid in negative_test_ids
                    if not match_test_id(tid, merged_log_text)
                ]
                if missing_negative:
                    failures.append(
                        f"{ac_id}: negative test IDs not found in runner output: {missing_negative}"
                    )

        ac_failed = False
        if not_ran:
            failures.append(
                f"{ac_id}: test IDs not found in runner output: {not_ran}. "
                f"Each ID must appear verbatim inside the it()/test()/@DisplayName string, "
                f"e.g. it('{not_ran[0]} should ...', () => {{...}})"
            )
            ac_failed = True
        if not_written:
            failures.append(
                f"{ac_id}: test IDs not found in any test file changed on this branch: {not_written}. "
                f"Add or update a test whose description contains the ID verbatim."
            )
            ac_failed = True
        if missing_negative:
            ac_failed = True

        # A TID counts as "covered" only when it both ran and was written on this branch.
        covered = [
            tid for tid in test_ids
            if tid in ran and (not check_authorship or not changed_test_files or tid not in not_written)
        ]
        uncovered = [tid for tid in test_ids if tid not in covered]

        status = "PASS" if not ac_failed else "FAIL"
        if status == "PASS":
            fully_covered_ac += 1

        total_test_ids += len(test_ids)
        covered_test_ids += len(covered)
        mapping.append(
            {
                "ac_id": ac_id,
                "test_ids": test_ids,
                "covered_test_ids": covered,
                "uncovered_test_ids": uncovered,
                "not_run_test_ids": not_ran,
                "not_written_test_ids": not_written,
                "status": status,
            }
        )

    summary = {
        "total_ac": len(criteria),
        "mapped_ac": len(criteria),
        "fully_covered_ac": fully_covered_ac,
        "total_test_ids": total_test_ids,
        "covered_test_ids": covered_test_ids,
        "changed_test_files": changed_test_files,
        "authorship_check_enabled": check_authorship,
        "pass": fully_covered_ac == len(criteria) and len(failures) == 0,
        "failures": failures,
    }

    output = {
        "ticket": ticket,
        "risk_level": risk,
        "acceptance_criteria": criteria,
        "ac_test_mapping": mapping,
        "ac_coverage_summary": summary,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")

    if summary["pass"]:
        print("Acceptance criteria coverage validation passed.")
        return 0

    print("Acceptance criteria coverage validation failed:", file=sys.stderr)
    for item in failures:
        print(f"- {item}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
