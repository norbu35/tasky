# Tasky Rollout Phases

This document is the canonical record of the planned rollout beyond the active Phase 1 launch baseline.
It preserves future intent without keeping later-phase technical specs in the live derivative docs.
`docs/PRD.md` remains the governing document for the current product.

## 0. AI-readable rollout state

```yaml
current_phase: phase_1_launch_baseline
current_phase_label: 'Phase 1 — Launch baseline'
phase_source_of_truth: docs/PRD.md
future_phase_map: docs/ROLLOUT_PHASES.md
activation_policy: docs/maintenance/FEATURE_ACTIVATION_POLICY.md
default_future_toggle_state: 'off'
toggle_presence_means_scope: false
```

Rules for agents:

- Treat Phase 1 as current until the PRD explicitly says another phase is current.
- Treat future-phase code, schemas, routes, and toggles as intentional dormant scaffolding when they are labeled deferred.
- Preserve future-ready switchability for dormant surfaces, but do not expose those surfaces in launch UX, copy, or active contracts unless the activation policy is satisfied.
- Do not delete dormant scaffolding only because it is outside Phase 1. Do remove or relabel it if it falsely appears live.
- A feature toggle is a switch, not a phase advancement or readiness proof.

## 1. Guardrails

- Phase 1 is the only active product baseline until the PRD explicitly changes.
- A hidden route, dormant table, feature toggle, or legacy code path does not move the product into a later phase.
- Active derivative docs must describe the current phase only.
- Future implementation detail should be reintroduced into design, API, architecture, and test derivatives only when that phase is actually being prepared for rollout.
- Archived future drafts may exist for reference under `archive/design-future/**`, but they are not authoritative.
  Restore a draft to active docs only when its phase is being prepared through the PRD, strategy, activation policy,
  contracts, UX/copy, verification, monitoring, and rollback updates together.

## 2. Phase map

| Phase                                              | Purpose                                                                                              | Planned product shape                                                                                                                                                                                                                                                                                                                       | Explicit non-goals for that phase                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1 — Launch baseline**                      | Prove citywide Ulaanbaatar demand and supply can complete real jobs through a mostly self-serve flow | Citywide Ulaanbaatar posting, initial launch category catalog, structured intake, budget-or-quote pricing, open application, direct settlement, identity verification, reviews, disputes, moderation, measured operator assistance                                                                                                          | OTP-primary auth, DAN, lead fees, platform fees, promoted listings, subscriptions, escrow, wallet, payouts, referrals, B2B, instant match, runtime AI posting                             |
| **Phase 2 — Repeat liquidity and commerce pilots** | Improve matching quality, repeat behavior, and economic learning without changing job settlement     | Better ranking and application assistance, OTP migration, optional DAN fast-path, repeat-booking improvements, recurring cleaning V1, saved household preferences, founder-led/manual B2B account support, transparent platform-fee pilot in proven standardized categories, direct settlement still standard for the underlying job amount | Escrow, wallet, payouts, full-job payment collection, paid household membership by default, tasker subscriptions, lead credits by default, instant match by default, geographic expansion |
| **Phase 3 — Trust rails and supply monetization**  | Add payment-adjacent trust rails and supply-side monetization only after Phase 2 evidence exists     | Tasker subscription if paid supply value is proven, optional lead credits only in quote-heavy categories with strong lead quality, optional promoted listings in dense markets, opt-in escrow, wallet and payout operations, stronger anti-leakage enforcement, instant match only after liquidity proof                                    | Geographic expansion, managed B2B as a default product line, broad consumer subscription expansion                                                                                        |
| **Phase 4 — Expansion and broader revenue mix**    | Broaden revenue mix and geographic reach after the core marketplace is stable                        | Additional payment rails, paid household memberships after recurring behavior is proven, geographic expansion, partner/API products, and managed B2B only if earlier validation exists                                                                                                                                                      | None by default; every addition still needs explicit approval                                                                                                                             |

## 2.1 Future-ready feature registry

This table is the canonical AI routing map for known deferred feature families. It describes intended ownership and
toggle posture; it does not activate any feature.

| Feature family                         | Target phase      | Runtime switch / guard                                           | Current Phase 1 posture                                                            |
| -------------------------------------- | ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| OTP-primary auth                       | Phase 2           | Provider/config gate; OTP launch UX hidden                       | Deferred; Facebook OAuth remains the only launch auth path                         |
| DAN verification fast-path             | Phase 2           | Future provider/config gate                                      | Deferred; manual verification remains active                                       |
| Rebook and saved household preferences | Phase 2           | Existing rebook surface plus future repeat-booking guard         | Deferred outside current launch UX unless the PRD and design surfaces activate it  |
| Recurring cleaning V1                  | Phase 2 optional  | Future recurring-cleaning guard                                  | Dormant; no launch recurring schedule or paid membership promise                   |
| Platform or booking fee pilot          | Phase 2 optional  | Future `platform_fee_enabled` guard                              | Dormant and off; no launch customer fee, payment processing, or protection promise |
| Manual B2B account support             | Phase 2 optional  | Admin/operator approval; no customer-facing B2B route by default | Discovery-only until product, ops, contract, and invoice posture are approved      |
| Lead credits / paid lead unlock        | Phase 3 optional  | `lead_fee_enabled`                                               | Dormant and off; direct application remains free                                   |
| Promoted listings / task boosts        | Phase 3 optional  | Future monetization or ranking toggle                            | Dormant; no launch paid visibility promise                                         |
| Runtime AI scope summary               | Phase 2 optional  | `ai_scope_summary_enabled`                                       | Dormant and off; posting summary remains deterministic                             |
| Referrals                              | Phase 2+ optional | Deferred contract/design surface                                 | Dormant; not required for Phase 2 advancement                                      |
| Tasker subscription                    | Phase 3           | `subscription_enabled`                                           | Dormant and off; no paid Tasker Pro entitlement                                    |
| Opt-in escrow / payment protection     | Phase 3           | `escrow_enabled` plus payment provider readiness                 | Dormant and off; direct settlement remains standard                                |
| Wallet balances and payout operations  | Phase 3           | `escrow_enabled` until wallet-specific activation is split out   | Dormant and off; no wallet safety or payout promise                                |
| Instant match                          | Phase 3           | Future matching/liquidity gate                                   | Dormant; customer selects from open applications                                   |
| Paid household membership              | Phase 4 optional  | Future subscription toggle                                       | Not launch scope; must follow proven recurring cleaning behavior                   |
| Partner/API or managed B2B             | Phase 4 optional  | Future B2B toggle / commercial approval                          | Conditional side-track only; no self-serve B2B product in Phase 1                  |

If a code surface exists without a listed switch, agents should treat it as dormant design space and keep it hidden
until the relevant phase adds an explicit activation guard.

## 3. Phase 1 baseline in plain terms

Phase 1 is the current product.

It means:

- live posting across all of Ulaanbaatar
- initial launch category catalog covering home cleaning, furniture assembly, moving help / lifting help, and minor handyman, with runtime activation governed by admin controls
- structured category templates rather than generic free-form posting as the main path
- customer pricing choice between `I have a budget` and `I want quotes`
- open application with customer selection rather than algorithmic assignment
- direct settlement between customer and tasker
- no payment-hold, payment-protection, wallet, payout, or escrow promise
- verification, moderation, disputes, and bilateral reviews as the trust package

## 4. Phase 2 planned scope

Phase 2 exists to improve repeat liquidity and begin narrow economic learning before adding payment-adjacent trust rails.

### 4.1 Core intent

- improve how good applicants are surfaced to customers
- reduce matching friction without pretending the platform is already the merchant of record
- improve repeat behavior in cleaning and other standardized categories
- test transparent platform-fee collection only where the marketplace is already producing real intent

### 4.2 Preserved feature intent

If Phase 2 is entered, the planned candidates are:

- algorithm-assisted application ranking and better candidate ordering
- phone-based auth migration from Facebook-first launch auth
- optional DAN fast-path for identity verification if the provider is reliable enough
- rebook, saved preferences, and recurring cleaning V1 after the base booking lifecycle stays clean
- transparent customer-side platform or booking fee pilot in proven standardized categories, initially cleaning and
  furniture assembly candidates
- founder-led or admin-supported B2B account handling for repeat buyers such as landlords, office admins, and property
  managers
- one anchor retail, furniture, relocation, or property partnership pilot where service intent is already high

### 4.3 Constraints

- direct settlement remains the standard path
- the platform-fee pilot may collect Tasky's fee, but it must not collect, hold, or pay out the underlying job amount by
  default
- monetization remains optional inside the phase, not automatic day-one scope
- lead credits, promoted listings, tasker subscriptions, escrow, wallet, and payouts remain out of default Phase 2 scope
- referrals may exist later, but they are not required for the Phase 2 transition

## 5. Phase 3 planned scope

Phase 3 is the first point where payment-adjacent trust rails and supply-side monetization become credible.

### 5.1 Preserved feature intent

- opt-in escrow only after earlier evidence shows users need it and operations can support it
- wallet and payout operations for tasker-side funds movement
- tasker subscription if paid platform value is proven
- optional lead credits only in quote-heavy categories with demonstrated lead quality and enough verified supply
- optional promoted listings only in dense markets where paid visibility does not reduce total category conversion
- stronger anti-leakage enforcement tied to real platform value
- instant match only after verified liquidity is strong enough to avoid false availability and bad assignments

### 5.2 Constraints

- these features do not belong in Phase 1 or the default Phase 2 posture
- any payment-adjacent release must come with ops rehearsal, alerts, rollback posture, and updated launch-facing copy

## 6. Phase 4 planned scope

Phase 4 is expansion, not a rescue plan for an unproven core marketplace.

Planned candidates:

- broader payment rails
- paid household membership products after recurring cleaning behavior is proven
- geographic expansion beyond the initial citywide Ulaanbaatar baseline
- partner/API products and managed B2B only if the consumer marketplace is already stable and the B2B motion helps
  rather than distracts

## 7. Conditional tracks

Some ideas are worth preserving but should not drive the main rollout spine.

### 7.1 Referrals

Referrals may be introduced in Phase 2 or later, but they should follow proof of repeat demand and working supply. They are not a prerequisite for the next phase.

### 7.2 B2B

B2B remains a conditional side-track. Founder-led commercial discovery and manual account handling may happen during
Phase 2, but committed self-serve product scope should wait until there is evidence that B2B strengthens the marketplace
instead of fragmenting it.

### 7.3 Commerce pilots

Platform or booking fee pilots are distinct from escrow, wallet, and payout operations. A Phase 2 fee pilot may collect a
small Tasky fee for completed or confirmed jobs in proven standardized categories, but it must preserve direct settlement
for the underlying job amount unless a later phase explicitly changes the payment role.

The first paid household membership should not launch until recurring cleaning has enough repeat behavior to show that a
membership improves retention and convenience rather than creating pricing confusion.

### 7.4 Phase 2 pilot entry criteria

Phase 2 pilot candidates are not automatic activation scope. Before recurring cleaning, platform-fee collection, manual
B2B account reporting, or a partner pilot is implemented or exposed, the proposal must show:

1. Category liquidity is green or explicitly approved for a narrow learning exception using the hard-gate metrics in
   `docs/METRICS.md`.
2. The relevant category has decision-valid denominators for the hard-gate metrics.
3. Trust Failure Rate is not red in the target category.
4. The commerce-pilot dashboard in `docs/METRICS.md` and `docs/OBSERVABILITY.md` is available for the pilot.
5. Launch UX remains truthful: no payment hold, payment protection, wallet, payout, escrow, paid membership, or
   self-serve B2B promise leaks into Phase 1 surfaces.
6. The activation evidence in `docs/maintenance/FEATURE_ACTIVATION_POLICY.md` exists, including rollback criteria.

Default pilot-specific evidence:

- **Recurring cleaning V1:** cleaning has measured rebook and repeat-customer baselines, and support can explain whether
  repeats are same-tasker convenience, category habit, or operator-assisted repeats.
- **Platform-fee pilot:** legal role, provider contract, fee waiver, cancellation, refund, customer-copy, and support
  handling are documented before collecting any fee.
- **Manual B2B account support:** founder-approved accounts are tagged manually first; self-serve account portals,
  partner APIs, priority dispatch, and B2B billing remain out of scope until manual-account results prove they improve
  marketplace liquidity rather than distracting from it.
- **Partner pilot:** one anchor partner is enough for Phase 2 learning; API, white-label, or multi-partner infrastructure
  belongs later.

## 8. Re-derivation rule

When a later phase is actually being prepared, the rollout plan should be converted back into active derivatives in this order:

1. update `docs/PRD.md`
2. update `docs/STRATEGY.md` if market posture changes
3. update maintenance policy and rollout evidence requirements
4. recreate only the needed design, architecture, OpenAPI, and test derivatives for that phase
5. realign code to the new active baseline

## 9. Phase advancement rules

A phase advancement is valid only when all of the following are true:

1. the PRD and strategy docs are updated first
2. maintenance policy records the activation posture and evidence bundle
3. active contracts and launch UX no longer describe the old phase as current truth
4. the required KPI evidence exists
5. rollback posture is documented before the change goes live
