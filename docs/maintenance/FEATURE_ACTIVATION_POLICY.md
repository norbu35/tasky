# Feature Activation Policy

Last updated: 2026-04-10

## Scope

This document defines how Tasky may enable dormant or later-phase capabilities after the Phase 1 launch baseline.

It is intentionally stricter than ordinary feature-flag usage. A database toggle is an operational control, not proof
that the product surface is activation-ready.

## Activation Principles

1. The capability matrix is the entry gate. No feature may be activated unless its current classification and evidence
   are explicitly recorded in this document's eligibility ledger below.
2. `implemented-gated` is the only classification that may be considered for near-term activation.
3. `partial`, `contract-only`, and `deferred` surfaces are implementation work, not rollout candidates.
4. Product, engineering, verification, and rollback evidence must all exist before any toggle change in production.
5. Every activation must define:
   - why the feature is being enabled
   - who approved it
   - how it will be measured
   - how it will be rolled back

## Current Eligibility Ledger

| Surface                     | Current status                                   | Eligible for activation?         | Why                                                                                 |
| --------------------------- | ------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------- |
| `escrow_enabled`            | `implemented-gated`                              | `yes, after additional evidence` | Backend and client/runtime paths exist, but launch keeps the path off.              |
| `lead_fee_enabled`          | `partial`                                        | `no`                             | No confirmed runtime consumer in the current audit.                                 |
| `subscription_enabled`      | `deferred`                                       | `no`                             | API forward reference plus shell-only client surfaces.                              |
| `ai_scope_summary_enabled`  | `partial`                                        | `no`                             | Deterministic summary is live; AI rewrite still lacks a confirmed runtime consumer. |
| `promoted_listings_enabled` | `partial` with architecture-to-code discrepancy  | `no`                             | No matching backend or migration evidence found in the current sweep.               |
| `b2b_enabled`               | `deferred` with architecture-to-code discrepancy | `no`                             | No confirmed backend/runtime evidence.                                              |
| Referrals                   | `deferred`                                       | `no`                             | Forward reference only.                                                             |
| DAN verification            | `deferred`                                       | `no`                             | Forward reference and mobile shell only.                                            |
| Instant match               | `deferred`                                       | `no`                             | Forward reference only.                                                             |

## Required Evidence Bundle Before Any Activation

Every proposed activation must include the following bundle:

1. Product reason
   - KPI trigger or user problem
   - target cohort
   - success metric and failure threshold
2. Contract truth
   - canonical docs updated first
   - API contract matches the intended runtime posture
3. Backend proof
   - scenario-backed tests for the happy path and key unhappy paths
   - rollout toggle behavior tested both on and off
4. Client proof
   - web, mobile, and admin surfaces verified for the target capability
   - misleading shell-only states removed or clearly gated
5. Environment proof
   - capability rehearsed in staging with real secrets/providers
   - operator runbook updated
6. Observability proof
   - dashboard and alert thresholds defined before activation
7. Rollback proof
   - explicit off-switch path
   - operator steps for partial rollback or full rollback

## Approval Model

Tasky is currently a solo-founder system, but approvals still need explicit role separation in the record:

| Approval role        | Current practical owner | Responsibility                                             |
| -------------------- | ----------------------- | ---------------------------------------------------------- |
| Product approver     | Founder/operator        | Confirms the business reason and cohort scope.             |
| Engineering approver | Founder/operator        | Confirms implementation and test evidence.                 |
| Operations approver  | Founder/operator        | Confirms secrets, staging rehearsal, and rollback posture. |

The same person may fulfill all three roles today, but each approval must still be recorded separately in the rollout
note.

## Activation Sequence

1. Reclassify the capability in this document's eligibility ledger if new evidence exists.
2. Update the PRD appendix and any canonical docs affected by the activation.
3. Exercise the capability in staging with the feature off, then on.
4. Run the targeted smoke and regression suite for that capability.
5. Enable for the smallest reasonable cohort or operator-controlled path first.
6. Watch the defined metrics and alerts for the agreed observation window.
7. Either:
   - keep the capability enabled and record the result, or
   - turn it back off and record the rollback reason

## Escrow-Specific Policy

`escrow_enabled` is the only credible near-term activation candidate today. It still requires:

1. Real QPay secret configuration and callback verification in release-grade staging.
2. Wallet, payment, and payout smoke evidence across backend, web, mobile, and admin.
3. Operator runbook for payout review, failure handling, and reconciliation.
4. Launch KPI and incident thresholds specific to payment and payout failures.
5. A documented rollback path that returns the system to the direct-settlement Phase 1 posture.

Until those conditions are met, `escrow_enabled` remains off in all launch environments.

## Non-Eligible Surfaces

The following are explicitly not activation candidates today:

- `lead_fee_enabled`
- `subscription_enabled`
- `ai_scope_summary_enabled`
- `promoted_listings_enabled`
- `b2b_enabled`
- referrals
- DAN verification
- instant match

If any of these become more implemented later, update the capability matrix first. Do not use this document to
override the matrix.
