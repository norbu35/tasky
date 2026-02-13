#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/context-for-ticket.sh --ticket <TICKET-ID>

Description:
  Gathers relevant context for a ticket, including its spec,
  related requirements from PRD.md, and architectural context.
USAGE
}

ticket_id=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket) ticket_id="${2:-}"; shift 2 ;;
    *) usage; exit 2 ;;
  esac
done

if [[ -z "${ticket_id}" ]]; then
  usage
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

ticket_spec="tickets/${ticket_id}.json"
if [[ ! -f "${ticket_spec}" ]]; then
  echo "Ticket spec not found: ${ticket_spec}" >&2
  exit 1
fi

echo "=== TICKET SPEC: ${ticket_id} ==="
cat "${ticket_spec}"
echo

echo "=== REQUIREMENTS FROM PRD.md ==="
req_ids=$(jq -r '.req_ids | join("|")' "${ticket_spec}")
if [[ -n "${req_ids}" ]]; then
  grep -E -A 5 "(${req_ids})" docs/PRD.md || echo "No matching requirements found in PRD.md"
else
  echo "No req_ids found in ticket spec."
fi
echo

echo "=== RELEVANT ARCHITECTURE SECTIONS ==="
# Heuristic: find domain-related sections in ARCHITECTURE.md
# We'll look for the first few req_ids prefixes (e.g., AUTH, MKT)
domains=$(jq -r '.req_ids[]' "${ticket_spec}" | cut -d'-' -f2 | sort -u)
for domain in ${domains}; do
  echo "--- Domain: ${domain} ---"
  grep -i -A 10 "## .*${domain}" docs/ARCHITECTURE.md || true
done
echo

echo "=== EXISTING TEST PATTERNS ==="
# Search for similar TIDs to show the agent how tests are named and structured
prefix=$(echo "${ticket_id}" | cut -d'-' -f1)
grep -r "TID-${prefix}" src/test/java apps/web/src apps/mobile/src --include="*.java" --include="*.tsx" --include="*.ts" | head -n 20 || echo "No existing tests found for prefix ${prefix}"
