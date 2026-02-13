#!/usr/bin/env bash
set -euo pipefail

##############################################################################
# claim-ticket.sh — Atomically claim the next available ticket for an agent.
#
# Usage:
#   scripts/claim-ticket.sh --agent <agent-name> [--ticket <TICKET-ID>] [--branch <branch-name>] [--dry-run]
#
# Behavior:
#   1. Reads tickets/STATUS.json from repository state.
#   2. Reads ticket specs to resolve dependency graph.
#   3. Finds the next ticket whose deps are all "done" and status is "pending",
#      excluding effective in-progress claims discovered on agent branches.
#      (Or claims a specific ticket if --ticket is provided.)
#   4. Validates branch context and sets status to "in_progress".
#   5. Commits and pushes tickets/STATUS.json as the atomic lock.
#      If push fails (another agent claimed first), pulls and retries.
#
# Exit codes:
#   0: ticket claimed successfully (prints TICKET-ID to stdout)
#   1: no available ticket / claim failed after retries
#   2: invalid usage
##############################################################################

usage() {
  cat <<'USAGE'
Usage:
  scripts/claim-ticket.sh --agent <agent-name> [--ticket <TICKET-ID>] [--branch <branch-name>] [--dry-run]

Options:
  --agent    Required. Name of the agent claiming the ticket.
  --ticket   Optional. Specific ticket to claim. If omitted, picks next available.
  --branch   Optional. Implementation branch. Defaults to current branch.
  --dry-run  Optional. Show what would be claimed without modifying STATUS.json.

Exit codes:
  0: ticket claimed (TICKET-ID printed to stdout)
  1: no ticket available or claim failed
  2: invalid usage
USAGE
}

agent_name=""
target_ticket=""
branch_name=""
dry_run=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)   agent_name="${2:-}"; shift 2 ;;
    --ticket)  target_ticket="${2:-}"; shift 2 ;;
    --branch)  branch_name="${2:-}"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${agent_name}" ]]; then
  echo "Missing required --agent argument." >&2
  usage
  exit 2
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 2
  fi
}
require_cmd jq
require_cmd python3
require_cmd git

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

STATUS_FILE="tickets/STATUS.json"
TICKETS_DIR="tickets"

if [[ ! -f "${STATUS_FILE}" ]]; then
  echo "Status file not found: ${STATUS_FILE}" >&2
  exit 1
fi

current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
if [[ -z "${branch_name}" ]]; then
  branch_name="${current_branch}"
fi

if [[ "${dry_run}" != true && -n "${current_branch}" && "${branch_name}" != "${current_branch}" ]]; then
  echo "Branch mismatch. Current branch is '${current_branch}', but --branch is '${branch_name}'." >&2
  echo "Checkout the target branch before claiming." >&2
  exit 1
fi

if [[ -z "${branch_name}" ]]; then
  echo "Branch context is required. Use --branch agent/<TICKET>-<slug>." >&2
  exit 2
fi

if [[ "${branch_name}" == "main" || "${branch_name}" == "master" ]]; then
  echo "Claiming on '${branch_name}' is forbidden. Create an agent branch first." >&2
  exit 1
fi

if [[ ! "${branch_name}" =~ ^agent/[A-Z][A-Z0-9_]*-[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Branch '${branch_name}' must follow agent/<TICKET-ID>-<slug> format." >&2
  exit 1
fi

# ── Resolve dependency graph ────────────────────────────────────────────────

find_next_ticket() {
  local effective_in_progress_json
  effective_in_progress_json="$(scripts/ticket-status.sh --format json --filter in_progress)"
  python3 - "${STATUS_FILE}" "${TICKETS_DIR}" "${target_ticket}" "${effective_in_progress_json}" <<'PYTHON'
import json
import sys
from pathlib import Path

status_path = Path(sys.argv[1])
tickets_dir = Path(sys.argv[2])
target = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
effective_in_progress_raw = sys.argv[4] if len(sys.argv) > 4 else "[]"

status_data = json.loads(status_path.read_text())
tickets = status_data.get("tickets", {})
try:
    effective_in_progress_list = json.loads(effective_in_progress_raw)
except json.JSONDecodeError:
    effective_in_progress_list = []

effective_claims = {}
for claim in effective_in_progress_list:
    if not isinstance(claim, dict):
        continue
    tid = claim.get("ticket")
    if isinstance(tid, str) and tid:
        effective_claims[tid] = claim

# Build dependency map from ticket specs
deps_map = {}
for ticket_id in tickets:
    spec_path = tickets_dir / f"{ticket_id}.json"
    if spec_path.is_file():
        spec = json.loads(spec_path.read_text())
        deps_map[ticket_id] = spec.get("depends_on", [])
    else:
        deps_map[ticket_id] = []

done_tickets = {tid for tid, info in tickets.items()
                if isinstance(info, dict) and info.get("status") == "done"}

def claim_for(ticket_id):
    return effective_claims.get(ticket_id)

def is_available(ticket_id):
    if claim_for(ticket_id):
        return False
    info = tickets.get(ticket_id, {})
    if not isinstance(info, dict):
        return False
    if info.get("status") != "pending":
        return False
    deps = deps_map.get(ticket_id, [])
    return all(d in done_tickets for d in deps)

if target:
    claim = claim_for(target)
    if claim:
        claim_agent = claim.get("agent", "?")
        claim_branch = claim.get("branch", "?")
        print(
            f"UNAVAILABLE:{target}:status=in_progress:agent={claim_agent}:branch={claim_branch}",
            file=sys.stderr,
        )
        sys.exit(1)
    if not is_available(target):
        info = tickets.get(target, {})
        st = info.get("status", "unknown") if isinstance(info, dict) else "unknown"
        deps = deps_map.get(target, [])
        blocked_by = [d for d in deps if d not in done_tickets]
        if st != "pending":
            print(f"UNAVAILABLE:{target}:status={st}", file=sys.stderr)
        elif blocked_by:
            print(f"UNAVAILABLE:{target}:blocked_by={','.join(blocked_by)}", file=sys.stderr)
        sys.exit(1)
    print(target)
else:
    # Sort by ticket number for deterministic ordering
    import re
    def ticket_sort_key(tid):
        m = re.search(r'(\d+)$', tid)
        return int(m.group(1)) if m else 0

    available = [tid for tid in sorted(tickets.keys(), key=ticket_sort_key)
                 if is_available(tid)]
    if available:
        print(available[0])
    else:
        in_progress = sorted(effective_claims.keys(), key=ticket_sort_key)
        pending_blocked = [tid for tid in tickets
                           if isinstance(tickets[tid], dict)
                           and tickets[tid].get("status") == "pending"
                           and claim_for(tid) is None
                           and not is_available(tid)]
        print(f"NO_AVAILABLE_TICKET:in_progress={len(in_progress)},pending_blocked={len(pending_blocked)}", file=sys.stderr)
        sys.exit(1)
PYTHON
}

selected_ticket="$(find_next_ticket)" || {
  echo "No ticket available to claim." >&2
  exit 1
}

if [[ ! "${branch_name}" =~ ^agent/${selected_ticket}- ]]; then
  echo "Branch '${branch_name}' must start with 'agent/${selected_ticket}-' for claim consistency." >&2
  exit 1
fi

echo "Selected ticket: ${selected_ticket}" >&2

if [[ "${dry_run}" == true ]]; then
  echo "${selected_ticket}"
  exit 0
fi

# ── Claim the ticket ────────────────────────────────────────────────────────

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

claim_ticket() {
  local ticket_id="$1"
  local ts
  ts="$(now_iso)"

  # Update STATUS.json
  local tmp_file
  tmp_file="$(mktemp)"
  jq --arg tid "${ticket_id}" \
     --arg agent "${agent_name}" \
     --arg branch "${branch_name}" \
     --arg claimed_at "${ts}" \
     --arg updated_at "${ts}" \
     '.updated_at = $updated_at |
      .tickets[$tid] = {
        status: "in_progress",
        agent: $agent,
        branch: $branch,
        claimed_at: $claimed_at
      }' "${STATUS_FILE}" > "${tmp_file}"
  mv "${tmp_file}" "${STATUS_FILE}"
}

MAX_RETRIES=3
retry=0

while (( retry < MAX_RETRIES )); do
  claim_ticket "${selected_ticket}"

  # Commit
  git add "${STATUS_FILE}"
  if ! git diff --cached --quiet "${STATUS_FILE}"; then
    git commit -m "chore(coord): claim ${selected_ticket}

Ticket: ${selected_ticket}
Spec: no spec change
API: no API change
Tests: coordination state updated via scripts/claim-ticket.sh
Risk: low
Agent: ${agent_name}
Claimed-At: $(now_iso)"
  fi

  # Push (this is the atomic lock — if it fails, another agent won the race)
  if git push 2>/dev/null; then
    echo "${selected_ticket}"
    exit 0
  fi

  echo "Push failed (race condition). Pulling and retrying... (attempt $((retry + 1))/${MAX_RETRIES})" >&2
  git pull --rebase 2>/dev/null || true

  # Re-read status and re-select (someone else may have taken our ticket)
  original_ticket="${selected_ticket}"
  selected_ticket="$(find_next_ticket)" || {
    echo "No ticket available after pull." >&2
    exit 1
  }
  if [[ "${selected_ticket}" != "${original_ticket}" ]]; then
    echo "Re-selection picked a different ticket: ${selected_ticket} (was ${original_ticket})." >&2
    echo "Branch '${branch_name}' cannot be reused for a different ticket." >&2
    echo "Restart with: scripts/agent-flow.sh start --agent ${agent_name} --ticket ${selected_ticket} --slug <slug>" >&2
    exit 1
  fi
  echo "Re-selected ticket: ${selected_ticket}" >&2
  retry=$((retry + 1))
done

echo "Failed to claim after ${MAX_RETRIES} retries." >&2
exit 1
