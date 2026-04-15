# Tasky Business Strategy & Go-To-Market

## 1. Overview

Tasky is a launch-first marketplace. The current business commitment is the Phase 1 controlled pilot described in `docs/LAUNCH_ROADMAP.md`. The strategy is to prove trust, liquidity, and operational reliability before expanding into paid rails or adjacent product lines.

Later phases are not automatic next steps. They are conditional paths that require verified implementation status, test coverage, and an explicit rollout decision. The launch team should treat docs, UI shells, and seeded toggles as research signals, not as proof that a later phase is ready.

## 2. Current Strategy: Phase 1 Controlled Pilot

### 2.1 Objective

Build enough trust and liquidity for the marketplace to work without monetization.

### 2.2 What The Pilot Optimizes For

1. Verified supply density in a small launch district.
2. Fast task posting and booking completion.
3. Founder-assisted exception handling for unmatched or risky cases.
4. Stable customer and tasker habits around in-app communication.

### 2.3 Launch Tactics

- Start with a small number of categories where the launch baseline is already live.
- Focus supply acquisition on verified taskers who can accept jobs quickly.
- Use Facebook channels and local community distribution where the audience already is.
- Keep the founder visible in ops so unresolved tasks do not become product failures.
- Use push notifications and in-app messaging to keep contact inside the platform.

### 2.4 What The Pilot Does Not Optimize For

- No launch dependency on monetization conversion.
- No assumption that lead fees, subscriptions, escrow, referrals, B2B, or instant match are ready just because they are mentioned elsewhere.
- No strategy that requires toggling latent product lines on without implementation work.

## 3. Conditional Future Paths

The table below separates strategic intent from current verified status.

| Future path | Current verified status | Strategy implication |
|---|---|---|
| Phase 2 lead unlock, OTP migration, referrals, DAN fast-path | OTP, referrals, and DAN are deferred; lead fee is partial with no confirmed runtime consumer. | Treat as a build-and-verify program, not a switch to flip. |
| Phase 3 escrow, wallet, payout processing | Escrow is implemented-gated and must stay off for launch; wallet/payout remain gated behind the launch decision. | Only consider after the launch pilot is stable and the payment path is fully verified. |
| Subscription products | Deferred in the matrix and API. | Do not plan revenue forecasts around it yet. |
| B2B Lite and later B2B Managed | Deferred in the matrix and API, with no confirmed runtime evidence. | Keep as a future expansion thesis only. |
| Promoted listings | Partial, with architecture-to-code discrepancy and no matching backend evidence. | Not activation-ready. |
| AI scope summary rewrite | Deterministic summaries are launch-live; AI polish has no confirmed runtime consumer. | Keep as optional research, not a launch dependency. |

## 4. Operating Principles

1. Launch behavior is the only committed product posture today.
2. A later-phase mention in docs is not a release commitment.
3. A feature toggle is an operational control, not evidence of product readiness.
4. If runtime evidence, API contract, and tests do not all line up, the path stays conditional.
5. Preserve founder control in the pilot until the product shows durable liquidity.

## 5. Go-To-Market Sequence

### 5.1 Phase 1

1. Launch in a constrained district and a constrained category set.
2. Seed the supply side first, then expand customer acquisition into the same local network.
3. Keep the booking flow simple: post, apply, confirm, complete, review.
4. Measure trust outcomes before monetization outcomes.

### 5.2 Phase 2 Candidate Work

Only start the Phase 2 build when the launch pilot is stable enough to justify the work. The candidate work should be prioritized by verified implementation status:

- Implement OTP migration only when the auth path is ready and tested.
- Implement lead unlock only when address/contact reveal enforcement is verified.
- Implement referrals only when attribution and fraud controls are verified.
- Implement DAN only when the backend and fallback flow are verified.

### 5.3 Phase 3+ Candidate Work

Escrow, wallet, payout, and subscription should be treated as separate implementation programs, not as a single "monetization toggle" step. Escrow is currently the only implemented-gated monetization path, but it remains off until the product team explicitly decides to move the pilot forward.

## 6. AI-Assisted Solo Ops

AI is an execution multiplier for the founder, not a product phase:

1. Verification Copilot: triage the queue by SLA risk and fraud signals.
2. Dispute Copilot: summarize evidence and draft resolution options.
3. Supply Activation Copilot: identify district/category gaps and outreach timing.
4. Retention Copilot: prepare rebook and reactivation messages.
5. Founder Weekly Brief: generate blockers, risks, and next actions.
