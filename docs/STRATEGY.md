# Tasky Business Strategy & Go-To-Market

## 1. Strategy frame

Tasky is a launch-first marketplace for domestic services in Ulaanbaatar. Phase 1 is built around four operating choices:

- citywide customer posting across Ulaanbaatar
- trust-first operations with verification, moderation, and dispute handling
- zero dependency on monetization for launch viability
- explicit preparation for narrow, evidence-gated commerce pilots after liquidity proof
- a founder-operated backstop for the cases the product cannot yet resolve on its own
- a narrow one-time rebook path after completed bookings so repeat intent can be measured before paid retention products

Later phases stay conditional. A draft screen, dormant toggle, or placeholder contract does not move a feature into the launch scope.
The strategy is not "free forever"; it is "liquidity first, then transparent value capture where the product has proven
it improves matching, completion, and repeat convenience."

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
5. Completed trust creates enough repeat intent to justify later saved preferences, recurring cleaning, or fee pilots.

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
5. Use one-time rebook as the launch repeat signal, then invest in saved preferences and recurring cleaning once
   completion is reliable.
6. Pilot transparent platform-fee collection only in categories with proven liquidity, while keeping the underlying job
   amount settled directly between customer and tasker.
7. Start B2B as founder-led account discovery and manual invoicing support before building a self-serve B2B product.
8. Expand only when the hard-gate and economic learning metrics support it.

## 5. Commerce posture

The first monetization move should be narrow and visible:

- a small customer-side platform or booking fee in standardized categories such as cleaning and furniture assembly
- all-in price presentation before commitment, with no back-loaded fees
- direct customer-tasker settlement for the underlying job amount
- no escrow, wallet, payout, or payment-protection promise
- no broad tasker commission or paid lead-unlock model while verified supply is still scarce

One-time rebook is the launch repeat-use signal. Recurring cleaning is the first deeper retention priority after basic
completion is reliable. Paid household membership should wait until weekly or biweekly cleaning behavior is visible in
real usage. Tasker Pro, promoted listings, and lead credits are later tools and must follow evidence that they improve
marketplace quality without damaging supply trust.

Founder-led B2B can start early as discovery and manual account handling for landlords, office admins, property
managers, and similar repeat buyers. Self-serve B2B portals, partner APIs, and white-label products are not near-term
scope.

## 6. Strategic non-commitments

- No launch dependency on credits, subscriptions, referrals, B2B, DAN, OTP-primary auth, instant match, or escrow.
- No launch dependency on platform fees, payment processing, or B2B revenue.
- No operating plan that assumes future monetization, future trust rails, or future B2B surfaces are already live.
- No claim that external distribution counts as native marketplace health.
- No claim that a platform-fee pilot provides payment protection, payment hold, wallet safety, or Tasky-managed payout.

## 7. Phase progression

The rollout sequence beyond launch is recorded in `docs/ROLLOUT_PHASES.md`. The strategy view is:

| Phase       | Strategic job                                                                                           | Notes                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1** | Prove the marketplace works across Ulaanbaatar with the initial launch categories and direct settlement | This is the current product. One-time rebook may measure repeat intent, but monetization must not be required for launch viability.                  |
| **Phase 2** | Improve repeat liquidity and run narrow commerce pilots without changing job settlement                 | Rebook UX improvements, saved preferences, recurring cleaning V1, manual B2B support, and platform-fee pilots belong here if evidence supports them. |
| **Phase 3** | Add payment-adjacent trust rails and supply-side monetization                                           | Escrow, wallet, payouts, Tasker Pro, lead credits, and promoted listings remain conditional and evidence-gated.                                      |
| **Phase 4** | Expand geography and revenue mix                                                                        | Broader payment rails, paid household memberships, partner APIs, and managed B2B belong here after earlier validation.                               |

### 7.1 Conditional tracks

- Referrals are optional and should follow working liquidity rather than precede it.
- B2B is a conditional track. Founder-led commercial discovery and manual account handling may happen during Phase 2,
  but self-serve B2B product scope requires explicit governing-doc approval and proof that repeat accounts strengthen
  category liquidity.
- Retail, furniture, relocation, or property partnerships may be explored after assembly, moving, or cleaning show
  reliable supply. The first partner motion should be one anchor pilot, not API or white-label infrastructure.

### 7.2 Advancement rule

A later phase is real only when the governing docs, maintenance posture, contracts, and launch-facing UX all reflect it together. Dormant code does not advance the strategy.
