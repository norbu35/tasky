# ADR 0001: Liquidity-First MVP and Monetization Deferral

## Status
accepted

## Date
2026-02-17

## Context
Tasky is in early marketplace formation where the dominant risk is low liquidity (insufficient successful matches) and low trust (uncertain outcome quality). Requiring in-app payment (QPay), wallet settlement, and payout operations in this phase increases implementation complexity, onboarding friction, and operational/security burden before core demand-supply fit is proven.

The PRD baseline previously treated payment and payouts as MVP-critical. This created coupling between core booking flows and monetization infrastructure, slowing delivery of trust and matching fundamentals.

## Decision
For phase-1 MVP, Tasky will run as a free, non-monetized platform:
1. In-app payment initiation, internal wallet, payout processing, and platform fee deduction are deferred to post-MVP.
2. Booking finalization occurs on customer acceptance plus liability disclaimer confirmation (no payment gate).
3. Payment settlement is direct between customer and tasker outside the platform during phase-1.
4. REQ-PAY-01..06 remain documented as post-MVP requirements for planned monetization rollout.

## Consequences
Positive:
1. Lower booking friction and faster liquidity growth.
2. Reduced security/operational blast radius in MVP.
3. Faster delivery focus on trust primitives: identity, disputes, messaging, reviews, moderation.

Negative:
1. No direct platform revenue in phase-1.
2. Reduced enforcement capability for monetary cancellation and payout guarantees.
3. Increased need for explicit dispute evidence capture and clear user expectations.

Follow-on actions:
1. Rebaseline backlog and traceability to phase-1 scope.
2. Mark payment/wallet API surfaces as post-MVP/deferred.
3. Keep monetization modules isolated so post-MVP activation is incremental.

## Alternatives Considered
1. Keep full QPay/wallet in MVP.
   Rejected due to high complexity and early-stage adoption friction.
2. Build a minimal payment stub in MVP.
   Rejected because it still introduces trust risk and policy complexity without production monetization value.
3. Enable monetization only for selected categories.
   Rejected as premature segmentation before marketplace baseline metrics stabilize.
