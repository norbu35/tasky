# Agent Runbook

Canonical operational workflow for autonomous agents in this repository.

Authoritative policy remains in `AGENTS.md`. This runbook defines the single operational entrypoint.

## Single Entrypoint
Use `scripts/agent-flow.sh` for all day-to-day task execution.

```bash
# inspect queue
scripts/agent-flow.sh status

# start a specific ticket (defaults to isolated workspace)
scripts/agent-flow.sh start --agent <agent-name> --ticket TASK-020 --slug <short-slug>

# optional: auto-claim next available when no --ticket is provided
scripts/agent-flow.sh start --agent <agent-name> --slug <short-slug> --auto-claim

# run required self-verification using ticket spec metadata defaults
scripts/agent-flow.sh verify --ticket TASK-020

# mark the ticket done after PASS artifact
scripts/agent-flow.sh complete --ticket TASK-020

# merge the completed ticket branch into main (final step)
scripts/agent-flow.sh merge --ticket TASK-020
```

## Command Contracts
1. `start` is resume-first:
   - If the same agent already owns one `in_progress` ticket, it resumes that ticket.
   - If none, `--ticket` is required to claim new work (or use `--auto-claim` to opt into next-available auto-pick).
2. `start` fails if the agent owns multiple `in_progress` tickets and `--ticket` is not provided.
3. `start --ticket <ID>` fails when `<ID>` is already `in_progress` for a different agent.
4. `start` creates/switches `agent/<TICKET-ID>-<slug>` before claim when claiming new work.
5. `start` defaults to `--workspace isolated` and creates/uses a git worktree at `.worktrees/<agent>/<TICKET-ID>` to allow concurrent local agents without branch collisions.
6. Claiming remains atomic through `tickets/STATUS.json` commit + push.
7. `status`/`start`/`claim-ticket`/`complete-ticket` treat in-progress claims found on `agent/*` branches as authoritative, preventing duplicate starts when local `main` is stale.
8. `verify` resolves `risk_level` and `req_ids` from `tickets/<TICKET-ID>.json` unless overridden.
9. `complete` validates the self-verify artifact and enforces branch ownership consistency.
10. `merge` requires ticket status `done` on the source branch, then fast-forwards `main` from the main worktree and pushes.
11. `merge` cleans local source worktree and local source branch by default after a successful merge (`--no-cleanup` opt-out).

## Parallel Agent Workspace Model
1. One agent process maps to one isolated worktree.
2. The primary repository root is used for orchestration, status visibility, and shared scripts.
3. Runtime coding, tests, and commits happen inside each agent's worktree path.
4. Worktree naming is deterministic by agent and ticket, so agents can resume interrupted work safely.

Example:
```bash
# Agent A
scripts/agent-flow.sh start --agent codex-a --ticket TASK-011 --slug profile --workspace isolated

# Agent B
scripts/agent-flow.sh start --agent codex-b --ticket TASK-020 --slug categories --workspace isolated

# each agent then works in its own worktree printed by the start command
```

## Task Pickup Rules
1. Source of truth is `tickets/STATUS.json` plus `tickets/<TASK>.json` dependency metadata.
2. A task is `available` only when status is `pending` and all `depends_on` tickets are `done`.
3. `start` automatically resumes the caller agent's existing `in_progress` ticket before claiming new work.
4. If no resume candidate exists, agents should claim by explicit `--ticket <ID>`.
5. If a race occurs, claim retries after pull/rebase and re-selection.
6. `--auto-claim` is available for deterministic lowest-numbered auto-pick when explicit selection is not needed.

## Shared Workspace Fallback
Use shared mode only when a single local agent is active:
```bash
scripts/agent-flow.sh start --agent <agent-name> --ticket TASK-020 --slug categories --workspace shared
```

Shared mode is not safe for simultaneous local agents because branch checkout state is global in one working tree.

## Direct Script Use
Use direct scripts only for debugging or CI internals:
1. `scripts/ticket-status.sh`
2. `scripts/claim-ticket.sh`
3. `scripts/self-verify.sh`
4. `scripts/complete-ticket.sh`

## Compatibility Docs
`CLAUDE.md` is compatibility-only and must not define independent workflow or policy.
