#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/agent-flow.sh status [--format table|json] [--filter pending|in_progress|done|available|all]
  scripts/agent-flow.sh start --agent <name> [--ticket <TICKET-ID>] [--slug <slug>] [--workspace shared|isolated] [--worktree-root <path>] [--dry-run]
  scripts/agent-flow.sh verify --ticket <TICKET-ID> [--ticket-spec <path>] [--risk <low|medium|high>] [--req <REQ-CSV>] [--base <git-ref>] [--out <path>] [--only <check-id>]
  scripts/agent-flow.sh complete --ticket <TICKET-ID> [--agent <name>] [--artifact <path>]
  scripts/agent-flow.sh doctor

Commands:
  status    Show ticket coordination status.
  start     Resume own in-progress ticket or claim a new one (default: isolated worktree).
  verify    Run self-verification using ticket metadata defaults.
  complete  Mark claimed ticket done after optional artifact validation.
  doctor    Check environment for required tools.
USAGE
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 2
  fi
}

check_env() {
  local missing=0
  local tools=("git" "jq" "python3" "rg" "pnpm" "java" "docker")
  echo "Checking environment tools..."
  for tool in "${tools[@]}"; do
    if command -v "${tool}" >/dev/null 2>&1; then
      echo "  [PASS] ${tool}: $(command -v "${tool}")"
    else
      echo "  [FAIL] ${tool} is missing"
      missing=$((missing + 1))
    fi
  done

  if [[ ! -x "./gradlew" ]]; then
    echo "  [FAIL] ./gradlew is missing or not executable"
    missing=$((missing + 1))
  else
    echo "  [PASS] ./gradlew: found"
  fi

  if [[ ${missing} -gt 0 ]]; then
    echo "Environment check failed with ${missing} errors."
    return 1
  fi
  echo "Environment is healthy."
  return 0
}

sanitize_for_path() {
  local raw="${1:-agent}"
  local safe
  safe="$(echo "${raw}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')"
  safe="$(echo "${safe}" | sed 's/--*/-/g; s/^-//; s/-$//')"
  if [[ -z "${safe}" ]]; then
    safe="agent"
  fi
  echo "${safe}"
}

worktree_exists() {
  local target_path="$1"
  git worktree list --porcelain | awk '/^worktree / {print $2}' | grep -Fxq "${target_path}"
}

branch_worktree_paths() {
  local branch_ref="refs/heads/$1"
  git worktree list --porcelain | awk -v branch_ref="${branch_ref}" '
    $1=="worktree" { wt=$2 }
    $1=="branch" && $2==branch_ref { print wt }
  '
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
    workspace_mode="isolated"
    worktree_root=".worktrees"
    dry_run=false

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --agent) agent_name="${2:-}"; shift 2 ;;
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --slug) slug="${2:-}"; shift 2 ;;
        --workspace) workspace_mode="${2:-}"; shift 2 ;;
        --worktree-root) worktree_root="${2:-}"; shift 2 ;;
        --dry-run) dry_run=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for start: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${agent_name}" ]]; then
      echo "Missing required --agent for start." >&2
      exit 2
    fi

    if [[ ! "${slug}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
      echo "Invalid --slug. Use lowercase letters, digits, and dashes." >&2
      exit 1
    fi

    if [[ "${workspace_mode}" != "shared" && "${workspace_mode}" != "isolated" ]]; then
      echo "Invalid --workspace. Use shared or isolated." >&2
      exit 1
    fi

    status_file="tickets/STATUS.json"
    if [[ ! -f "${status_file}" ]]; then
      echo "Status file not found: ${status_file}" >&2
      exit 1
    fi

    resume_mode=false
    claimed_branch=""
    normalized_agent_name="$(echo "${agent_name}" | tr '[:upper:]' '[:lower:]')"
    effective_in_progress_json="$(scripts/ticket-status.sh --format json --filter in_progress)"

    if [[ -z "${ticket_id}" ]]; then
      owned_in_progress=()
      while IFS= read -r owned_ticket; do
        if [[ -n "${owned_ticket}" ]]; then
          owned_in_progress+=("${owned_ticket}")
        fi
      done < <(
        printf '%s\n' "${effective_in_progress_json}" | jq -r --arg agent "${normalized_agent_name}" \
          '.[] | select((.agent // "" | ascii_downcase) == $agent) | .ticket'
      )

      if [[ ${#owned_in_progress[@]} -eq 1 ]]; then
        ticket_id="${owned_in_progress[0]}"
        resume_mode=true
      elif [[ ${#owned_in_progress[@]} -gt 1 ]]; then
        echo "Agent '${agent_name}' has multiple in-progress tickets: ${owned_in_progress[*]}" >&2
        echo "Specify --ticket to resume one explicitly." >&2
        exit 1
      else
        ticket_id="$(scripts/ticket-status.sh --format json --filter available | jq -r '.[0].ticket // empty')"
      fi
    fi

    if [[ ! "${ticket_id}" =~ ^[A-Z][A-Z0-9_]*-[0-9]+$ ]]; then
      echo "No available ticket to start." >&2
      exit 1
    fi

    ticket_status="$(jq -r --arg tid "${ticket_id}" '.tickets[$tid].status // "missing"' "${status_file}")"
    ticket_agent="$(jq -r --arg tid "${ticket_id}" '.tickets[$tid].agent // ""' "${status_file}")"
    ticket_branch="$(jq -r --arg tid "${ticket_id}" '.tickets[$tid].branch // ""' "${status_file}")"
    effective_claim="$(printf '%s\n' "${effective_in_progress_json}" | jq -c --arg tid "${ticket_id}" '.[] | select(.ticket == $tid)' | head -n 1 || true)"

    if [[ -n "${effective_claim}" ]]; then
      ticket_status="in_progress"
      ticket_agent="$(echo "${effective_claim}" | jq -r '.agent // ""')"
      ticket_branch="$(echo "${effective_claim}" | jq -r '.branch // ""')"
    fi

    if [[ "${ticket_status}" == "in_progress" ]]; then
      normalized_ticket_agent="$(echo "${ticket_agent}" | tr '[:upper:]' '[:lower:]')"
      if [[ "${normalized_ticket_agent}" == "${normalized_agent_name}" ]]; then
        resume_mode=true
      else
        echo "Ticket ${ticket_id} is already in progress by '${ticket_agent}' on branch '${ticket_branch}'." >&2
        echo "Pick another available ticket." >&2
        exit 1
      fi
    elif [[ "${ticket_status}" == "done" ]]; then
      echo "Ticket ${ticket_id} is already done." >&2
      exit 1
    elif [[ "${ticket_status}" == "missing" ]]; then
      echo "Ticket ${ticket_id} not found in ${status_file}." >&2
      exit 1
    elif [[ "${ticket_status}" != "pending" ]]; then
      echo "Ticket ${ticket_id} has unsupported status '${ticket_status}'." >&2
      exit 1
    fi

    if [[ "${resume_mode}" == true ]]; then
      claimed_branch="${ticket_branch}"
      if [[ -z "${claimed_branch}" ]]; then
        echo "Ticket ${ticket_id} is in_progress but branch is missing in ${status_file}." >&2
        exit 1
      fi
      if [[ ! "${claimed_branch}" =~ ^agent/${ticket_id}- ]]; then
        echo "Claimed branch '${claimed_branch}' does not match ticket '${ticket_id}'." >&2
        exit 1
      fi
      target_branch="${claimed_branch}"
    else
      target_branch="agent/${ticket_id}-${slug}"
    fi

    worktree_path=""
    if [[ "${workspace_mode}" == "isolated" ]]; then
      safe_agent="$(sanitize_for_path "${agent_name}")"
      default_worktree_path="${worktree_root%/}/${safe_agent}/${ticket_id}"
      if [[ "${default_worktree_path}" != /* ]]; then
        default_worktree_path="${repo_root}/${default_worktree_path}"
      fi
      worktree_path="${default_worktree_path}"
      existing_branch_worktree="$(branch_worktree_paths "${target_branch}" | head -n 1 || true)"
      if [[ -n "${existing_branch_worktree}" ]]; then
        worktree_path="${existing_branch_worktree}"
      fi
    fi

    if [[ "${dry_run}" == true ]]; then
      echo "ticket=${ticket_id}"
      echo "branch=${target_branch}"
      echo "workspace=${workspace_mode}"
      echo "action=$([[ "${resume_mode}" == true ]] && echo "resume" || echo "claim")"
      if [[ "${workspace_mode}" == "isolated" ]]; then
        echo "worktree=${worktree_path}"
      fi
      if [[ "${resume_mode}" == false ]]; then
        scripts/claim-ticket.sh --agent "${agent_name}" --ticket "${ticket_id}" --branch "${target_branch}" --dry-run >/dev/null
      fi
      exit 0
    fi

    if [[ "${workspace_mode}" == "shared" ]]; then
      current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
      if [[ "${current_branch}" != "${target_branch}" ]]; then
        if git show-ref --verify --quiet "refs/heads/${target_branch}"; then
          git checkout "${target_branch}" >/dev/null
        else
          git checkout -b "${target_branch}" >/dev/null
        fi
      fi

      if [[ "${resume_mode}" == true ]]; then
        echo "resumed ticket=${ticket_id} branch=${target_branch} workspace=shared"
        exit 0
      fi

      claimed="$(scripts/claim-ticket.sh --agent "${agent_name}" --ticket "${ticket_id}" --branch "${target_branch}")"
      echo "started ticket=${claimed} branch=${target_branch} workspace=shared"
      exit 0
    fi

    mkdir -p "$(dirname "${worktree_path}")"

    if worktree_exists "${worktree_path}"; then
      current_wt_branch="$(git -C "${worktree_path}" symbolic-ref --short HEAD 2>/dev/null || true)"
      if [[ "${current_wt_branch}" != "${target_branch}" ]]; then
        echo "Worktree already exists at '${worktree_path}' but is on branch '${current_wt_branch}'." >&2
        echo "Use a different --worktree-root or clean the existing worktree." >&2
        exit 1
      fi
    else
      if [[ -d "${worktree_path}" ]]; then
        echo "Target worktree path already exists and is not registered as a git worktree: ${worktree_path}" >&2
        exit 1
      fi

      if [[ "${resume_mode}" == true ]] && ! git show-ref --verify --quiet "refs/heads/${target_branch}"; then
        if git show-ref --verify --quiet "refs/remotes/origin/${target_branch}"; then
          git branch --track "${target_branch}" "origin/${target_branch}" >/dev/null
        fi
      fi

      if git show-ref --verify --quiet "refs/heads/${target_branch}"; then
        existing_branch_worktree="$(branch_worktree_paths "${target_branch}" | head -n 1 || true)"
        if [[ -n "${existing_branch_worktree}" && "${existing_branch_worktree}" != "${worktree_path}" ]]; then
          echo "Branch '${target_branch}' is already checked out in worktree '${existing_branch_worktree}'." >&2
          echo "Use a different ticket slug or remove the existing worktree first." >&2
          exit 1
        fi
        git worktree add "${worktree_path}" "${target_branch}" >/dev/null
      else
        if [[ "${resume_mode}" == true ]]; then
          echo "Cannot resume ${ticket_id}: branch '${target_branch}' is missing locally." >&2
          exit 1
        fi
        git worktree add -b "${target_branch}" "${worktree_path}" >/dev/null
      fi
    fi

    if [[ "${resume_mode}" == true ]]; then
      echo "resumed ticket=${ticket_id} branch=${target_branch} workspace=isolated worktree=${worktree_path}"
      exit 0
    fi

    claimed="$(
      cd "${worktree_path}"
      scripts/claim-ticket.sh --agent "${agent_name}" --ticket "${ticket_id}" --branch "${target_branch}"
    )"
    echo "started ticket=${claimed} branch=${target_branch} workspace=isolated worktree=${worktree_path}"
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
  doctor)
    check_env
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
