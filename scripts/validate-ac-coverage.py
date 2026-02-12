#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


SECURITY_TYPES = {"security", "abuse"}


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

    mapping: list[dict] = []
    total_test_ids = 0
    covered_test_ids = 0
    fully_covered_ac = 0

    for criterion in criteria:
        ac_id = criterion.get("id")
        ac_type = criterion.get("type")
        test_ids = criterion.get("test_ids", [])
        negative_test_ids = criterion.get("negative_test_ids", [])

        covered = [test_id for test_id in test_ids if match_test_id(test_id, merged_log_text)]
        uncovered = [test_id for test_id in test_ids if test_id not in covered]

        missing_negative: list[str] = []
        if args.risk == "high" and ac_type in SECURITY_TYPES:
            if not negative_test_ids:
                failures.append(
                    f"{ac_id}: high-risk security/abuse criterion requires negative_test_ids."
                )
            else:
                missing_negative = [
                    test_id for test_id in negative_test_ids if test_id not in covered
                ]
                if missing_negative:
                    failures.append(
                        f"{ac_id}: negative test IDs not covered: {missing_negative}"
                    )

        status = "PASS" if not uncovered and not missing_negative else "FAIL"
        if status == "PASS":
            fully_covered_ac += 1
        else:
            failures.append(f"{ac_id}: uncovered test IDs: {uncovered}")

        total_test_ids += len(test_ids)
        covered_test_ids += len(covered)
        mapping.append(
            {
                "ac_id": ac_id,
                "test_ids": test_ids,
                "covered_test_ids": covered,
                "uncovered_test_ids": uncovered,
                "status": status,
            }
        )

    summary = {
        "total_ac": len(criteria),
        "mapped_ac": len(criteria),
        "fully_covered_ac": fully_covered_ac,
        "total_test_ids": total_test_ids,
        "covered_test_ids": covered_test_ids,
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
