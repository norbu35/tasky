# Phase 1 Launch Baseline

This document ratifies the minimal Phase 1 launch commitment from the capability matrix. It is the rollout decision record for PM and engineering: ship only the launch-live surface area, keep monetization and later-phase feature gates off, and treat any shell-only or forward-reference surfaces as non-launch.

## Launch Baseline Statement

Phase 1 launches as a controlled pilot with zero monetization and founder concierge backstop, matching the roadmap’s launch minimum (`docs/LAUNCH_ROADMAP.md`). The launch bar is the smallest set of capabilities that are already live end-to-end in the matrix: auth/onboarding, task posting with deterministic scope summary, applications and booking, messaging/notifications, reviews/disputes, and admin operations.

The baseline is not “everything present in the app.” It excludes any capability that is deferred in the API, only partially wired in runtime, or present only as shell/UI. If a feature needs a rollout toggle, its default posture for launch is off unless the matrix explicitly classifies the full path as `launch-live`.

## In-Scope Capabilities

### Customer and tasker flow

- Facebook OAuth sign-in and account bootstrap.
- Structured task intake, draft binding, and deterministic scope summary generation with key-value fallback.
- Task applications, selection, booking confirmation, scheduling, reschedule handling, and no-show handling.
- In-app messaging and push notifications for task and booking events.
- Post-completion reviews, disputes, and trust/safety enforcement.

### Operator support

- Verification queue review and moderation actions.
- Category management with intake schema versioning.
- Feature toggle management.
- User ban/unban.
- Dispute resolution.

### Supporting infrastructure required by the baseline

- DB-backed, runtime-switchable, audit-logged feature toggles.
- Idempotency on critical state-changing endpoints.
- Transactional outbox for async side effects.
- Structured logging with correlation IDs.
- Cursor pagination.
- AES-256-GCM phone encryption with blind indexing.
- Facebook OAuth outage posture.
- Firebase Cloud Messaging push provider with topic subscription.

## Explicit Out-of-Scope / Deferred Capabilities

These are not part of the launch baseline, even if docs or UI mention them:

- Phone OTP auth and OTP migration flows.
- Credits, lead unlock purchase flow, and lead pricing activation.
- Escrow, wallet, payout processing, and other settlement rails beyond direct settlement.
- Referrals.
- Tasker subscription billing.
- Business accounts, business locations, business members, and B2B task tagging.
- DAN verification fast-path.
- Instant match.

The roadmap also states that Phase 1 ships with zero monetization and that all monetization is seeded but disabled at first launch. The API spec reinforces that wallet/payment/payout are gated, while credits, referrals, subscription, instant-match, and DAN verification are forward references that return `404` until implemented (`docs/API.yaml`).

## Default Launch Toggle Posture

Keep these toggles off for initial rollout:

| Toggle | Why it stays off at launch |
|---|---|
| `escrow_enabled` | The matrix classifies escrow/wallet/payout as `implemented-gated`, not launch-live. The API says wallet/payment/payout return `503` when this toggle is disabled, so it must remain off for the zero-monetization pilot. |
| `lead_fee_enabled` | The architecture describes it as seeded readiness only, and the matrix records no confirmed runtime consumer in this sweep. Launch should not depend on it. |
| `subscription_enabled` | The API marks subscription as deferred/forward-reference and the matrix shows only shell surfaces. Keep it off. |
| `ai_scope_summary_enabled` | The matrix says deterministic summary is launch-live, but AI polish is a separate dormant capability with no runtime consumer. Keep it off. |
| `promoted_listings_enabled` | The architecture claims runtime gating, but the matrix records an architecture-to-code discrepancy and no matching backend or migration evidence. Keep it off. |
| `b2b_enabled` | The API is still forward-reference only and the matrix reports no backend/runtime implementation. Keep it off. |

Practical rule: no monetization toggle is enabled as part of the Phase 1 launch decision.

## Post-Launch Activation Candidates

These are dormant features that can be considered after launch, but only when their runtime path is ready:

| Candidate | Why it is a real candidate |
|---|---|
| `escrow_enabled` | This is the strongest activation candidate. The backend path already exists and is explicitly gated in `WalletController`, `PaymentController`, and `AdminPayoutController`. Once the product is ready to introduce escrow settlement, this toggle is the intended rollout lever. |

## Future Implementation / Not-Activation-Ready

These toggles remain future work because the matrix does not show a confirmed runtime consumer yet:

- `lead_fee_enabled`: Phase 2 concept is seeded, but there is no confirmed runtime consumer in the matrix. Do not treat this as an activation candidate until the address-reveal enforcement path exists and is verified.
- `ai_scope_summary_enabled`: deterministic summaries are launch-live, but AI polish has no confirmed runtime consumer. Keep this as future work, not as a current activation candidate.

## Not-Activation-Ready Surfaces

These surfaces exist in docs, API, or UI shell form, but they are not ready to be activated yet:

- `lead_fee_enabled`: the matrix found no confirmed runtime consumer in this sweep.
- `subscription_enabled`: API forward-reference plus shell-only client surfaces.
- `promoted_listings_enabled`: documented as gated in architecture, but the matrix records no code or migration evidence and flags an architecture-to-code discrepancy.
- `b2b_enabled`: API forward-reference and no backend/runtime implementation; the matrix also flags a discrepancy against architecture claims.
- Referrals: API forward-reference, no runtime consumer, shell-only mobile screen.
- DAN verification: API forward-reference, shell-only mobile screen, no backend.

These are not “turn it on later” features yet. They need implementation work, test coverage, and contract confirmation before any rollout discussion.

## Open Discrepancies That Block Later Activation

Resolve these before any later-phase activation decision:

1. `promoted_listings_enabled` vs code evidence: `docs/ARCHITECTURE.md` says it is gated in runtime code, but the matrix found no matching backend or migration evidence.
2. `b2b_enabled` vs code evidence: `docs/ARCHITECTURE.md` says it gates business-account CRUD and B2B tagging, but the matrix found no matching backend or migration evidence.
3. `lead_fee_enabled` readiness: the architecture describes the reveal gate, but the matrix found no confirmed runtime consumer in this sweep.
4. `subscription_enabled` readiness: the API and matrix both show the path is still deferred/shell-only.
5. `ai_scope_summary_enabled` readiness: the launch path is deterministic-summary only; AI polish has no confirmed consumer yet.

## Rollout Decision

Approve Phase 1 only when the launch-live set above is green and every toggle in the default posture table remains off. Any later-phase activation request should be blocked until it matches one of the real activation candidates and clears the discrepancy list.
