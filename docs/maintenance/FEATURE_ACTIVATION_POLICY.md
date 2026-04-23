# Feature Activation Policy

## Scope

This document governs whether any non-launch capability may be enabled after the Phase 1 baseline is already stable.
It does not define future product scope. That belongs in `docs/ROLLOUT_PHASES.md`.

## Core rule

A feature toggle is an operational switch, not proof that the feature belongs in the live product.

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

## Required evidence before any later activation

Every proposed activation must include:

1. product reason and target KPI
2. PRD and maintenance-policy update
3. contract and UX alignment
4. backend and client verification with the toggle both off and on
5. staging rehearsal and operator runbook update
6. alerting and dashboard coverage
7. rollback procedure

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
