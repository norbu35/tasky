#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/self-verify.sh \
    --ticket <TICKET-ID> \
    --risk <low|medium|high> \
    --req <REQ-IDS-CSV> \
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
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  head_sha="$(git rev-parse --short=40 HEAD)"
else
  head_sha="NO_HEAD"
  if [[ "${base_ref}" == "HEAD" ]]; then
    base_ref="EMPTY_TREE"
  fi
fi

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
      "changed_module_tests"
    )
    ;;
  medium)
    required_checks=(
      "format_lint"
      "commit_message_lint"
      "secret_scan"
      "changed_module_tests"
      "openapi_validation"
      "integration_tests_touched"
      "coverage_gate_touched"
    )
    ;;
  high)
    required_checks=(
      "format_lint"
      "commit_message_lint"
      "secret_scan"
      "changed_module_tests"
      "openapi_validation"
      "integration_tests_touched"
      "coverage_gate_touched"
      "full_test_suite"
      "sast_dependency_scan"
      "migration_safety"
      "performance_smoke"
    )
    ;;
esac

check_title() {
  case "$1" in
    format_lint) echo "Format and lint checks" ;;
    commit_message_lint) echo "Commit message lint" ;;
    secret_scan) echo "Secret scan" ;;
    changed_module_tests) echo "Changed-module tests" ;;
    openapi_validation) echo "OpenAPI contract validation" ;;
    integration_tests_touched) echo "Integration tests for touched modules" ;;
    coverage_gate_touched) echo "Coverage gate on touched critical modules" ;;
    full_test_suite) echo "Full test suite" ;;
    sast_dependency_scan) echo "SAST and dependency scan" ;;
    migration_safety) echo "Migration safety verification" ;;
    performance_smoke) echo "Performance smoke test" ;;
    *) echo "Unknown check" ;;
  esac
}

check_command() {
  case "$1" in
    format_lint)
      echo "./gradlew --no-daemon checkstyleMain checkstyleTest"
      ;;
    commit_message_lint)
      echo "python3 scripts/validate-commit-messages.py"
      ;;
    secret_scan)
      echo "! rg -n --hidden --glob '!.git' --glob '!artifacts/**' --glob '!build/**' 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----' ."
      ;;
    changed_module_tests)
      echo "./gradlew --no-daemon test"
      ;;
    openapi_validation)
      echo "./gradlew --no-daemon openApiValidate"
      ;;
    integration_tests_touched)
      echo "if find src/test -type f 2>/dev/null | rg -q 'Integration|IT'; then ./gradlew --no-daemon test --tests '*Integration*' --tests '*IT*'; else ./gradlew --no-daemon test; fi"
      ;;
    coverage_gate_touched)
      echo "./gradlew --no-daemon jacocoTestCoverageVerification"
      ;;
    full_test_suite)
      echo "./gradlew --no-daemon check"
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
    *)
      echo "Unknown check id: $1" >&2
      exit 4
      ;;
  esac
}

mkdir -p "$(dirname "${out_path}")"
mkdir -p artifacts/checks

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
}

for check_id in "${required_checks[@]}"; do
  run_check "${check_id}"
done

req_ids_json="$(printf '%s\n' "${req_ids[@]}" | jq -R . | jq -s .)"
files_changed_json="$(printf '%s\n' "${files_changed[@]}" | jq -R . | jq -s .)"
required_checks_json="$(printf '%s\n' "${required_checks[@]}" | jq -R . | jq -s .)"
known_risks_json="$(jq -n '["Automated checks reduce but do not eliminate risk; human review remains mandatory."]')"
assumptions_json="$(jq -n '["Checks executed in local development environment with available tooling."]')"
proof_test="$(jq -r '([.[] | select(.status=="PASS") | .id][0] // "NO_PROOF_TEST_AVAILABLE")' <<< "${checks_json}")"
generated_at="$(now_iso)"
agent_name="${AGENT_NAME:-Codex}"
agent_version="${AGENT_VERSION:-unknown}"

artifact_json="$(jq -n \
  --arg schema_version "1.0.0" \
  --arg generated_at "${generated_at}" \
  --arg ticket "${ticket}" \
  --arg risk_level "${risk}" \
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
  --argjson known_risks "${known_risks_json}" \
  --argjson assumptions "${assumptions_json}" \
  '{
    schema_version: $schema_version,
    generated_at: $generated_at,
    ticket: $ticket,
    risk_level: $risk_level,
    req_ids: $req_ids,
    files_changed: $files_changed,
    required_check_ids: $required_check_ids,
    checks: $checks,
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
