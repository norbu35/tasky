# Agent Runbook

Canonical operational workflow for autonomous agents in this repository.

Authoritative policy remains in `AGENTS.md`. This runbook defines the single operational entrypoint.

## Single Entrypoint
Use `scripts/agent-flow.sh` for all day-to-day task execution.

```bash
# inspect queue
scripts/agent-flow.sh status

# start next available ticket on a new branch
scripts/agent-flow.sh start --agent <agent-name> --slug <short-slug>

# or start a specific ticket
scripts/agent-flow.sh start --agent <agent-name> --ticket TASK-020 --slug categories

# run required self-verification using ticket spec metadata defaults
scripts/agent-flow.sh verify --ticket TASK-020

# mark the ticket done after PASS artifact
scripts/agent-flow.sh complete --ticket TASK-020
```

## Command Contracts
1. `start` creates or switches to `agent/<TICKET-ID>-<slug>` before claiming.
2. `start` claims only when branch and ticket prefix match.
3. `verify` resolves `risk_level` and `req_ids` from `tickets/<TICKET-ID>.json` unless overridden.
4. `complete` validates the self-verify artifact and enforces branch ownership consistency.

## Direct Script Use
Use direct scripts only for debugging or CI internals:
1. `scripts/ticket-status.sh`
2. `scripts/claim-ticket.sh`
3. `scripts/self-verify.sh`
4. `scripts/complete-ticket.sh`

## Compatibility Docs
`CLAUDE.md` is compatibility-only and must not define independent workflow or policy.
