# Feature Activation Policy

## Scope

This document governs whether any non-launch capability may be enabled after the Phase 1 baseline is already stable.
It does not define future product scope. That belongs in `docs/ROLLOUT_PHASES.md`.

## Core rule

A feature toggle is an operational switch, not proof that the feature belongs in the live product.

The product is intentionally allowed to contain future-ready dormant surfaces. Those surfaces should be easy to activate
when their rollout phase arrives, but they must remain disabled and non-promissory until the governing docs, contracts,
UX, verification, monitoring, and rollback posture are all updated.

## Activation principles

1. Phase 1 remains the active baseline until the PRD changes.
2. No toggle may be enabled in production if it would cause the runtime to outrun the active PRD, launch UX, or active contract.
3. Future-phase toggles stay off by default.
4. Any activation that changes user-visible behavior must be preceded by updated governing docs, updated derived docs, test evidence, monitoring, and rollback steps.

## Current posture

For the current baseline:

- launch-baseline behavior may remain enabled where required by the PRD
- non-launch capabilities must remain disabled
- future-phase toggles are not activation candidates merely because code exists

## Current toggle catalog

This catalog records the known DB-backed feature switches that may appear in admin tooling. The source of truth for
phase ownership is `docs/ROLLOUT_PHASES.md`; this table records activation posture.

Fresh databases start without Flyway-seeded toggle rows. Absence must resolve to the required default below until an
operator/admin setup step creates an audited row.

| Toggle                     | Feature family                    | Target phase     | Required default before activation                       |
| -------------------------- | --------------------------------- | ---------------- | -------------------------------------------------------- |
| `lead_fee_enabled`         | Lead credits / paid lead unlock   | Phase 2 optional | `false`                                                  |
| `subscription_enabled`     | Tasker subscription               | Phase 3          | `false`                                                  |
| `escrow_enabled`           | Escrow, payments, wallet, payouts | Phase 3          | `false`                                                  |
| `ai_scope_summary_enabled` | Runtime AI scope summary          | Phase 2 optional | `false`                                                  |
| `data_retention_dry_run`   | Data-retention safety dry run     | Phase 1 ops      | `true` until destructive deletion is explicitly approved |

If future code needs a switch but none exists, add the switch as disabled-by-default scaffolding and document its phase
owner before exposing it in admin UX.

## Required evidence before any later activation

Every proposed activation must include:

1. product reason and target KPI
2. PRD and maintenance-policy update
3. contract and UX alignment
4. backend and client verification with the toggle both off and on
5. staging rehearsal and operator runbook update
6. alerting and dashboard coverage
7. rollback procedure

For user-visible deferred features, verification must cover both states:

- toggle off: launch behavior remains unchanged and no deferred copy, route, or promise is exposed
- toggle on: the intended future-phase behavior works against updated contracts and launch-facing copy

## Rollout note requirement

Every activation must leave behind a short recorded note containing:

- feature name
- phase justification
- approver
- environment(s)
- evidence links
- start time
- stop or rollback criteria

## What this document does not do

This document does not keep a speculative ledger of deferred features.
That belongs in `docs/ROLLOUT_PHASES.md` until a later phase is actually being prepared.
