# TASK-001: Implement deferred mobile design refresh screens (Phase 2: verification, credits, wallet, B2B, boost)

**Status:** todo
**Priority:** medium

## Description

Second phase of the mobile design refresh. Implements 28 screens that were deferred from the
initial refresh (2026-04-02) to keep scope focused. Full screen list with Figma node IDs is in
`AGENTS.md §Deferred Mobile Screens`. Design spec: `docs/superpowers/specs/2026-04-02-mobile-design-refresh-design.md`.

Before starting: SCR-B2B-001–007, SCR-CUST-028–029, and SCR-TASK-019 need
`docs/design/screen-specs/` entries written first — see `docs/design/prompts/generation-tracker.md`.

Figma file key: `IljfnTQPkq7vpkmK1NN1NC`

## Done When
- SCR-TASK-003–010 (tasker verification & KYC) implemented and typechecks pass
- SCR-P2-001–005 (credits & payments) implemented and typechecks pass
- SCR-P3-001–005 (wallet, escrow, payout, Pro subscription, instant match) implemented and typechecks pass
- SCR-CUST-028–029 (task boost options & payment) spec written and implemented
- SCR-TASK-019 (AI Profile Polish) spec written and implemented
- SCR-B2B-001–007 (business accounts) specs written and implemented
- `pnpm --filter @tasky/mobile typecheck` passes with zero errors across all new screens
