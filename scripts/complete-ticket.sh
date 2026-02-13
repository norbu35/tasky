#!/usr/bin/env bash
set -euo pipefail

##############################################################################
# complete-ticket.sh — Mark a ticket as done in STATUS.json.
#
# Usage:
#   scripts/complete-ticket.sh --ticket <TICKET-ID> [--agent <agent-name>] [--artifact <path>]
#
# Behavior:
#   1. Validates the ticket is currently "in_progress".
#   2. Validates claimed branch ownership and optional self-verify artifact.
#   3. Sets status to "done" with completion timestamp.
#   4. Commits and pushes STATUS.json.
#
# Exit codes:
#   0: ticket marked done
#   1: ticket not in expected state / push failed
#   2: invalid usage
##############################################################################

usage() {
  cat <<'USAGE'
Usage:
  scripts/complete-ticket.sh --ticket <TICKET-ID> [--agent <agent-name>] [--artifact <path>]

Options:
  --ticket  Required. The ticket ID to mark as done.
  --agent   Optional. Agent name (for audit). Defaults to current claim owner.
  --artifact Optional. Self-verify artifact path to validate before completion.

Exit codes:
  0: ticket marked done
  1: ticket not in expected state or push failed
  2: invalid usage
USAGE
}

ticket=""
agent_name=""
artifact_path=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket) ticket="${2:-}"; shift 2 ;;
    --agent)  agent_name="${2:-}"; shift 2 ;;
    --artifact) artifact_path="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${ticket}" ]]; then
  echo "Missing required --ticket argument." >&2
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
require_cmd git

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

STATUS_FILE="tickets/STATUS.json"

if [[ ! -f "${STATUS_FILE}" ]]; then
  echo "Status file not found: ${STATUS_FILE}" >&2
  exit 1
fi

current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
if [[ -z "${current_branch}" ]]; then
  echo "Detached HEAD is not allowed for completion. Use an agent branch." >&2
  exit 1
fi
if [[ "${current_branch}" == "main" || "${current_branch}" == "master" ]]; then
  echo "Completing on '${current_branch}' is forbidden. Use the claimed agent branch." >&2
  exit 1
fi

# ── Validate current state ──────────────────────────────────────────────────

current_status="$(jq -r --arg tid "${ticket}" '.tickets[$tid].status // "missing"' "${STATUS_FILE}")"

if [[ "${current_status}" == "missing" ]]; then
  echo "Ticket ${ticket} not found in ${STATUS_FILE}." >&2
  exit 1
fi

if [[ "${current_status}" == "done" ]]; then
  echo "Ticket ${ticket} is already done." >&2
  exit 0
fi

if [[ "${current_status}" != "in_progress" ]]; then
  echo "Ticket ${ticket} has status '${current_status}', expected 'in_progress'." >&2
  exit 1
fi

claimed_branch="$(jq -r --arg tid "${ticket}" '.tickets[$tid].branch // "unknown"' "${STATUS_FILE}")"
if [[ "${claimed_branch}" != "${current_branch}" ]]; then
  echo "Branch mismatch. Ticket ${ticket} is claimed on '${claimed_branch}', current branch is '${current_branch}'." >&2
  exit 1
fi

if [[ -n "${artifact_path}" ]]; then
  if [[ ! -f "${artifact_path}" ]]; then
    echo "Artifact not found: ${artifact_path}" >&2
    exit 1
  fi
  artifact_ticket="$(jq -r '.ticket // empty' "${artifact_path}")"
  artifact_status="$(jq -r '.overall_status // empty' "${artifact_path}")"
  if [[ "${artifact_ticket}" != "${ticket}" ]]; then
    echo "Artifact ticket mismatch: expected ${ticket}, got ${artifact_ticket}" >&2
    exit 1
  fi
  if [[ "${artifact_status}" != "PASS" ]]; then
    echo "Artifact overall_status must be PASS before completion." >&2
    exit 1
  fi
fi

# ── Resolve agent name from current claim if not provided ────────────────────

if [[ -z "${agent_name}" ]]; then
  agent_name="$(jq -r --arg tid "${ticket}" '.tickets[$tid].agent // "unknown"' "${STATUS_FILE}")"
fi

# ── Mark as done ─────────────────────────────────────────────────────────────

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

ts="$(now_iso)"
tmp_file="$(mktemp)"

jq --arg tid "${ticket}" \
   --arg completed_at "${ts}" \
   --arg updated_at "${ts}" \
   '.updated_at = $updated_at |
    .tickets[$tid].status = "done" |
    .tickets[$tid].completed_at = $completed_at' \
   "${STATUS_FILE}" > "${tmp_file}"
mv "${tmp_file}" "${STATUS_FILE}"

# ── Commit and push ──────────────────────────────────────────────────────────

git add "${STATUS_FILE}"
if ! git diff --cached --quiet "${STATUS_FILE}"; then
  git commit -m "chore(coord): complete ${ticket}

Ticket: ${ticket}
Spec: no spec change
API: no API change
Tests: coordination state updated via scripts/complete-ticket.sh
Risk: low
Agent: ${agent_name}
Completed-At: ${ts}"
fi

MAX_RETRIES=3
retry=0
while (( retry < MAX_RETRIES )); do
  if git push 2>/dev/null; then
    echo "Ticket ${ticket} marked as done."
    exit 0
  fi
  echo "Push failed. Pulling and retrying... (attempt $((retry + 1))/${MAX_RETRIES})" >&2
  git pull --rebase 2>/dev/null || true
  retry=$((retry + 1))
done

echo "WARNING: Commit succeeded locally but push failed after ${MAX_RETRIES} retries." >&2
echo "STATUS.json is updated locally. Push manually when possible." >&2
exit 1
