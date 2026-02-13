#!/usr/bin/env bash
set -euo pipefail

##############################################################################
# ticket-status.sh — Display current ticket coordination status.
#
# Usage:
#   scripts/ticket-status.sh [--format table|json] [--filter pending|in_progress|done|available]
#
# "available" means: status=pending AND all depends_on are done.
#
# This is the FIRST command a new agent should run to understand what to do.
##############################################################################

usage() {
  cat <<'USAGE'
Usage:
  scripts/ticket-status.sh [--format table|json] [--filter pending|in_progress|done|available|all]

Options:
  --format  Output format: "table" (default) or "json"
  --filter  Filter tickets by status. "available" = pending with all deps done.
            Default: "all" (shows summary + available tickets)

This is the FIRST command a new agent should run before starting work.
USAGE
}

format="table"
filter="all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format) format="${2:-}"; shift 2 ;;
    --filter) filter="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 2
  fi
}
require_cmd jq
require_cmd python3

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

STATUS_FILE="tickets/STATUS.json"
TICKETS_DIR="tickets"

if [[ ! -f "${STATUS_FILE}" ]]; then
  echo "Status file not found: ${STATUS_FILE}" >&2
  exit 1
fi

# ── Full analysis via Python ─────────────────────────────────────────────────

python3 - "${STATUS_FILE}" "${TICKETS_DIR}" "${format}" "${filter}" <<'PYTHON'
import json
import re
import sys
from pathlib import Path

status_path = Path(sys.argv[1])
tickets_dir = Path(sys.argv[2])
output_format = sys.argv[3]
output_filter = sys.argv[4]

status_data = json.loads(status_path.read_text())
tickets = status_data.get("tickets", {})
updated_at = status_data.get("updated_at", "unknown")

# Build dependency map
deps_map = {}
risk_map = {}
for ticket_id in tickets:
    spec_path = tickets_dir / f"{ticket_id}.json"
    if spec_path.is_file():
        spec = json.loads(spec_path.read_text())
        deps_map[ticket_id] = spec.get("depends_on", [])
        risk_map[ticket_id] = spec.get("risk_level", "?")
    else:
        deps_map[ticket_id] = []
        risk_map[ticket_id] = "?"

done_tickets = {tid for tid, info in tickets.items()
                if isinstance(info, dict) and info.get("status") == "done"}

def is_available(tid):
    info = tickets.get(tid, {})
    if not isinstance(info, dict) or info.get("status") != "pending":
        return False
    return all(d in done_tickets for d in deps_map.get(tid, []))

def blocked_by(tid):
    return [d for d in deps_map.get(tid, []) if d not in done_tickets]

def sort_key(tid):
    m = re.search(r'(\d+)$', tid)
    return int(m.group(1)) if m else 0

all_sorted = sorted(tickets.keys(), key=sort_key)

# Categorize
done_list = [t for t in all_sorted if isinstance(tickets[t], dict) and tickets[t].get("status") == "done"]
in_progress_list = [t for t in all_sorted if isinstance(tickets[t], dict) and tickets[t].get("status") == "in_progress"]
available_list = [t for t in all_sorted if is_available(t)]
pending_blocked_list = [t for t in all_sorted
                        if isinstance(tickets[t], dict)
                        and tickets[t].get("status") == "pending"
                        and not is_available(t)]

if output_format == "json":
    result = {
        "updated_at": updated_at,
        "summary": {
            "total": len(tickets),
            "done": len(done_list),
            "in_progress": len(in_progress_list),
            "available": len(available_list),
            "pending_blocked": len(pending_blocked_list),
        },
        "done": done_list,
        "in_progress": [{
            "ticket": t,
            "agent": tickets[t].get("agent", "?"),
            "branch": tickets[t].get("branch", "?"),
            "claimed_at": tickets[t].get("claimed_at", "?"),
        } for t in in_progress_list],
        "available": [{
            "ticket": t,
            "risk": risk_map.get(t, "?"),
            "depends_on": deps_map.get(t, []),
        } for t in available_list],
        "pending_blocked": [{
            "ticket": t,
            "blocked_by": blocked_by(t),
        } for t in pending_blocked_list],
    }

    if output_filter == "done":
        print(json.dumps(done_list, indent=2))
    elif output_filter == "in_progress":
        print(json.dumps(result["in_progress"], indent=2))
    elif output_filter == "available":
        print(json.dumps(result["available"], indent=2))
    elif output_filter == "pending":
        print(json.dumps(result["pending_blocked"], indent=2))
    else:
        print(json.dumps(result, indent=2))
    sys.exit(0)

# ── Table format ─────────────────────────────────────────────────────────────

def print_section(title, items):
    if not items:
        print(f"\n{title}: (none)")
        return
    print(f"\n{title}:")
    for item in items:
        print(f"  {item}")

print("=" * 70)
print(f"  TASKY TICKET STATUS  (updated: {updated_at})")
print("=" * 70)
print(f"  Total: {len(tickets)}  |  Done: {len(done_list)}  |  In Progress: {len(in_progress_list)}  |  Available: {len(available_list)}  |  Blocked: {len(pending_blocked_list)}")
print("=" * 70)

if output_filter in ("all", "in_progress"):
    if in_progress_list:
        print("\nIN PROGRESS:")
        print(f"  {'Ticket':<12} {'Agent':<16} {'Branch':<45} {'Since'}")
        print(f"  {'-'*11}  {'-'*15}  {'-'*44}  {'-'*20}")
        for t in in_progress_list:
            info = tickets[t]
            print(f"  {t:<12} {info.get('agent','?'):<16} {info.get('branch','?'):<45} {info.get('claimed_at','?')}")

if output_filter in ("all", "available"):
    if available_list:
        print("\nAVAILABLE (ready to claim):")
        print(f"  {'Ticket':<12} {'Risk':<8} {'Dependencies (all done)'}")
        print(f"  {'-'*11}  {'-'*7}  {'-'*30}")
        for t in available_list:
            deps = deps_map.get(t, [])
            deps_str = ", ".join(deps) if deps else "(none)"
            print(f"  {t:<12} {risk_map.get(t,'?'):<8} {deps_str}")
    else:
        print("\nAVAILABLE: (none — all pending tickets are blocked)")

if output_filter in ("all", "pending"):
    if pending_blocked_list:
        print("\nBLOCKED (waiting on dependencies):")
        print(f"  {'Ticket':<12} {'Blocked By'}")
        print(f"  {'-'*11}  {'-'*40}")
        for t in pending_blocked_list:
            bb = blocked_by(t)
            print(f"  {t:<12} {', '.join(bb)}")

if output_filter in ("all", "done"):
    if done_list:
        print(f"\nDONE ({len(done_list)}):")
        done_per_line = 8
        for i in range(0, len(done_list), done_per_line):
            chunk = done_list[i:i+done_per_line]
            print(f"  {', '.join(chunk)}")

print()

if output_filter == "all" and available_list:
    next_ticket = available_list[0]
    print(f"NEXT RECOMMENDED: {next_ticket} (risk: {risk_map.get(next_ticket, '?')})")
    print(f"  Start with: scripts/agent-flow.sh start --agent <your-name> --ticket {next_ticket} --slug <slug>")
    print()
PYTHON
