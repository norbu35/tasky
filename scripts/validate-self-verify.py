#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ALLOWED_TOP_LEVEL = {
    "schema_version",
    "generated_at",
    "ticket",
    "risk_level",
    "ticket_spec_path",
    "req_ids",
    "files_changed",
    "required_check_ids",
    "checks",
    "acceptance_criteria",
    "ac_test_mapping",
    "ac_coverage_summary",
    "overall_status",
    "known_risks",
    "assumptions",
    "self_critique",
    "ci_parity",
    "git_context",
    "agent",
}

TICKET_RE = re.compile(r"^[A-Z][A-Z0-9_]*-[0-9]+$")
REQ_RE = re.compile(r"^(REQ|NFR)-[A-Z]+-[0-9]+$")
HEAD_SHA_RE = re.compile(r"^[a-f0-9]{7,40}$")
AC_ID_RE = re.compile(r"^AC-[A-Z0-9_-]+-[0-9]+$")
TEST_ID_RE = re.compile(r"^TID-[A-Z0-9_-]+$")
RISK_POLICY_PATH = Path("docs/quality/risk-checks.json")


def err(errors: list[str], message: str) -> None:
    errors.append(message)


def is_non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def load_risk_policy(path: Path) -> tuple[set[str], dict[str, list[str]]]:
    if not path.is_file():
        raise FileNotFoundError(f"Risk policy not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))
    check_ids = payload.get("check_ids")
    required_by_risk = payload.get("required_by_risk")
    if not isinstance(check_ids, list) or not all(isinstance(item, str) for item in check_ids):
        raise ValueError("risk-checks.json must define string array 'check_ids'.")
    if not isinstance(required_by_risk, dict):
        raise ValueError("risk-checks.json must define object 'required_by_risk'.")
    for risk in ("low", "medium", "high"):
        values = required_by_risk.get(risk)
        if not isinstance(values, list) or not all(isinstance(item, str) for item in values):
            raise ValueError(f"risk-checks.json missing or invalid required_by_risk.{risk}")

    return set(check_ids), required_by_risk


def resolve_current_branch() -> str:
    env_branch = os.getenv("GITHUB_HEAD_REF")
    if env_branch:
        return env_branch
    ref_name = os.getenv("GITHUB_REF_NAME")
    if ref_name:
        return ref_name

    for command in (["git", "symbolic-ref", "--short", "HEAD"], ["git", "rev-parse", "--abbrev-ref", "HEAD"]):
        proc = subprocess.run(command, capture_output=True, text=True, check=False)
        if proc.returncode == 0:
            branch = proc.stdout.strip()
            if branch:
                return branch
    return "UNKNOWN_BRANCH"


def resolve_current_head_sha() -> str:
    proc = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        return "NO_HEAD"
    return proc.stdout.strip()


def validate(
    artifact: dict,
    errors: list[str],
    allowed_check_ids: set[str],
    required_by_risk: dict[str, list[str]],
) -> None:
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
    if risk not in required_by_risk:
        err(errors, "risk_level must be one of low|medium|high.")
        return

    ticket_spec_path = artifact.get("ticket_spec_path")
    if not is_non_empty_string(ticket_spec_path):
        err(errors, "ticket_spec_path must be a non-empty string.")

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

    acceptance_criteria = artifact.get("acceptance_criteria")
    if not (isinstance(acceptance_criteria, list) and acceptance_criteria):
        err(errors, "acceptance_criteria must be a non-empty list.")
        acceptance_criteria = []
    ac_ids: set[str] = set()
    criterion_by_id: dict[str, dict] = {}
    for idx, criterion in enumerate(acceptance_criteria):
        prefix = f"acceptance_criteria[{idx}]"
        if not isinstance(criterion, dict):
            err(errors, f"{prefix} must be an object.")
            continue
        required_fields = {"id", "type", "statement", "test_ids", "negative_test_ids"}
        unknown = set(criterion.keys()) - required_fields
        if unknown:
            err(errors, f"{prefix} unknown fields: {sorted(unknown)}")
        missing = required_fields - set(criterion.keys())
        if missing:
            err(errors, f"{prefix} missing fields: {sorted(missing)}")
            continue
        ac_id = criterion.get("id")
        if not (isinstance(ac_id, str) and AC_ID_RE.match(ac_id)):
            err(errors, f"{prefix}.id has invalid format: {ac_id}")
            continue
        if ac_id in ac_ids:
            err(errors, f"Duplicate acceptance criteria id: {ac_id}")
            continue
        ac_ids.add(ac_id)
        criterion_by_id[ac_id] = criterion
        if not is_non_empty_string(criterion.get("type")):
            err(errors, f"{prefix}.type must be non-empty string.")
        if not is_non_empty_string(criterion.get("statement")):
            err(errors, f"{prefix}.statement must be non-empty string.")
        test_ids = criterion.get("test_ids")
        if not (isinstance(test_ids, list) and test_ids):
            err(errors, f"{prefix}.test_ids must be non-empty array.")
        else:
            for test_id in test_ids:
                if not (isinstance(test_id, str) and TEST_ID_RE.match(test_id)):
                    err(errors, f"{prefix}.test_ids contains invalid id: {test_id}")
        negative_test_ids = criterion.get("negative_test_ids")
        if not isinstance(negative_test_ids, list):
            err(errors, f"{prefix}.negative_test_ids must be an array.")
        else:
            for test_id in negative_test_ids:
                if not (isinstance(test_id, str) and TEST_ID_RE.match(test_id)):
                    err(errors, f"{prefix}.negative_test_ids contains invalid id: {test_id}")

    expected_required = required_by_risk[risk]
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
        if check_id not in allowed_check_ids:
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

    ac_test_mapping = artifact.get("ac_test_mapping")
    if not isinstance(ac_test_mapping, list):
        err(errors, "ac_test_mapping must be an array.")
        ac_test_mapping = []
    mapping_by_ac: dict[str, dict] = {}
    for idx, mapping in enumerate(ac_test_mapping):
        prefix = f"ac_test_mapping[{idx}]"
        if not isinstance(mapping, dict):
            err(errors, f"{prefix} must be an object.")
            continue
        required_fields = {
            "ac_id",
            "test_ids",
            "covered_test_ids",
            "uncovered_test_ids",
            "not_run_test_ids",
            "not_written_test_ids",
            "status",
        }
        optional_fields = {
            "not_run_test_ids",
            "not_written_test_ids",
        }
        unknown = set(mapping.keys()) - required_fields - optional_fields
        if unknown:
            err(errors, f"{prefix} unknown fields: {sorted(unknown)}")
        missing = required_fields - set(mapping.keys())
        if missing:
            err(errors, f"{prefix} missing fields: {sorted(missing)}")
            continue
        ac_id = mapping.get("ac_id")
        if not (isinstance(ac_id, str) and AC_ID_RE.match(ac_id)):
            err(errors, f"{prefix}.ac_id is invalid: {ac_id}")
            continue
        if ac_id in mapping_by_ac:
            err(errors, f"Duplicate ac_test_mapping ac_id: {ac_id}")
            continue
        mapping_by_ac[ac_id] = mapping
        for field in (
            "test_ids",
            "covered_test_ids",
            "uncovered_test_ids",
            "not_run_test_ids",
            "not_written_test_ids",
        ):
            value = mapping.get(field)
            if field in optional_fields and value is None:
                continue
            if not isinstance(value, list):
                err(errors, f"{prefix}.{field} must be an array.")
                continue
            for test_id in value:
                if not (isinstance(test_id, str) and TEST_ID_RE.match(test_id)):
                    err(errors, f"{prefix}.{field} has invalid test id: {test_id}")
        if mapping.get("status") not in {"PASS", "FAIL"}:
            err(errors, f"{prefix}.status must be PASS or FAIL.")

    for ac_id in ac_ids:
        if ac_id not in mapping_by_ac:
            err(errors, f"Missing ac_test_mapping entry for acceptance criterion: {ac_id}")

    ac_summary = artifact.get("ac_coverage_summary")
    if not isinstance(ac_summary, dict):
        err(errors, "ac_coverage_summary must be an object.")
        ac_summary = {}
    else:
        required_fields = {
            "total_ac",
            "mapped_ac",
            "fully_covered_ac",
            "total_test_ids",
            "covered_test_ids",
            "changed_test_files",
            "authorship_check_enabled",
            "pass",
            "failures",
        }
        optional_fields = {
            "changed_test_files",
            "authorship_check_enabled",
        }
        unknown = set(ac_summary.keys()) - required_fields - optional_fields
        if unknown:
            err(errors, f"ac_coverage_summary unknown fields: {sorted(unknown)}")
        missing = required_fields - set(ac_summary.keys())
        if missing:
            err(errors, f"ac_coverage_summary missing fields: {sorted(missing)}")
        for key in (
            "total_ac",
            "mapped_ac",
            "fully_covered_ac",
            "total_test_ids",
            "covered_test_ids",
        ):
            value = ac_summary.get(key)
            if not isinstance(value, int) or value < 0:
                err(errors, f"ac_coverage_summary.{key} must be integer >= 0.")
        if not isinstance(ac_summary.get("pass"), bool):
            err(errors, "ac_coverage_summary.pass must be boolean.")
        if "authorship_check_enabled" in ac_summary and not isinstance(
            ac_summary.get("authorship_check_enabled"), bool
        ):
            err(errors, "ac_coverage_summary.authorship_check_enabled must be boolean.")
        failures = ac_summary.get("failures")
        if not isinstance(failures, list):
            err(errors, "ac_coverage_summary.failures must be an array.")
        else:
            for item in failures:
                if not is_non_empty_string(item):
                    err(errors, "ac_coverage_summary.failures entries must be non-empty strings.")
        changed_test_files = ac_summary.get("changed_test_files")
        if changed_test_files is not None:
            if not isinstance(changed_test_files, list):
                err(errors, "ac_coverage_summary.changed_test_files must be an array.")
            else:
                for item in changed_test_files:
                    if not is_non_empty_string(item):
                        err(errors, "ac_coverage_summary.changed_test_files entries must be non-empty strings.")

        if isinstance(ac_summary.get("total_ac"), int) and ac_summary.get("total_ac") != len(ac_ids):
            err(errors, "ac_coverage_summary.total_ac must match acceptance_criteria length.")
        if isinstance(ac_summary.get("mapped_ac"), int) and ac_summary.get("mapped_ac") != len(mapping_by_ac):
            err(errors, "ac_coverage_summary.mapped_ac must match ac_test_mapping length.")

    ac_gate = check_by_id.get("ac_coverage_gate")
    if ac_gate is None:
        err(errors, "Missing required ac_coverage_gate check result.")
    else:
        summary_pass = ac_summary.get("pass") if isinstance(ac_summary, dict) else None
        if ac_gate.get("status") == "PASS" and summary_pass is not True:
            err(errors, "ac_coverage_gate is PASS but ac_coverage_summary.pass is not true.")
        if ac_gate.get("status") == "FAIL" and summary_pass is True:
            err(errors, "ac_coverage_gate is FAIL but ac_coverage_summary.pass is true.")

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

        current_branch = resolve_current_branch()
        if is_non_empty_string(git_context.get("branch")) and current_branch != git_context.get("branch"):
            err(
                errors,
                f"git_context.branch does not match current checkout. artifact={git_context.get('branch')} current={current_branch}",
            )
        current_head_sha = resolve_current_head_sha()
        if isinstance(head_sha, str) and current_head_sha != head_sha:
            err(
                errors,
                f"git_context.head_sha does not match current checkout. artifact={head_sha} current={current_head_sha}",
            )

    if is_non_empty_string(ticket) and is_non_empty_string(git_context.get("branch") if isinstance(git_context, dict) else None):
        expected_prefix = f"agent/{ticket}-"
        branch_value = git_context.get("branch")
        if not branch_value.startswith(expected_prefix):
            err(errors, f"git_context.branch must start with {expected_prefix}")

    if is_non_empty_string(ticket_spec_path):
        spec_path = Path(ticket_spec_path)
        if not spec_path.is_file():
            err(errors, f"ticket_spec_path does not exist: {ticket_spec_path}")
        else:
            try:
                spec_payload = json.loads(spec_path.read_text(encoding="utf-8"))
            except Exception as exc:
                err(errors, f"ticket_spec_path is not valid JSON: {exc}")
            else:
                if spec_payload.get("ticket") != ticket:
                    err(errors, "ticket_spec_path ticket field does not match artifact ticket.")

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

    try:
        allowed_check_ids, required_by_risk = load_risk_policy(RISK_POLICY_PATH)
    except Exception as exc:
        print(f"Failed to load risk check policy: {exc}", file=sys.stderr)
        return 1

    errors: list[str] = []
    validate(artifact, errors, allowed_check_ids, required_by_risk)
    if errors:
        print("Self-verify artifact validation errors:", file=sys.stderr)
        for item in errors:
            print(f"- {item}", file=sys.stderr)
        return 1

    print("Self-verify artifact validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
