#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path

TICKET_RE = re.compile(r"^[A-Z][A-Z0-9_]*-[0-9]+$")
REQ_RE = re.compile(r"^(REQ|NFR)-[A-Z]+-[0-9]+$")
AC_RE = re.compile(r"^AC-[A-Z0-9_-]+-[0-9]+$")
TEST_ID_RE = re.compile(r"^TID-[A-Z0-9_-]+$")
ALLOWED_RISKS = {"low", "medium", "high"}
SECURITY_TYPES = {"security", "abuse"}
INDEX_ROW_RE = re.compile(
    r"^\|\s*(TASK-[0-9]{3})\s*\|\s*[^|]+\|\s*(?:low|medium|high)\s*\|\s*[^|]+\|\s*([^|]+)\|",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate ticket acceptance criteria spec.")
    parser.add_argument("--spec", required=True, help="Path to tickets/<TICKET>.json")
    parser.add_argument("--ticket", required=True, help="Ticket ID from self-verify")
    parser.add_argument("--risk", required=True, choices=sorted(ALLOWED_RISKS))
    parser.add_argument("--req", required=True, help="Comma-separated REQ/NFR IDs")
    parser.add_argument("--branch", required=True, help="Current git branch")
    parser.add_argument(
        "--schema",
        default="docs/quality/ticket.spec.schema.json",
        help="Schema path for syntax presence check",
    )
    parser.add_argument(
        "--backlog",
        default="docs/BACKLOG.md",
        help="Backlog path used for dependency contract validation",
    )
    parser.add_argument("--out", required=True, help="Output path for normalized spec JSON")
    return parser.parse_args()


def parse_req_csv(req_csv: str) -> list[str]:
    items = []
    for raw in req_csv.split(","):
        value = raw.strip()
        if value:
            items.append(value)
    seen = set()
    unique = []
    for item in items:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


def validate_branch(ticket: str, branch: str) -> list[str]:
    errors: list[str] = []
    expected_prefix = f"agent/{ticket}-"
    if branch in {"UNKNOWN_BRANCH", "NO_HEAD"}:
        errors.append(f"Branch context is unknown: {branch}")
        return errors
    if branch == "HEAD":
        errors.append(
            "Detached HEAD branch context is not allowed for ticket validation. "
            "Provide a concrete PR branch (agent/<ticket>-<slug>)."
        )
        return errors
    if not branch.startswith(expected_prefix):
        errors.append(
            f"Branch '{branch}' must start with '{expected_prefix}' for atomic ticket enforcement."
        )
    return errors


def parse_backlog_dependencies(backlog_path: Path) -> dict[str, list[str]]:
    if not backlog_path.is_file():
        return {}
    mapping: dict[str, list[str]] = {}
    for line in backlog_path.read_text(encoding="utf-8").splitlines():
        match = INDEX_ROW_RE.match(line)
        if not match:
            continue
        ticket = match.group(1)
        deps_col = match.group(2).strip()
        deps = [item.strip() for item in deps_col.split(",") if item.strip() and item.strip() != "-"]
        mapping[ticket] = deps
    return mapping


def validate_ticket_spec(
    payload: dict,
    ticket: str,
    risk: str,
    req_ids_expected: list[str],
    branch: str,
    expected_dependencies: list[str] | None,
) -> tuple[list[str], dict]:
    errors: list[str] = []
    normalized: dict = {}

    required_top = {
        "schema_version",
        "ticket",
        "risk_level",
        "req_ids",
        "depends_on",
        "acceptance_criteria",
    }
    unknown_top = set(payload.keys()) - required_top
    if unknown_top:
        errors.append(f"Unknown top-level fields: {sorted(unknown_top)}")
    missing_top = required_top - set(payload.keys())
    if missing_top:
        errors.append(f"Missing top-level fields: {sorted(missing_top)}")
        return errors, normalized

    schema_version = payload.get("schema_version")
    if schema_version != "1.0.0":
        errors.append("schema_version must be '1.0.0'.")

    spec_ticket = payload.get("ticket")
    if not isinstance(spec_ticket, str) or not TICKET_RE.match(spec_ticket):
        errors.append("ticket format is invalid.")
    elif spec_ticket != ticket:
        errors.append(f"ticket mismatch: spec={spec_ticket} runtime={ticket}")

    spec_risk = payload.get("risk_level")
    if spec_risk not in ALLOWED_RISKS:
        errors.append("risk_level must be one of low|medium|high.")
    elif spec_risk != risk:
        errors.append(f"risk_level mismatch: spec={spec_risk} runtime={risk}")

    req_ids = payload.get("req_ids")
    if not isinstance(req_ids, list) or not req_ids:
        errors.append("req_ids must be a non-empty array.")
        req_ids = []
    else:
        for req_id in req_ids:
            if not isinstance(req_id, str) or not REQ_RE.match(req_id):
                errors.append(f"Invalid req_id: {req_id}")
    dedup_req_ids = []
    seen_req = set()
    for req_id in req_ids:
        if req_id not in seen_req:
            seen_req.add(req_id)
            dedup_req_ids.append(req_id)
    if set(dedup_req_ids) != set(req_ids_expected):
        errors.append(
            f"req_ids mismatch with self-verify args. spec={dedup_req_ids} runtime={req_ids_expected}"
        )

    depends_on_raw = payload.get("depends_on")
    if depends_on_raw is None:
        errors.append("depends_on must be present (use [] when no dependencies).")
        depends_on_raw = []
    if not isinstance(depends_on_raw, list):
        errors.append("depends_on must be an array.")
        depends_on_raw = []

    dedup_depends_on: list[str] = []
    seen_depends: set[str] = set()
    for dep in depends_on_raw:
        if not isinstance(dep, str) or not TICKET_RE.match(dep):
            errors.append(f"Invalid depends_on ticket reference: {dep}")
            continue
        if dep == ticket:
            errors.append("depends_on cannot include the ticket itself.")
            continue
        if dep not in seen_depends:
            seen_depends.add(dep)
            dedup_depends_on.append(dep)

    if expected_dependencies is not None and dedup_depends_on != expected_dependencies:
        errors.append(
            "depends_on mismatch with backlog index contract. "
            f"spec={dedup_depends_on} backlog={expected_dependencies}"
        )

    acceptance_criteria = payload.get("acceptance_criteria")
    if not isinstance(acceptance_criteria, list) or not acceptance_criteria:
        errors.append("acceptance_criteria must be a non-empty array.")
        acceptance_criteria = []

    ac_ids_seen: set[str] = set()
    normalized_criteria: list[dict] = []
    for idx, criterion in enumerate(acceptance_criteria):
        prefix = f"acceptance_criteria[{idx}]"
        if not isinstance(criterion, dict):
            errors.append(f"{prefix} must be an object.")
            continue
        required_ac = {"id", "type", "statement", "test_ids"}
        unknown_ac = set(criterion.keys()) - (required_ac | {"negative_test_ids"})
        if unknown_ac:
            errors.append(f"{prefix} unknown fields: {sorted(unknown_ac)}")
        missing_ac = required_ac - set(criterion.keys())
        if missing_ac:
            errors.append(f"{prefix} missing fields: {sorted(missing_ac)}")
            continue

        ac_id = criterion.get("id")
        ac_type = criterion.get("type")
        statement = criterion.get("statement")
        test_ids = criterion.get("test_ids")
        negative_test_ids = criterion.get("negative_test_ids", [])

        if not isinstance(ac_id, str) or not AC_RE.match(ac_id):
            errors.append(f"{prefix}.id is invalid: {ac_id}")
            continue
        if ac_id in ac_ids_seen:
            errors.append(f"Duplicate acceptance criterion id: {ac_id}")
            continue
        ac_ids_seen.add(ac_id)

        if ac_type not in {"functional", "security", "abuse", "performance", "reliability", "ui", "data"}:
            errors.append(f"{prefix}.type is invalid: {ac_type}")
        if not isinstance(statement, str) or len(statement.strip()) < 10:
            errors.append(f"{prefix}.statement must be at least 10 chars.")
        if not isinstance(test_ids, list) or not test_ids:
            errors.append(f"{prefix}.test_ids must be a non-empty array.")
            test_ids = []

        dedup_test_ids: list[str] = []
        seen_test_ids: set[str] = set()
        for test_id in test_ids:
            if not isinstance(test_id, str) or not TEST_ID_RE.match(test_id):
                errors.append(f"{prefix}.test_ids has invalid value: {test_id}")
                continue
            if test_id not in seen_test_ids:
                seen_test_ids.add(test_id)
                dedup_test_ids.append(test_id)
        if not dedup_test_ids:
            errors.append(f"{prefix} has no valid test_ids.")

        if negative_test_ids is None:
            negative_test_ids = []
        if not isinstance(negative_test_ids, list):
            errors.append(f"{prefix}.negative_test_ids must be an array when present.")
            negative_test_ids = []
        normalized_negative: list[str] = []
        seen_negative: set[str] = set()
        for test_id in negative_test_ids:
            if not isinstance(test_id, str) or not TEST_ID_RE.match(test_id):
                errors.append(f"{prefix}.negative_test_ids has invalid value: {test_id}")
                continue
            if test_id not in dedup_test_ids:
                errors.append(
                    f"{prefix}.negative_test_ids item '{test_id}' must also be present in test_ids."
                )
                continue
            if test_id not in seen_negative:
                seen_negative.add(test_id)
                normalized_negative.append(test_id)

        if risk == "high" and ac_type in SECURITY_TYPES and not normalized_negative:
            errors.append(
                f"{prefix} requires at least one negative_test_ids entry for high-risk security/abuse criteria."
            )

        normalized_criteria.append(
            {
                "id": ac_id,
                "type": ac_type,
                "statement": statement.strip(),
                "test_ids": dedup_test_ids,
                "negative_test_ids": normalized_negative,
            }
        )

    errors.extend(validate_branch(ticket, branch))

    normalized = {
        "schema_version": "1.0.0",
        "ticket": ticket,
        "risk_level": risk,
        "req_ids": dedup_req_ids,
        "depends_on": dedup_depends_on,
        "acceptance_criteria": normalized_criteria,
    }
    return errors, normalized


def main() -> int:
    args = parse_args()
    spec_path = Path(args.spec)
    schema_path = Path(args.schema)
    backlog_path = Path(args.backlog)
    out_path = Path(args.out)

    if not spec_path.is_file():
        print(f"Ticket spec not found: {spec_path}", file=sys.stderr)
        return 1
    if not schema_path.is_file():
        print(f"Ticket schema not found: {schema_path}", file=sys.stderr)
        return 1
    if not TICKET_RE.match(args.ticket):
        print(f"Invalid --ticket format: {args.ticket}", file=sys.stderr)
        return 2

    try:
        payload = json.loads(spec_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Failed to parse ticket spec JSON: {exc}", file=sys.stderr)
        return 1

    try:
        json.loads(schema_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Failed to parse ticket schema JSON: {exc}", file=sys.stderr)
        return 1

    req_ids_expected = parse_req_csv(args.req)
    dependencies_by_ticket = parse_backlog_dependencies(backlog_path)
    expected_dependencies = dependencies_by_ticket.get(args.ticket)
    errors, normalized = validate_ticket_spec(
        payload=payload,
        ticket=args.ticket,
        risk=args.risk,
        req_ids_expected=req_ids_expected,
        branch=args.branch,
        expected_dependencies=expected_dependencies,
    )
    if errors:
        print("Ticket spec validation failed:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(normalized, indent=2) + "\n", encoding="utf-8")
    print(f"Ticket spec validation passed: {spec_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
