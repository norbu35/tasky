#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/agent-flow.sh status [--format table|json] [--filter pending|in_progress|done|available|all]
  scripts/agent-flow.sh start --agent <name> [--ticket <TICKET-ID>] [--slug <slug>] [--dry-run]
  scripts/agent-flow.sh verify --ticket <TICKET-ID> [--ticket-spec <path>] [--risk <low|medium|high>] [--req <REQ-CSV>] [--base <git-ref>] [--out <path>] [--only <check-id>]
  scripts/agent-flow.sh complete --ticket <TICKET-ID> [--agent <name>] [--artifact <path>]

Commands:
  status    Show ticket coordination status.
  start     Create/switch to implementation branch, then claim ticket.
  verify    Run self-verification using ticket metadata defaults.
  complete  Mark claimed ticket done after optional artifact validation.
USAGE
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 2
  fi
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

command="$1"
shift

case "${command}" in
  status)
    exec scripts/ticket-status.sh "$@"
    ;;
  start)
    require_cmd git
    require_cmd jq
    require_cmd python3

    agent_name=""
    ticket_id=""
    slug="work"
    dry_run=false

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --agent) agent_name="${2:-}"; shift 2 ;;
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --slug) slug="${2:-}"; shift 2 ;;
        --dry-run) dry_run=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for start: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${agent_name}" ]]; then
      echo "Missing required --agent for start." >&2
      exit 2
    fi

    if [[ -z "${ticket_id}" ]]; then
      ticket_id="$(scripts/ticket-status.sh --format json --filter available | jq -r '.[0].ticket // empty')"
    fi

    if [[ ! "${ticket_id}" =~ ^[A-Z][A-Z0-9_]*-[0-9]+$ ]]; then
      echo "No available ticket to start." >&2
      exit 1
    fi

    if [[ ! "${slug}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
      echo "Invalid --slug. Use lowercase letters, digits, and dashes." >&2
      exit 1
    fi

    target_branch="agent/${ticket_id}-${slug}"

    if [[ "${dry_run}" == true ]]; then
      echo "ticket=${ticket_id}"
      echo "branch=${target_branch}"
      scripts/claim-ticket.sh --agent "${agent_name}" --ticket "${ticket_id}" --branch "${target_branch}" --dry-run >/dev/null
      exit 0
    fi

    current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
    if [[ "${current_branch}" != "${target_branch}" ]]; then
      if git show-ref --verify --quiet "refs/heads/${target_branch}"; then
        git checkout "${target_branch}" >/dev/null
      else
        git checkout -b "${target_branch}" >/dev/null
      fi
    fi

    claimed="$(scripts/claim-ticket.sh --agent "${agent_name}" --ticket "${ticket_id}" --branch "${target_branch}")"
    echo "started ticket=${claimed} branch=${target_branch}"
    ;;
  verify)
    require_cmd jq

    ticket_id=""
    ticket_spec=""
    risk=""
    req_csv=""
    base_ref=""
    out_path=""
    only_check=""

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --ticket-spec) ticket_spec="${2:-}"; shift 2 ;;
        --risk) risk="${2:-}"; shift 2 ;;
        --req) req_csv="${2:-}"; shift 2 ;;
        --base) base_ref="${2:-}"; shift 2 ;;
        --out) out_path="${2:-}"; shift 2 ;;
        --only) only_check="${2:-}"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for verify: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${ticket_id}" ]]; then
      echo "Missing required --ticket for verify." >&2
      exit 2
    fi

    if [[ -z "${ticket_spec}" ]]; then
      ticket_spec="tickets/${ticket_id}.json"
    fi

    if [[ ! -f "${ticket_spec}" ]]; then
      echo "Ticket spec not found: ${ticket_spec}" >&2
      exit 1
    fi

    if [[ -z "${risk}" ]]; then
      risk="$(jq -r '.risk_level // empty' "${ticket_spec}")"
    fi
    if [[ -z "${req_csv}" ]]; then
      req_csv="$(jq -r '.req_ids | join(",")' "${ticket_spec}")"
    fi

    if [[ -z "${risk}" || -z "${req_csv}" ]]; then
      echo "Unable to resolve risk/requirements from ${ticket_spec}." >&2
      exit 1
    fi

    cmd=(scripts/self-verify.sh --ticket "${ticket_id}" --risk "${risk}" --req "${req_csv}" --ticket-spec "${ticket_spec}")
    if [[ -n "${base_ref}" ]]; then
      cmd+=(--base "${base_ref}")
    fi
    if [[ -n "${out_path}" ]]; then
      cmd+=(--out "${out_path}")
    fi
    if [[ -n "${only_check}" ]]; then
      cmd+=(--only "${only_check}")
    fi

    exec "${cmd[@]}"
    ;;
  complete)
    ticket_id=""
    agent_name=""
    artifact_path="artifacts/self-verify.json"

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --agent) agent_name="${2:-}"; shift 2 ;;
        --artifact) artifact_path="${2:-}"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for complete: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${ticket_id}" ]]; then
      echo "Missing required --ticket for complete." >&2
      exit 2
    fi

    cmd=(scripts/complete-ticket.sh --ticket "${ticket_id}" --artifact "${artifact_path}")
    if [[ -n "${agent_name}" ]]; then
      cmd+=(--agent "${agent_name}")
    fi
    exec "${cmd[@]}"
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown command: ${command}" >&2
    usage
    exit 2
    ;;
esac
