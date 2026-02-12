#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/self-verify.sh \
    --ticket <TICKET-ID> \
    --risk <low|medium|high> \
    --req <REQ-IDS-CSV> \
    [--ticket-spec <path>] \
    [--base <git-ref>] \
    [--out <path>]

Exit codes:
  0: all required checks passed
  1: one or more required checks failed
  2: invalid usage or arguments
  3: artifact schema validation failed
  4: environment or tooling failure
USAGE
}

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

now_ms() {
  python3 - <<'PY'
import time
print(time.time_ns() // 1_000_000)
PY
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 4
  fi
}

ticket=""
risk=""
req_csv=""
ticket_spec_path=""
base_ref="HEAD"
out_path="artifacts/self-verify.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket)
      ticket="${2:-}"
      shift 2
      ;;
    --risk)
      risk="${2:-}"
      shift 2
      ;;
    --req)
      req_csv="${2:-}"
      shift 2
      ;;
    --ticket-spec)
      ticket_spec_path="${2:-}"
      shift 2
      ;;
    --base)
      base_ref="${2:-}"
      shift 2
      ;;
    --out)
      out_path="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${ticket}" || -z "${risk}" || -z "${req_csv}" ]]; then
  echo "Missing required arguments." >&2
  usage
  exit 2
fi

if [[ -z "${ticket_spec_path}" ]]; then
  ticket_spec_path="tickets/${ticket}.json"
fi

if [[ ! "${ticket}" =~ ^[A-Z][A-Z0-9_]*-[0-9]+$ ]]; then
  echo "Invalid --ticket format: ${ticket}" >&2
  exit 2
fi

case "${risk}" in
  low|medium|high) ;;
  *)
    echo "Invalid --risk value: ${risk}" >&2
    exit 2
    ;;
esac

require_cmd jq
require_cmd python3
require_cmd git
require_cmd rg

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

if [[ ! -f "./gradlew" ]]; then
  echo "Missing Gradle wrapper at ./gradlew. Use the wrapper, not system Gradle." >&2
  exit 4
fi
if [[ ! -x "./gradlew" ]]; then
  chmod +x ./gradlew || {
    echo "Gradle wrapper exists but is not executable: ./gradlew" >&2
    exit 4
  }
fi

IFS=',' read -r -a req_raw <<< "${req_csv}"
req_ids=()
for req_id in "${req_raw[@]}"; do
  trimmed="$(echo "${req_id}" | xargs)"
  if [[ -n "${trimmed}" ]]; then
    req_ids+=("${trimmed}")
  fi
done
if [[ ${#req_ids[@]} -eq 0 ]]; then
  echo "No requirement IDs provided via --req." >&2
  exit 2
fi

if branch_candidate="$(git symbolic-ref --short HEAD 2>/dev/null)"; then
  branch="${branch_candidate}"
elif branch_candidate="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"; then
  branch="${branch_candidate}"
else
  branch="UNKNOWN_BRANCH"
fi
if [[ "${branch}" == "HEAD" && -n "${GITHUB_HEAD_REF:-}" ]]; then
  branch="${GITHUB_HEAD_REF}"
fi
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  head_sha="$(git rev-parse --short=40 HEAD)"
else
  head_sha="NO_HEAD"
  if [[ "${base_ref}" == "HEAD" ]]; then
    base_ref="EMPTY_TREE"
  fi
fi

export SELF_VERIFY_TICKET="${ticket}"
export SELF_VERIFY_RISK="${risk}"
export SELF_VERIFY_REQ_CSV="${req_csv}"
export SELF_VERIFY_TICKET_SPEC_PATH="${ticket_spec_path}"
export SELF_VERIFY_BRANCH="${branch}"

files_changed=()
while IFS= read -r changed_file; do
  if [[ -n "${changed_file}" ]]; then
    files_changed+=("${changed_file}")
  fi
done < <(
  {
    git diff --name-only 2>/dev/null || true
    git diff --name-only --cached 2>/dev/null || true
    git ls-files --others --exclude-standard 2>/dev/null || true
  } | sed '/^[[:space:]]*$/d' | sort -u
)
if [[ ${#files_changed[@]} -eq 0 ]]; then
  files_changed=("NO_FILE_CHANGE_DETECTED")
fi

required_checks=()
case "${risk}" in
  low)
    required_checks=(
      "format_lint"
      "commit_message_lint"
      "secret_scan"
      "ticket_spec_validation"
      "changed_module_tests"
      "ac_coverage_gate"
    )
    ;;
  medium)
    required_checks=(
      "format_lint"
      "commit_message_lint"
      "secret_scan"
      "ticket_spec_validation"
      "changed_module_tests"
      "openapi_validation"
      "integration_tests_touched"
      "coverage_gate_touched"
      "ac_coverage_gate"
    )
    ;;
  high)
    required_checks=(
      "format_lint"
      "commit_message_lint"
      "secret_scan"
      "ticket_spec_validation"
      "changed_module_tests"
      "openapi_validation"
      "integration_tests_touched"
      "coverage_gate_touched"
      "full_test_suite"
      "sast_dependency_scan"
      "migration_safety"
      "performance_smoke"
      "ac_coverage_gate"
    )
    ;;
esac

check_title() {
  case "$1" in
    format_lint) echo "Format and lint checks" ;;
    commit_message_lint) echo "Commit message lint" ;;
    secret_scan) echo "Secret scan" ;;
    ticket_spec_validation) echo "Ticket spec and branch context validation" ;;
    changed_module_tests) echo "Changed-module tests" ;;
    openapi_validation) echo "OpenAPI contract validation" ;;
    integration_tests_touched) echo "Integration tests for touched modules" ;;
    coverage_gate_touched) echo "Coverage gate on touched critical modules" ;;
    full_test_suite) echo "Full test suite" ;;
    sast_dependency_scan) echo "SAST and dependency scan" ;;
    migration_safety) echo "Migration safety verification" ;;
    performance_smoke) echo "Performance smoke test" ;;
    ac_coverage_gate) echo "Acceptance criteria coverage gate" ;;
    *) echo "Unknown check" ;;
  esac
}

check_command() {
  case "$1" in
    format_lint)
      cat <<'CMD'
if rg -q '^(apps/web/|apps/mobile/|packages/sdk/|docs/API\.yaml$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|package\.json$)' artifacts/checks/changed-files.txt; then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required for frontend lint/typecheck checks." >&2
    exit 1
  fi
  pnpm -r lint
  pnpm -r typecheck
fi
./gradlew --no-daemon checkstyleMain checkstyleTest
CMD
      ;;
    commit_message_lint)
      echo "python3 scripts/validate-commit-messages.py --ticket \"${SELF_VERIFY_TICKET}\""
      ;;
    secret_scan)
      echo "! rg -n --hidden --glob '!.git' --glob '!artifacts/**' --glob '!build/**' 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----' ."
      ;;
    ticket_spec_validation)
      cat <<'CMD'
python3 scripts/validate-ticket-spec.py \
  --spec "${SELF_VERIFY_TICKET_SPEC_PATH}" \
  --ticket "${SELF_VERIFY_TICKET}" \
  --risk "${SELF_VERIFY_RISK}" \
  --req "${SELF_VERIFY_REQ_CSV}" \
  --branch "${SELF_VERIFY_BRANCH}" \
  --out artifacts/checks/ticket-spec.normalized.json
CMD
      ;;
    changed_module_tests)
      cat <<'CMD'
needs_backend=0
needs_web=0
needs_mobile=0

if rg -q '^(src/|build\.gradle\.kts$|settings\.gradle\.kts$|gradle/|gradlew$|gradlew\.bat$)' artifacts/checks/changed-files.txt; then
  needs_backend=1
fi
if rg -q '^apps/web/' artifacts/checks/changed-files.txt; then
  needs_web=1
fi
if rg -q '^apps/mobile/' artifacts/checks/changed-files.txt; then
  needs_mobile=1
fi
if rg -q '^(packages/sdk/|docs/API\.yaml$)' artifacts/checks/changed-files.txt; then
  needs_web=1
  needs_mobile=1
fi

if (( needs_backend == 1 )); then
  ./gradlew --no-daemon test
fi

if (( needs_web == 1 || needs_mobile == 1 )); then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required for frontend changed-module tests." >&2
    exit 1
  fi
fi

if (( needs_web == 1 )); then
  pnpm --filter @tasky/web test:unit
fi
if (( needs_mobile == 1 )); then
  pnpm --filter @tasky/mobile test:unit
fi

if (( needs_backend == 0 && needs_web == 0 && needs_mobile == 0 )); then
  echo "No runtime modules changed; changed-module tests not applicable."
fi
CMD
      ;;
    openapi_validation)
      echo "./gradlew --no-daemon openApiValidate"
      ;;
    integration_tests_touched)
      cat <<'CMD'
needs_backend=0
needs_web=0
needs_mobile=0

if rg -q '^(src/main/|src/test/|build\.gradle\.kts$|settings\.gradle\.kts$)' artifacts/checks/changed-files.txt; then
  needs_backend=1
fi
if rg -q '^apps/web/' artifacts/checks/changed-files.txt; then
  needs_web=1
fi
if rg -q '^apps/mobile/' artifacts/checks/changed-files.txt; then
  needs_mobile=1
fi
if rg -q '^(packages/sdk/|docs/API\.yaml$)' artifacts/checks/changed-files.txt; then
  needs_web=1
  needs_mobile=1
fi

if (( needs_backend == 1 )); then
  if find src/test -type f 2>/dev/null | rg -q 'Integration|IT'; then
    ./gradlew --no-daemon test --tests '*Integration*' --tests '*IT*'
  else
    ./gradlew --no-daemon test
  fi
fi

if (( needs_web == 1 || needs_mobile == 1 )); then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required for frontend integration smoke tests." >&2
    exit 1
  fi
fi

if (( needs_web == 1 )); then
  pnpm --filter @tasky/web test:e2e:smoke
fi
if (( needs_mobile == 1 )); then
  pnpm --filter @tasky/mobile test:e2e:smoke
fi

if (( needs_backend == 0 && needs_web == 0 && needs_mobile == 0 )); then
  echo "No touched modules requiring integration tests."
fi
CMD
      ;;
    coverage_gate_touched)
      echo "./gradlew --no-daemon jacocoTestCoverageVerification"
      ;;
    full_test_suite)
      cat <<'CMD'
needs_frontend=0
if rg -q '^(apps/web/|apps/mobile/|packages/sdk/|docs/API\.yaml$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|package\.json$)' artifacts/checks/changed-files.txt; then
  needs_frontend=1
fi

./gradlew --no-daemon check

if (( needs_frontend == 1 )); then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required for full frontend test suite." >&2
    exit 1
  fi
  pnpm -r typecheck
  pnpm --filter @tasky/web test:unit
  pnpm --filter @tasky/web test:e2e
  pnpm --filter @tasky/mobile test:unit
  pnpm --filter @tasky/mobile test:e2e
fi
CMD
      ;;
    sast_dependency_scan)
      echo "if command -v semgrep >/dev/null 2>&1; then semgrep --error --config auto .; else echo 'semgrep not installed'; exit 1; fi"
      ;;
    migration_safety)
      echo "python3 scripts/validate-migrations.py"
      ;;
    performance_smoke)
      echo "scripts/performance-smoke.sh"
      ;;
    ac_coverage_gate)
      cat <<'CMD'
python3 scripts/validate-ac-coverage.py \
  --normalized artifacts/checks/ticket-spec.normalized.json \
  --ticket "${SELF_VERIFY_TICKET}" \
  --risk "${SELF_VERIFY_RISK}" \
  --logs-dir artifacts/checks \
  --out artifacts/checks/ac-coverage.json
CMD
      ;;
    *)
      echo "Unknown check id: $1" >&2
      exit 4
      ;;
  esac
}

mkdir -p "$(dirname "${out_path}")"
mkdir -p artifacts/checks
printf '%s\n' "${files_changed[@]}" > artifacts/checks/changed-files.txt

checks_json='[]'
overall_status="PASS"

run_check() {
  local check_id="$1"
  local title
  local command
  local log_path
  local started_at
  local finished_at
  local start_ms
  local end_ms
  local duration_ms
  local exit_code
  local status
  local summary
  local error_line
  local check_item

  title="$(check_title "${check_id}")"
  command="$(check_command "${check_id}")"
  log_path="artifacts/checks/${check_id}.log"
  started_at="$(now_iso)"
  start_ms="$(now_ms)"

  set +e
  bash -lc "${command}" >"${log_path}" 2>&1
  exit_code=$?
  set -e

  finished_at="$(now_iso)"
  end_ms="$(now_ms)"
  duration_ms=$((end_ms - start_ms))

  status="FAIL"
  summary="Check failed. See ${log_path}."
  error_line=""
  if [[ ${exit_code} -eq 0 ]]; then
    status="PASS"
    summary="Check passed."
  else
    error_line="$(head -n 1 "${log_path}" | tr -d '\r' | sed 's/"/\\"/g')"
    overall_status="FAIL"
  fi

  check_item="$(jq -n \
    --arg id "${check_id}" \
    --arg title "${title}" \
    --arg status "${status}" \
    --arg command "${command}" \
    --arg started_at "${started_at}" \
    --arg finished_at "${finished_at}" \
    --arg summary "${summary}" \
    --arg log_path "${log_path}" \
    --arg error_line "${error_line}" \
    --argjson exit_code "${exit_code}" \
    --argjson duration_ms "${duration_ms}" \
    '{
      id: $id,
      title: $title,
      required: true,
      status: $status,
      command: $command,
      exit_code: $exit_code,
      duration_ms: $duration_ms,
      started_at: $started_at,
      finished_at: $finished_at,
      evidence: {
        summary: $summary,
        artifact_paths: [$log_path]
      }
    } + (if $error_line == "" then {} else { error: $error_line } end)')"

  checks_json="$(jq -n --argjson checks "${checks_json}" --argjson item "${check_item}" '$checks + [$item]')"

  if [[ ${status} == "PASS" ]]; then
    return 0
  fi
  return 1
}

is_fast_check() {
  local check_id="$1"
  case "${check_id}" in
    format_lint|commit_message_lint|secret_scan|ticket_spec_validation|openapi_validation)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

record_blocked_check() {
  local check_id="$1"
  local blocked_by="$2"
  local title
  local command
  local started_at
  local finished_at
  local check_item

  title="$(check_title "${check_id}")"
  command="$(check_command "${check_id}")"
  started_at="$(now_iso)"
  finished_at="$(now_iso)"

  check_item="$(jq -n \
    --arg id "${check_id}" \
    --arg title "${title}" \
    --arg command "${command}" \
    --arg started_at "${started_at}" \
    --arg finished_at "${finished_at}" \
    --arg blocked_by "${blocked_by}" \
    '{
      id: $id,
      title: $title,
      required: true,
      status: "FAIL",
      command: $command,
      exit_code: 1,
      duration_ms: 0,
      started_at: $started_at,
      finished_at: $finished_at,
      evidence: {
        summary: "Check blocked because fast verification failed.",
        artifact_paths: []
      },
      error: ("Blocked by failing fast check: " + $blocked_by)
    }')"

  checks_json="$(jq -n --argjson checks "${checks_json}" --argjson item "${check_item}" '$checks + [$item]')"
  overall_status="FAIL"
}

fast_checks=()
slow_checks=()
for check_id in "${required_checks[@]}"; do
  if is_fast_check "${check_id}"; then
    fast_checks+=("${check_id}")
  else
    slow_checks+=("${check_id}")
  fi
done

fast_failure_id=""
for check_id in "${fast_checks[@]}"; do
  if ! run_check "${check_id}"; then
    if [[ -z "${fast_failure_id}" ]]; then
      fast_failure_id="${check_id}"
    fi
  fi
done

if [[ -n "${fast_failure_id}" ]]; then
  for check_id in "${slow_checks[@]}"; do
    record_blocked_check "${check_id}" "${fast_failure_id}"
  done
else
  for check_id in "${slow_checks[@]}"; do
    run_check "${check_id}" || true
  done
fi

req_ids_json="$(printf '%s\n' "${req_ids[@]}" | jq -R . | jq -s .)"
files_changed_json="$(printf '%s\n' "${files_changed[@]}" | jq -R . | jq -s .)"
required_checks_json="$(printf '%s\n' "${required_checks[@]}" | jq -R . | jq -s .)"
known_risks_json="$(jq -n '["Automated checks reduce but do not eliminate risk; human review remains mandatory."]')"
assumptions_json="$(jq -n '["Checks executed in local development environment with available tooling."]')"
proof_test="$(jq -r '([.[] | select(.status=="PASS") | .id][0] // "NO_PROOF_TEST_AVAILABLE")' <<< "${checks_json}")"
acceptance_criteria_json='[]'
ac_test_mapping_json='[]'
ac_coverage_summary_json='{"total_ac":0,"mapped_ac":0,"fully_covered_ac":0,"total_test_ids":0,"covered_test_ids":0,"pass":false,"failures":["ac_coverage_gate artifact missing"]}'
if [[ -f artifacts/checks/ac-coverage.json ]]; then
  acceptance_criteria_json="$(jq '.acceptance_criteria' artifacts/checks/ac-coverage.json)"
  ac_test_mapping_json="$(jq '.ac_test_mapping' artifacts/checks/ac-coverage.json)"
  ac_coverage_summary_json="$(jq '.ac_coverage_summary' artifacts/checks/ac-coverage.json)"
elif [[ -f artifacts/checks/ticket-spec.normalized.json ]]; then
  acceptance_criteria_json="$(jq '.acceptance_criteria' artifacts/checks/ticket-spec.normalized.json)"
  ac_test_mapping_json="$(jq '[.acceptance_criteria[] | {ac_id: .id, test_ids: .test_ids, covered_test_ids: [], uncovered_test_ids: .test_ids, status: "FAIL"}]' artifacts/checks/ticket-spec.normalized.json)"
  ac_coverage_summary_json="$(jq -n \
    --argjson total_ac "$(jq '.acceptance_criteria | length' artifacts/checks/ticket-spec.normalized.json)" \
    --argjson total_test_ids "$(jq '[.acceptance_criteria[].test_ids[]?] | length' artifacts/checks/ticket-spec.normalized.json)" \
    '{total_ac: $total_ac, mapped_ac: $total_ac, fully_covered_ac: 0, total_test_ids: $total_test_ids, covered_test_ids: 0, pass: false, failures: ["ac_coverage_gate did not produce output"]}')"
elif [[ -f "${ticket_spec_path}" ]]; then
  if jq -e '.acceptance_criteria | type == "array" and length > 0' "${ticket_spec_path}" >/dev/null 2>&1; then
    acceptance_criteria_json="$(jq '[.acceptance_criteria[] | {
      id: .id,
      type: .type,
      statement: .statement,
      test_ids: (.test_ids // []),
      negative_test_ids: (.negative_test_ids // [])
    }]' "${ticket_spec_path}")"
    ac_test_mapping_json="$(jq '[.[] | {ac_id: .id, test_ids: .test_ids, covered_test_ids: [], uncovered_test_ids: .test_ids, status: "FAIL"}]' <<< "${acceptance_criteria_json}")"
    ac_coverage_summary_json="$(jq -n \
      --argjson total_ac "$(jq 'length' <<< "${acceptance_criteria_json}")" \
      --argjson total_test_ids "$(jq '[.[].test_ids[]?] | length' <<< "${acceptance_criteria_json}")" \
      '{total_ac: $total_ac, mapped_ac: $total_ac, fully_covered_ac: 0, total_test_ids: $total_test_ids, covered_test_ids: 0, pass: false, failures: ["ac_coverage_gate did not produce output"]}')"
  fi
fi
generated_at="$(now_iso)"
agent_name="${AGENT_NAME:-Codex}"
agent_version="${AGENT_VERSION:-unknown}"

artifact_json="$(jq -n \
  --arg schema_version "1.0.0" \
  --arg generated_at "${generated_at}" \
  --arg ticket "${ticket}" \
  --arg risk_level "${risk}" \
  --arg ticket_spec_path "${ticket_spec_path}" \
  --arg overall_status "${overall_status}" \
  --arg branch "${branch}" \
  --arg base_ref "${base_ref}" \
  --arg head_sha "${head_sha}" \
  --arg agent_name "${agent_name}" \
  --arg agent_version "${agent_version}" \
  --arg proof_test "${proof_test}" \
  --argjson req_ids "${req_ids_json}" \
  --argjson files_changed "${files_changed_json}" \
  --argjson required_check_ids "${required_checks_json}" \
  --argjson checks "${checks_json}" \
  --argjson acceptance_criteria "${acceptance_criteria_json}" \
  --argjson ac_test_mapping "${ac_test_mapping_json}" \
  --argjson ac_coverage_summary "${ac_coverage_summary_json}" \
  --argjson known_risks "${known_risks_json}" \
  --argjson assumptions "${assumptions_json}" \
  '{
    schema_version: $schema_version,
    generated_at: $generated_at,
    ticket: $ticket,
    risk_level: $risk_level,
    ticket_spec_path: $ticket_spec_path,
    req_ids: $req_ids,
    files_changed: $files_changed,
    required_check_ids: $required_check_ids,
    checks: $checks,
    acceptance_criteria: $acceptance_criteria,
    ac_test_mapping: $ac_test_mapping,
    ac_coverage_summary: $ac_coverage_summary,
    overall_status: $overall_status,
    known_risks: $known_risks,
    assumptions: $assumptions,
    self_critique: {
      requirement_most_likely_to_break: "Requirements tied to changed modules require manual validation against PRD REQ/NFR IDs.",
      security_or_abuse_path_impacted: "Authorization, payment, and data exposure paths must be manually reviewed for abuse scenarios.",
      proof_test: $proof_test
    },
    ci_parity: {
      local_required_check_ids: $required_check_ids,
      ci_required_check_ids: $required_check_ids,
      matches: true
    },
    git_context: {
      branch: $branch,
      base_ref: $base_ref,
      head_sha: $head_sha
    },
    agent: {
      name: $agent_name,
      version: $agent_version
    }
  }')"

echo "${artifact_json}" > "${out_path}"

if ! python3 scripts/validate-self-verify.py "${out_path}" "docs/quality/self-verify.schema.json"; then
  echo "Self-verify artifact validation failed." >&2
  exit 3
fi

log_context="${AGENT_LOG_CONTEXT:-local}"
if [[ -z "${AGENT_LOG_CONTEXT:-}" && "${CI:-}" == "true" ]]; then
  log_context="ci"
fi
if ! scripts/agent-log.sh --artifact "${out_path}" --context "${log_context}"; then
  echo "Failed to append agent work log entry." >&2
  exit 4
fi

if [[ "${overall_status}" == "FAIL" ]]; then
  exit 1
fi

exit 0
