# VPS Agent Handoff

## Purpose

This handoff is the current execution starting point for continuing the audit-remediation program from a VPS or other non-desktop environment.

Read this together with:

- `docs/plans/2026-03-27-audit-remediation-plan.md`

## Baseline

- Date: 2026-03-28
- Branch to start from: `main`
- Current `main` commit at handoff time: `262a37d`
- Expected local state after sync: clean worktree on `main`

## What Is Already On `main`

These commits are already present on `main` and should be treated as landed baseline:

- `f440e2a` `security(auth): harden dev auth and client IP controls`
- `d58719f` `security(storage): enforce owned object key namespaces`
- `d3a1dbd` `fix(booking): make lifecycle transitions atomic`
- `acc241b` `chore(plan): add audit remediation implementation plan`
- `262a37d` `refactor(audit): harden verification auditing and task photo legacy handling`

## What Was Explicitly Discarded

An unfinished local `TASK-041` attempt was discarded before this handoff. Do not try to recover it from local branches; rebuild the dispute workflow work from current `main`.

Discarded local-only work included:

- dispute evidence append endpoint draft
- booking complete/cancel open-dispute guards draft
- partial OpenAPI/runtime/test updates for that draft

No local `TASK-010`, `TASK-021`, or `TASK-041` worktrees/branches should be assumed to exist on the target machine.

## Overall Program Order

Follow the implementation order from `docs/plans/2026-03-27-audit-remediation-plan.md`:

1. Security containment
2. Storage and PII boundary hardening
3. Booking/dispute/payout transactional integrity
4. Contract parity restoration
5. Mobile/web parity fixes
6. Infra and release-gate hardening

## Recommended Next Slice

Start with the next unresolved dispute workflow slice from the plan:

- align dispute workflow with the contract
- decide and enforce one evidence workflow model
- add the required dispute/booking closure guards only if they still are not covered by current `main`
- keep the work vertically sliced and independently verifiable

Suggested ticket focus:

- `TASK-041` for dispute behavior and closure guards

## VPS Resume Commands

Use these commands first on the VPS:

```bash
cd /path/to/tasky
git fetch origin
git switch main
git pull --ff-only
git status --short --branch
git log --oneline --decorate -n 8
```

Then read the planning docs:

```bash
sed -n '1,260p' docs/plans/2026-03-28-vps-handoff.md
sed -n '1,320p' docs/plans/2026-03-27-audit-remediation-plan.md
sed -n '1,220p' tickets/TASK-041.json
```

If using the repo workflow scripts:

```bash
scripts/agent-flow.sh start --agent <name> --ticket TASK-041 --slug dispute-workflow --workspace isolated
```

If creating the branch manually:

```bash
git switch -c agent/TASK-041-dispute-workflow
```

## Baseline Verification Before New Work

Before changing code, rerun the relevant baseline tests from clean `main`:

```bash
./gradlew --no-daemon test \
  --tests mn.tasky.dispute.DisputeEvidenceIntegrationTests \
  --tests mn.tasky.dispute.DisputeIntegrationTests \
  --tests mn.tasky.booking.BookingIntegrationTests
```

Then implement only the chosen slice and rerun targeted verification plus the repo self-verify flow for the ticket.

## Important Notes

- Do not assume discarded local drafts were correct.
- Use current `main` as the source of truth.
- Keep OpenAPI, generated SDK, runtime code, tests, and docs in the same change.
- The desktop sandbox previously caused false self-verify failures around Gradle lock access in `~/.gradle`; on a VPS this should be run normally without that desktop sandbox constraint.
