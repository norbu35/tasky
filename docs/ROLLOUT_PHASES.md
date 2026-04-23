# Tasky Rollout Phases

This document records the intended phase sequence beyond the Phase 1 launch baseline. It is a planning document. `docs/PRD.md` remains the governing product document for the active launch scope.

## 1. Guardrails

- Phase 1 remains the only active launch baseline until the PRD explicitly changes.
- A feature toggle, hidden endpoint, or draft screen does not by itself move the product into a later phase.
- Later phases are entered only when the evidence bundle, rollout note, and updated source-of-truth docs exist together.
- Future-phase work may stay in code behind toggles, but public copy, launch UX, and active contracts must still describe the current phase truthfully.

## 2. Phase map

| Phase                                                 | Purpose                                                                                              | Core product shape                                                                                                                                                                                                        | Explicit non-goals for that phase                                                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1 — Launch baseline**                         | Prove citywide Ulaanbaatar demand and supply can complete real jobs through a mostly self-serve flow | Citywide Ulaanbaatar posting, four launch categories, structured intake, budget-or-quote pricing, open application, direct settlement, identity verification, reviews, disputes, moderation, measured operator assistance | OTP-primary auth, DAN, lead fees, promoted listings, subscriptions, escrow, wallet, payouts, referrals, B2B, instant match, runtime AI posting |
| **Phase 2 — Liquidity systems and soft monetization** | Reduce matching friction and test light monetization without changing the settlement model           | Algorithm-assisted application, OTP migration, DAN fast-path, lead credits if justified, promoted listings if justified, direct settlement still standard                                                                 | Escrow, wallet, payouts, subscriptions, instant match by default, geographic expansion                                                         |
| **Phase 3 — Trust rails and supply monetization**     | Add payment-adjacent trust rails and supply-side monetization once Phase 2 evidence exists           | Tasker subscription, opt-in escrow, wallet and payout operations, stricter anti-leakage enforcement, instant match only after liquidity proof                                                                             | Geographic expansion, managed B2B as a default product line, broad consumer subscription expansion                                             |
| **Phase 4 — Expansion**                               | Broaden revenue mix and geographic reach once the core marketplace is stable                         | Additional payment rails, customer subscription products, geographic expansion, managed B2B only if earlier validation exists                                                                                             | None by default, but every new surface still needs explicit approval                                                                           |

## 3. Phase 1 baseline in plain terms

Phase 1 is the current product. It means:

- live posting across all of Ulaanbaatar
- launch categories limited to home cleaning, furniture assembly, moving help / lifting help, and minor handyman
- structured category templates rather than free-form posting as the primary path
- customer pricing choice between `I have a budget` and `I want quotes`
- open application with customer selection rather than algorithmic assignment
- direct settlement between customer and tasker
- no launch promise of payment hold, payment protection, or escrow
- verification, moderation, disputes, and bilateral reviews as the launch trust package

## 4. Phase 2 shape

Phase 2 is meant to improve liquidity without pretending the platform is already a payment processor. The intended order is:

1. algorithm-assisted application and better ranking
2. OTP migration and optional DAN fast-path
3. light monetization only where the product is already generating confirmed intent

Direct settlement remains the standard path in Phase 2. Lead credits and promoted listings are optional rollouts inside the phase, not mandatory day-one commitments.

## 5. Phase 3 shape

Phase 3 is where payment-adjacent trust rails become credible candidates. That is the first phase where the product may introduce:

- tasker subscription
- opt-in escrow
- wallet and payout operations
- stronger anti-leakage enforcement tied to paid platform value

Instant match belongs here only after the marketplace has enough verified liquidity to support it safely.

## 6. Conditional tracks

Some ideas are worth preserving as future options but should not drive the main rollout sequence:

### 6.1 Referrals

Referrals may be introduced in Phase 2 or later, but they are not required for the core Phase 2 transition. They should follow, not lead, proof of working supply and repeat demand.

### 6.2 B2B

B2B should be treated as a conditional side-track, not a required part of the consumer-marketplace rollout spine. Founder-led commercial discovery may happen early, but committed product scope should wait until there is evidence that it helps the marketplace instead of distracting from it.

## 7. Phase advancement rules

A phase advancement is valid only when all of the following are true:

1. the PRD and strategy docs are updated first
2. maintenance policy records the activation posture and evidence bundle
3. contracts and launch-facing UX no longer imply the old phase
4. the required KPI evidence exists
5. rollback posture is documented before the change goes live
