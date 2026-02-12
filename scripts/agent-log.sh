#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/agent-log.sh --artifact <self-verify-artifact.json> [--context <local|ci|manual>] [--log <path>]

Exit codes:
  0: log entry appended
  1: runtime failure
  2: invalid usage
USAGE
}

sanitize_cell() {
  local value="$1"
  value="${value//$'\n'/ }"
  value="${value//$'\r'/ }"
  value="${value//|/\\|}"
  echo "${value}"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 1
  fi
}

artifact_path=""
context="local"
log_path="docs/agent/WORK_LOG.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact)
      artifact_path="${2:-}"
      shift 2
      ;;
    --context)
      context="${2:-}"
      shift 2
      ;;
    --log)
      log_path="${2:-}"
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

if [[ -z "${artifact_path}" ]]; then
  echo "Missing required argument: --artifact" >&2
  usage
  exit 2
fi

case "${context}" in
  local|ci|manual) ;;
  *)
    echo "Invalid --context value: ${context}" >&2
    exit 2
    ;;
esac

require_cmd jq
require_cmd python3

if [[ ! -f "${artifact_path}" ]]; then
  echo "Artifact not found: ${artifact_path}" >&2
  exit 1
fi

generated_at="$(jq -r '.generated_at // empty' "${artifact_path}")"
ticket="$(jq -r '.ticket // empty' "${artifact_path}")"
branch="$(jq -r '.git_context.branch // empty' "${artifact_path}")"
head_sha="$(jq -r '.git_context.head_sha // empty' "${artifact_path}")"
risk_level="$(jq -r '.risk_level // empty' "${artifact_path}")"
overall_status="$(jq -r '.overall_status // empty' "${artifact_path}")"
req_ids="$(jq -r '(.req_ids // []) | join(",")' "${artifact_path}")"
checks_passed="$(jq '[.checks[] | select(.status == "PASS")] | length' "${artifact_path}")"
checks_total="$(jq '(.checks // []) | length' "${artifact_path}")"
agent_name="$(jq -r '.agent.name // empty' "${artifact_path}")"

if [[ -z "${generated_at}" || -z "${ticket}" || -z "${risk_level}" || -z "${overall_status}" || -z "${agent_name}" ]]; then
  echo "Artifact is missing required fields for work-log append: ${artifact_path}" >&2
  exit 1
fi

if [[ -z "${branch}" ]]; then
  branch="UNKNOWN_BRANCH"
fi
if [[ -z "${head_sha}" ]]; then
  head_sha="UNKNOWN_SHA"
fi
if [[ -z "${req_ids}" ]]; then
  req_ids="NO_REQ_IDS"
fi

mkdir -p "$(dirname "${log_path}")"
if [[ ! -f "${log_path}" ]]; then
  cat > "${log_path}" <<'EOF'
# Agent Work Log

Append-only execution ledger for agent runs.  
Generated entries are written by `scripts/agent-log.sh`.

| Timestamp (UTC) | Context | Agent | Ticket | Branch | Head SHA | Risk | Status | Checks (pass/total) | REQ IDs | Artifact |
|---|---|---|---|---|---|---|---|---|---|---|
EOF
fi

artifact_rel="$(python3 - "${artifact_path}" <<'PY'
import os
import sys

path = os.path.abspath(sys.argv[1])
root = os.getcwd()
try:
    print(os.path.relpath(path, root))
except Exception:
    print(path)
PY
)"

row="| $(sanitize_cell "${generated_at}") | $(sanitize_cell "${context}") | $(sanitize_cell "${agent_name}") | $(sanitize_cell "${ticket}") | $(sanitize_cell "${branch}") | $(sanitize_cell "${head_sha}") | $(sanitize_cell "${risk_level}") | $(sanitize_cell "${overall_status}") | $(sanitize_cell "${checks_passed}/${checks_total}") | $(sanitize_cell "${req_ids}") | \`$(sanitize_cell "${artifact_rel}")\` |"
echo "${row}" >> "${log_path}"
