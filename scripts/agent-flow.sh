#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/agent-flow.sh status [--format table|json] [--filter pending|in_progress|done|available|all]
  scripts/agent-flow.sh start --agent <name> [--ticket <TICKET-ID>] [--slug <slug>] [--workspace shared|isolated] [--worktree-root <path>] [--auto-claim] [--dry-run]
  scripts/agent-flow.sh verify --ticket <TICKET-ID> [--ticket-spec <path>] [--risk <low|medium|high>] [--req <REQ-CSV>] [--base <git-ref>] [--out <path>] [--only <check-id>]
  scripts/agent-flow.sh complete --ticket <TICKET-ID> [--agent <name>] [--artifact <path>]
  scripts/agent-flow.sh finish --ticket <TICKET-ID> [--agent <name>] [--artifact <path>] [verify-opts...]
  scripts/agent-flow.sh merge --ticket <TICKET-ID> [--main-branch <main|master>] [--source-branch <agent-branch>] [--no-push] [--no-cleanup]
  scripts/agent-flow.sh doctor

Commands:
  status    Show ticket coordination status.
  start     Resume own in-progress ticket; explicit --ticket required for new claim unless --auto-claim is set.
  verify    Run self-verification using ticket metadata defaults.
  complete  Mark claimed ticket done after optional artifact validation.
  finish    Run verify then complete in one step (verify + complete).
  merge     Merge a completed ticket branch from its worktree into main, then clean local source branch/worktree.
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

find_worktree_for_branch() {
  local branch_ref="refs/heads/$1"
  git worktree list --porcelain | awk -v branch_ref="${branch_ref}" '
    $1=="worktree" { wt=$2 }
    $1=="branch" && $2==branch_ref { print wt; exit }
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
    auto_claim=false
    dry_run=false

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --agent) agent_name="${2:-}"; shift 2 ;;
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --slug) slug="${2:-}"; shift 2 ;;
        --workspace) workspace_mode="${2:-}"; shift 2 ;;
        --worktree-root) worktree_root="${2:-}"; shift 2 ;;
        --auto-claim) auto_claim=true; shift ;;
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
    # Cache full ticket-status JSON to avoid redundant scans of remote agent branches
    cached_status_json="$(scripts/ticket-status.sh --format json)"
    effective_in_progress_json="$(printf '%s\n' "${cached_status_json}" | jq -c '.in_progress')"
    effective_available_json="$(printf '%s\n' "${cached_status_json}" | jq -c '.available')"

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
        if [[ "${auto_claim}" == true ]]; then
          ticket_id="$(printf '%s\n' "${effective_available_json}" | jq -r '.[0].ticket // empty')"
        else
          next_ticket="$(printf '%s\n' "${effective_available_json}" | jq -r '.[0].ticket // empty')"
          echo "No resumable ticket found for agent '${agent_name}'." >&2
          echo "Explicit --ticket is required before claiming new work." >&2
          if [[ -n "${next_ticket}" ]]; then
            echo "Next recommended ticket: ${next_ticket}" >&2
            echo "Run: scripts/agent-flow.sh start --agent ${agent_name} --ticket ${next_ticket} --slug <slug> --workspace ${workspace_mode}" >&2
            echo "Use --auto-claim to restore previous auto-pick behavior." >&2
          else
            echo "No available tickets are ready to claim." >&2
          fi
          exit 1
        fi
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

    "${cmd[@]}"
    exit $?
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
  finish)
    require_cmd jq

    ticket_id=""
    agent_name=""
    artifact_path="artifacts/self-verify.json"
    verify_args=()

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --agent) agent_name="${2:-}"; shift 2 ;;
        --artifact) artifact_path="${2:-}"; shift 2 ;;
        --ticket-spec|--risk|--req|--base|--out|--only)
          verify_args+=("$1" "${2:-}"); shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for finish: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${ticket_id}" ]]; then
      echo "Missing required --ticket for finish." >&2
      exit 2
    fi

    # Run verify
    verify_cmd=("${BASH_SOURCE[0]}" verify --ticket "${ticket_id}" "${verify_args[@]+"${verify_args[@]}"}")
    "${verify_cmd[@]}"
    verify_rc=$?
    if [[ ${verify_rc} -ne 0 ]]; then
      echo "Verify failed (exit ${verify_rc}). Skipping complete." >&2
      exit ${verify_rc}
    fi

    # Run complete
    complete_cmd=("${BASH_SOURCE[0]}" complete --ticket "${ticket_id}" --artifact "${artifact_path}")
    if [[ -n "${agent_name}" ]]; then
      complete_cmd+=(--agent "${agent_name}")
    fi
    exec "${complete_cmd[@]}"
    ;;
  merge)
    require_cmd git
    require_cmd jq

    ticket_id=""
    main_branch="main"
    source_branch=""
    push_after_merge=true
    cleanup_after_merge=true

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --ticket) ticket_id="${2:-}"; shift 2 ;;
        --main-branch) main_branch="${2:-}"; shift 2 ;;
        --source-branch) source_branch="${2:-}"; shift 2 ;;
        --no-push) push_after_merge=false; shift ;;
        --no-cleanup) cleanup_after_merge=false; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown argument for merge: $1" >&2; exit 2 ;;
      esac
    done

    if [[ -z "${ticket_id}" ]]; then
      echo "Missing required --ticket for merge." >&2
      exit 2
    fi
    if [[ ! "${ticket_id}" =~ ^[A-Z][A-Z0-9_]*-[0-9]+$ ]]; then
      echo "Invalid --ticket format: ${ticket_id}" >&2
      exit 1
    fi
    if [[ -z "${source_branch}" ]]; then
      current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
      if [[ "${current_branch}" =~ ^agent/${ticket_id}- ]]; then
        source_branch="${current_branch}"
      else
        source_branch="$(jq -r --arg tid "${ticket_id}" '.tickets[$tid].branch // empty' tickets/STATUS.json)"
        if [[ -z "${source_branch}" ]]; then
          source_branch="$(git for-each-ref --format='%(refname:short)' "refs/heads/agent/${ticket_id}-*" | head -n 1 || true)"
        fi
        if [[ -z "${source_branch}" ]]; then
          remote_candidate="$(git for-each-ref --format='%(refname:short)' "refs/remotes/origin/agent/${ticket_id}-*" | head -n 1 || true)"
          source_branch="${remote_candidate#origin/}"
        fi
      fi
    fi

    if [[ -z "${source_branch}" ]]; then
      echo "Unable to resolve source branch for ${ticket_id}. Use --source-branch." >&2
      exit 1
    fi
    if [[ ! "${source_branch}" =~ ^agent/${ticket_id}- ]]; then
      echo "Source branch '${source_branch}' must match agent/${ticket_id}-<slug>." >&2
      exit 1
    fi

    if ! git show-ref --verify --quiet "refs/heads/${source_branch}"; then
      if git show-ref --verify --quiet "refs/remotes/origin/${source_branch}"; then
        git branch --track "${source_branch}" "origin/${source_branch}" >/dev/null
      else
        echo "Source branch '${source_branch}' not found locally or on origin." >&2
        exit 1
      fi
    fi

    ticket_status_on_source="$(git show "${source_branch}:tickets/STATUS.json" | jq -r --arg tid "${ticket_id}" '.tickets[$tid].status // "missing"')"
    if [[ "${ticket_status_on_source}" != "done" ]]; then
      echo "Ticket ${ticket_id} is '${ticket_status_on_source}' on ${source_branch}. Run complete before merge." >&2
      exit 1
    fi

    main_worktree="$(find_worktree_for_branch "${main_branch}")"
    if [[ -z "${main_worktree}" ]]; then
      echo "Branch '${main_branch}' is not checked out in any worktree." >&2
      echo "Check out ${main_branch} in a worktree, then retry merge." >&2
      exit 1
    fi

    main_current_branch="$(git -C "${main_worktree}" symbolic-ref --short HEAD 2>/dev/null || true)"
    if [[ "${main_current_branch}" != "${main_branch}" ]]; then
      echo "Main worktree '${main_worktree}' is on '${main_current_branch}', expected '${main_branch}'." >&2
      exit 1
    fi

    if ! git -C "${main_worktree}" diff --quiet || ! git -C "${main_worktree}" diff --cached --quiet; then
      echo "Main worktree has tracked-file changes. Commit/stash them before merge." >&2
      exit 1
    fi

    git -C "${main_worktree}" fetch origin "${main_branch}" >/dev/null
    if git show-ref --verify --quiet "refs/remotes/origin/${source_branch}"; then
      git -C "${main_worktree}" fetch origin "${source_branch}" >/dev/null
    fi
    git -C "${main_worktree}" pull --ff-only origin "${main_branch}" >/dev/null

    # Rebase only when main and source have diverged (neither is ancestor of the other).
    if ! git merge-base --is-ancestor "${source_branch}" "${main_branch}" \
      && ! git merge-base --is-ancestor "${main_branch}" "${source_branch}"; then
      echo "Source branch '${source_branch}' has diverged from '${main_branch}'. Rebasing..." >&2
      source_worktree="$(find_worktree_for_branch "${source_branch}")"
      tmp_worktree_created=false
      if [[ -z "${source_worktree}" ]]; then
        source_worktree="$(mktemp -d "${repo_root}/.worktrees/tmp-rebase-XXXXXX")"
        git worktree add "${source_worktree}" "${source_branch}" >/dev/null
        tmp_worktree_created=true
      fi
      if ! git -C "${source_worktree}" rebase "${main_branch}" >/dev/null 2>&1; then
        git -C "${source_worktree}" rebase --abort 2>/dev/null || true
        if [[ "${tmp_worktree_created}" == true ]]; then
          git worktree remove "${source_worktree}" --force 2>/dev/null || true
        fi
        echo "Rebase of '${source_branch}' onto '${main_branch}' failed due to conflicts." >&2
        echo "Resolve conflicts in the source worktree and re-run merge." >&2
        exit 1
      fi
      if [[ "${tmp_worktree_created}" == true ]]; then
        git worktree remove "${source_worktree}" --force 2>/dev/null || true
      fi
    fi

    git -C "${main_worktree}" merge --ff-only "${source_branch}" >/dev/null

    if [[ "${push_after_merge}" == true ]]; then
      git -C "${main_worktree}" push origin "${main_branch}" >/dev/null
    fi

    cleanup_source_worktree="$(find_worktree_for_branch "${source_branch}")"
    cleanup_status="disabled"
    cleanup_notes=()

    if [[ "${cleanup_after_merge}" == true ]]; then
      cleanup_status="ok"

      if [[ -n "${cleanup_source_worktree}" && "${cleanup_source_worktree}" != "${main_worktree}" ]]; then
        if [[ "$(pwd -P)" == "${cleanup_source_worktree}"* ]]; then
          cd "${main_worktree}"
        fi
        if git worktree remove "${cleanup_source_worktree}" --force >/dev/null 2>&1; then
          cleanup_notes+=("worktree_removed=${cleanup_source_worktree}")
        else
          cleanup_status="failed"
          cleanup_notes+=("worktree_remove_failed=${cleanup_source_worktree}")
        fi
      elif [[ -n "${cleanup_source_worktree}" ]]; then
        cleanup_notes+=("worktree_kept=${cleanup_source_worktree}")
      else
        cleanup_notes+=("worktree_absent")
      fi

      if git show-ref --verify --quiet "refs/heads/${source_branch}"; then
        if git update-ref -d "refs/heads/${source_branch}" >/dev/null 2>&1; then
          cleanup_notes+=("branch_deleted=${source_branch}")
        else
          cleanup_status="failed"
          cleanup_notes+=("branch_delete_failed=${source_branch}")
        fi
      else
        cleanup_notes+=("branch_absent=${source_branch}")
      fi

      # Clean up remote branch
      if git ls-remote --exit-code origin "refs/heads/${source_branch}" >/dev/null 2>&1; then
        if git push origin --delete "${source_branch}" 2>/dev/null; then
          cleanup_notes+=("remote_branch_deleted=${source_branch}")
        else
          cleanup_notes+=("remote_branch_delete_failed=${source_branch}")
        fi
      else
        cleanup_notes+=("remote_branch_absent=${source_branch}")
      fi
    fi

    details_str=$(echo "${cleanup_notes[*]}" | tr ' ' ',')
    echo "merged ticket=${ticket_id} source=${source_branch} target=${main_branch} worktree=${main_worktree} pushed=${push_after_merge} cleanup=${cleanup_status} details=${details_str}"
    if [[ "${cleanup_status}" == "failed" ]]; then
      echo "Local cleanup failed after merge. Resolve remaining worktree/branch references and retry cleanup." >&2
      exit 1
    fi
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
