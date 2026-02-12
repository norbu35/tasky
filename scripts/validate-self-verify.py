#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path


ALLOWED_TOP_LEVEL = {
    "schema_version",
    "generated_at",
    "ticket",
    "risk_level",
    "req_ids",
    "files_changed",
    "required_check_ids",
    "checks",
    "overall_status",
    "known_risks",
    "assumptions",
    "self_critique",
    "ci_parity",
    "git_context",
    "agent",
}

ALLOWED_CHECK_IDS = {
    "format_lint",
    "commit_message_lint",
    "secret_scan",
    "changed_module_tests",
    "openapi_validation",
    "integration_tests_touched",
    "coverage_gate_touched",
    "full_test_suite",
    "sast_dependency_scan",
    "migration_safety",
    "performance_smoke",
}

REQUIRED_BY_RISK = {
    "low": [
        "format_lint",
        "commit_message_lint",
        "secret_scan",
        "changed_module_tests",
    ],
    "medium": [
        "format_lint",
        "commit_message_lint",
        "secret_scan",
        "changed_module_tests",
        "openapi_validation",
        "integration_tests_touched",
        "coverage_gate_touched",
    ],
    "high": [
        "format_lint",
        "commit_message_lint",
        "secret_scan",
        "changed_module_tests",
        "openapi_validation",
        "integration_tests_touched",
        "coverage_gate_touched",
        "full_test_suite",
        "sast_dependency_scan",
        "migration_safety",
        "performance_smoke",
    ],
}

TICKET_RE = re.compile(r"^[A-Z][A-Z0-9_]*-[0-9]+$")
REQ_RE = re.compile(r"^(REQ|NFR)-[A-Z]+-[0-9]+$")
HEAD_SHA_RE = re.compile(r"^[a-f0-9]{7,40}$")


def err(errors: list[str], message: str) -> None:
    errors.append(message)


def is_non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate(artifact: dict, errors: list[str]) -> None:
    unknown_top = set(artifact.keys()) - ALLOWED_TOP_LEVEL
    if unknown_top:
        err(errors, f"Unknown top-level fields: {sorted(unknown_top)}")

    missing_top = ALLOWED_TOP_LEVEL - set(artifact.keys())
    if missing_top:
        err(errors, f"Missing top-level fields: {sorted(missing_top)}")
        return

    if artifact.get("schema_version") != "1.0.0":
        err(errors, "schema_version must be '1.0.0'.")

    ticket = artifact.get("ticket")
    if not (isinstance(ticket, str) and TICKET_RE.match(ticket)):
        err(errors, "ticket format is invalid.")

    risk = artifact.get("risk_level")
    if risk not in REQUIRED_BY_RISK:
        err(errors, "risk_level must be one of low|medium|high.")
        return

    req_ids = artifact.get("req_ids")
    if not (isinstance(req_ids, list) and req_ids):
        err(errors, "req_ids must be a non-empty list.")
    else:
        for req in req_ids:
            if not (isinstance(req, str) and REQ_RE.match(req)):
                err(errors, f"Invalid requirement ID: {req}")

    files_changed = artifact.get("files_changed")
    if not (isinstance(files_changed, list) and files_changed):
        err(errors, "files_changed must be a non-empty list.")

    expected_required = REQUIRED_BY_RISK[risk]
    required_ids = artifact.get("required_check_ids")
    if required_ids != expected_required:
        err(
            errors,
            f"required_check_ids must exactly match risk '{risk}' set: {expected_required}",
        )

    checks = artifact.get("checks")
    if not (isinstance(checks, list) and checks):
        err(errors, "checks must be a non-empty list.")
        return

    check_by_id: dict[str, dict] = {}
    for idx, check in enumerate(checks):
        prefix = f"checks[{idx}]"
        if not isinstance(check, dict):
            err(errors, f"{prefix} must be an object.")
            continue

        allowed_check_fields = {
            "id",
            "title",
            "required",
            "status",
            "command",
            "exit_code",
            "duration_ms",
            "started_at",
            "finished_at",
            "evidence",
            "error",
        }
        unknown_check_fields = set(check.keys()) - allowed_check_fields
        if unknown_check_fields:
            err(errors, f"{prefix} unknown fields: {sorted(unknown_check_fields)}")

        required_fields = {
            "id",
            "title",
            "required",
            "status",
            "command",
            "exit_code",
            "duration_ms",
            "started_at",
            "finished_at",
            "evidence",
        }
        missing_fields = required_fields - set(check.keys())
        if missing_fields:
            err(errors, f"{prefix} missing fields: {sorted(missing_fields)}")
            continue

        check_id = check["id"]
        if check_id not in ALLOWED_CHECK_IDS:
            err(errors, f"{prefix}.id is not in allowed registry: {check_id}")
        if check_id in check_by_id:
            err(errors, f"Duplicate check id detected: {check_id}")
        check_by_id[check_id] = check

        if not is_non_empty_string(check["title"]):
            err(errors, f"{prefix}.title must be non-empty string.")
        if not isinstance(check["required"], bool):
            err(errors, f"{prefix}.required must be boolean.")
        if check["status"] not in {"PASS", "FAIL", "SKIP"}:
            err(errors, f"{prefix}.status must be PASS|FAIL|SKIP.")
        if not is_non_empty_string(check["command"]):
            err(errors, f"{prefix}.command must be non-empty string.")
        if not isinstance(check["exit_code"], int) or check["exit_code"] < 0:
            err(errors, f"{prefix}.exit_code must be integer >= 0.")
        if not isinstance(check["duration_ms"], int) or check["duration_ms"] < 0:
            err(errors, f"{prefix}.duration_ms must be integer >= 0.")

        if check["required"] and check["status"] == "SKIP":
            err(errors, f"{prefix} required checks cannot be SKIP.")
        if check["status"] == "PASS" and check["exit_code"] != 0:
            err(errors, f"{prefix} PASS must have exit_code 0.")
        if check["status"] == "FAIL" and check["exit_code"] == 0:
            err(errors, f"{prefix} FAIL must have exit_code > 0.")

        evidence = check["evidence"]
        if not isinstance(evidence, dict):
            err(errors, f"{prefix}.evidence must be object.")
        else:
            if set(evidence.keys()) != {"summary", "artifact_paths"}:
                err(errors, f"{prefix}.evidence must only contain summary and artifact_paths.")
            if not is_non_empty_string(evidence.get("summary")):
                err(errors, f"{prefix}.evidence.summary must be non-empty string.")
            artifact_paths = evidence.get("artifact_paths")
            if not isinstance(artifact_paths, list):
                err(errors, f"{prefix}.evidence.artifact_paths must be an array.")

    for req_check in expected_required:
        if req_check not in check_by_id:
            err(errors, f"Missing required check result for {req_check}.")
            continue
        check = check_by_id[req_check]
        if not check.get("required", False):
            err(errors, f"Required check {req_check} must set required=true.")
        if check.get("status") not in {"PASS", "FAIL"}:
            err(errors, f"Required check {req_check} must be PASS or FAIL.")

    overall_status = artifact.get("overall_status")
    if overall_status not in {"PASS", "FAIL"}:
        err(errors, "overall_status must be PASS or FAIL.")
    else:
        expected_overall = "PASS"
        for req_check in expected_required:
            check = check_by_id.get(req_check)
            if not check or check.get("status") != "PASS":
                expected_overall = "FAIL"
                break
        if overall_status != expected_overall:
            err(errors, f"overall_status must be {expected_overall} for this check set.")

    for list_field in ("known_risks", "assumptions"):
        value = artifact.get(list_field)
        if not isinstance(value, list):
            err(errors, f"{list_field} must be an array.")

    critique = artifact.get("self_critique")
    if not isinstance(critique, dict):
        err(errors, "self_critique must be an object.")
    else:
        expected_keys = {
            "requirement_most_likely_to_break",
            "security_or_abuse_path_impacted",
            "proof_test",
        }
        if set(critique.keys()) != expected_keys:
            err(errors, "self_critique fields are incomplete or contain unknown fields.")
        for k in expected_keys:
            if not is_non_empty_string(critique.get(k)):
                err(errors, f"self_critique.{k} must be non-empty string.")

    ci_parity = artifact.get("ci_parity")
    if not isinstance(ci_parity, dict):
        err(errors, "ci_parity must be an object.")
    else:
        expected_keys = {"local_required_check_ids", "ci_required_check_ids", "matches"}
        if set(ci_parity.keys()) != expected_keys:
            err(errors, "ci_parity fields are incomplete or contain unknown fields.")
        local_ids = ci_parity.get("local_required_check_ids")
        ci_ids = ci_parity.get("ci_required_check_ids")
        matches = ci_parity.get("matches")
        if local_ids != expected_required:
            err(errors, "ci_parity.local_required_check_ids must match risk-required set.")
        if ci_ids != expected_required:
            err(errors, "ci_parity.ci_required_check_ids must match risk-required set.")
        if not isinstance(matches, bool):
            err(errors, "ci_parity.matches must be boolean.")

    git_context = artifact.get("git_context")
    if not isinstance(git_context, dict):
        err(errors, "git_context must be an object.")
    else:
        expected_keys = {"branch", "base_ref", "head_sha"}
        if set(git_context.keys()) != expected_keys:
            err(errors, "git_context fields are incomplete or contain unknown fields.")
        if not is_non_empty_string(git_context.get("branch")):
            err(errors, "git_context.branch must be non-empty string.")
        if not is_non_empty_string(git_context.get("base_ref")):
            err(errors, "git_context.base_ref must be non-empty string.")
        head_sha = git_context.get("head_sha")
        if not (isinstance(head_sha, str) and (head_sha == "NO_HEAD" or HEAD_SHA_RE.match(head_sha))):
            err(errors, "git_context.head_sha must be git SHA or NO_HEAD.")

    agent = artifact.get("agent")
    if not isinstance(agent, dict):
        err(errors, "agent must be an object.")
    else:
        expected_keys = {"name", "version"}
        if set(agent.keys()) != expected_keys:
            err(errors, "agent fields are incomplete or contain unknown fields.")
        if not is_non_empty_string(agent.get("name")):
            err(errors, "agent.name must be non-empty string.")
        if not is_non_empty_string(agent.get("version")):
            err(errors, "agent.version must be non-empty string.")


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: scripts/validate-self-verify.py <artifact.json> <schema.json>", file=sys.stderr)
        return 2

    artifact_path = Path(sys.argv[1])
    schema_path = Path(sys.argv[2])

    if not artifact_path.is_file():
        print(f"Artifact not found: {artifact_path}", file=sys.stderr)
        return 1
    if not schema_path.is_file():
        print(f"Schema not found: {schema_path}", file=sys.stderr)
        return 1

    try:
        artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Failed to parse artifact JSON: {exc}", file=sys.stderr)
        return 1

    # Parse schema to ensure file validity even though validation is implemented in code.
    try:
        json.loads(schema_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Failed to parse schema JSON: {exc}", file=sys.stderr)
        return 1

    errors: list[str] = []
    validate(artifact, errors)
    if errors:
        print("Self-verify artifact validation errors:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    print("Self-verify artifact validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
