# Tasky Business Strategy & Go-To-Market

## 1. Strategy frame

Tasky is a launch-first marketplace for domestic services in Ulaanbaatar. Phase 1 is built around four operating choices:

- citywide customer posting across Ulaanbaatar
- trust-first operations with verification, moderation, and dispute handling
- zero dependency on monetization for launch viability
- a founder-operated backstop for the cases the product cannot yet resolve on its own

Later phases stay conditional. A draft screen, dormant toggle, or placeholder contract does not move a feature into the launch scope.

## 2. Phase 1 operating boundary

### 2.1 Geography and supply posture

- Brand positioning is citywide Ulaanbaatar.
- Any customer in Ulaanbaatar may create a live task.
- Supply is citywide. Taskers may set service-area preferences for targeting and notification quality.

### 2.2 What Phase 1 is trying to prove

1. Applications from ID-verified taskers arrive quickly enough across the launch categories.
2. Structured tasks turn into confirmed bookings at a usable rate.
3. Jobs complete without heavy manual intervention.
4. Trust outcomes are strong enough to support expansion.

### 2.3 Launch category set

The initial liquidity bet starts with:

1. Home cleaning
2. Furniture assembly
3. Moving help / lifting help
4. Minor handyman

These categories are a good fit for structured intake, concrete scoping fields, and selective assisted distribution when native matching falls short. Runtime category activation is governed by the admin dashboard, so the active category count can change as operators activate or deactivate templates.

## 3. Matching and assistance model

### 3.1 Native marketplace first

- Native supply and native booking are the primary path.
- Multiple applications are allowed and remain visible to the customer.
- Self-serve success excludes any system-assisted or manual-assisted intervention.

### 3.2 Assistance model

There are three outcome buckets:

1. Self-serve
2. System-assisted
3. Manual-assisted

Rules:

- External distribution is not self-serve.
- External distribution is used only after native matching fails, not by default.
- The trigger is no `qualified_application` event within 8 hours, meaning no application from a Phase 1 globally ID-verified tasker.
- Assisted distribution is an operator or backend decision, not a customer-facing option.
- Assisted distribution is initially limited to cleaning, furniture assembly, moving help, and minor handyman.

### 3.3 KPI slicing

- Category is the primary strategic slice for launch KPI decisions.
- District is a drilldown, not the main scorecard.
- Expansion decisions should be driven by category performance, verified supply depth, and repeat demand patterns.

## 4. Go-to-market sequence

1. Seed verified tasker supply across the city.
2. Acquire customer demand across Ulaanbaatar.
3. Use fixed templates and structured pricing to reduce negotiation friction.
4. Measure native liquidity before leaning on assisted distribution.
5. Expand only when the hard-gate metrics support it.

## 5. Strategic non-commitments

- No launch dependency on credits, subscriptions, referrals, B2B, DAN, OTP-primary auth, instant match, or escrow.
- No operating plan that assumes future monetization or future trust rails are already live.
- No claim that external distribution counts as native marketplace health.

## 6. Phase progression

The rollout sequence beyond launch is recorded in `docs/ROLLOUT_PHASES.md`. The strategy view is:

| Phase       | Strategic job                                                                                           | Notes                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Phase 1** | Prove the marketplace works across Ulaanbaatar with the initial launch categories and direct settlement | This is the current product.                                                                       |
| **Phase 2** | Improve matching quality and test light monetization without changing the settlement model              | Lead credits and promoted listings are optional tools inside the phase, not automatic commitments. |
| **Phase 3** | Add stronger trust rails and supply-side monetization                                                   | Escrow, wallet, payouts, and subscription belong here if earlier evidence supports them.           |
| **Phase 4** | Expand geography and revenue mix                                                                        | This is where broader payment rails, customer plans, and any managed B2B layer belong.             |

### 6.1 Conditional tracks

- Referrals are optional and should follow working liquidity rather than precede it.
- B2B is a conditional track. Founder-led commercial discovery may happen early, but it is not part of the core Phase 1 or Phase 2 success case unless the governing docs explicitly change.

### 6.2 Advancement rule

A later phase is real only when the governing docs, maintenance posture, contracts, and launch-facing UX all reflect it together. Dormant code does not advance the strategy.
