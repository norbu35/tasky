# Tasky Business Model Research

Status: research input, not a governing product contract. Governing behavior lives in `docs/PRD.md`,
`docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, and `docs/METRICS.md`.

## Executive Summary

Tasky should stay liquidity-first at launch, but the business should not be designed as free forever. The strongest
direction is a narrow, evidence-gated commerce path:

1. Prove category liquidity and trust in Phase 1.
2. Improve repeat behavior through rebook, saved preferences, and recurring cleaning.
3. Pilot a small, transparent customer-side platform or booking fee only in proven standardized categories.
4. Keep the underlying job amount settled directly between customer and tasker until escrow, wallet, payout, legal,
   support, reconciliation, and monitoring are mature.
5. Start B2B as founder-led account discovery and manual invoicing support before building self-serve B2B surfaces.

The best first categories for economic learning are home cleaning and furniture assembly. Cleaning has the strongest
repeat-use pattern. Assembly and moving have the clearest partner channel potential. Minor handyman should stay later
for monetization because quote variability and lead-quality risk are higher.

## Mongolia Market Fit

The Mongolia fit is credible for a trust-first domestic-services marketplace, but price presentation matters.

Relevant market signals:

- Ulaanbaatar households already use informal digital discovery channels, especially Facebook groups, Facebook
  Marketplace, classifieds, and personal networks.
- Digital access and social usage are high enough that customer and tasker acquisition through mobile-first channels is
  plausible.
- Local payment infrastructure is mature enough for QR/deeplink-style payments, but customer trust is more likely to be
  damaged by hidden or confusing fees than by the presence of a small visible fee.
- The strategic wedge is not generic discovery. Tasky must beat informal alternatives on verification, structured scope,
  speed, repeat convenience, and evidence-backed recourse.

Sources reviewed:

- DataReportal, Digital 2026: Mongolia: https://datareportal.com/reports/digital-2026-mongolia
- Bank of Mongolia payment-system reporting: https://www.mongolbank.mn/en/r/7224
- Bank of Mongolia payment-service-provider licensing: https://www.mongolbank.mn/en/p/1305
- QPay merchant and user positioning: https://qr.qpay.mn/
- UNCTAD Mongolia eTrade Readiness Assessment:
  https://mongolia.un.org/sites/default/files/2023-06/UNCTAD_eTReady_Mongolia.pdf
- National Statistics Office bulletin, 2026-I-II:
  https://www.nso.mn/uploads/1773919482542-Bulletin_2026_I-II%20en.pdf
- World Bank Mongolia Economic Update press release, 2026:
  https://www.worldbank.org/en/news/press-release/2026/04/09/world-bank-mongolia-s-economy-stays-resilient-but-faces-rising-uncertainty

## Strategic Position

Tasky's launch thesis is coherent: formalize an informal service market by replacing ad hoc messaging and weak trust
signals with structured requests, verified tasker supply, controlled booking, review-backed reputation, and
evidence-backed disputes.

The research changes the rollout posture, not the launch baseline. Phase 1 should still avoid monetization dependency,
but Phase 2 should not be only "better matching plus optional lead credits." It should become repeat liquidity plus
commerce pilots:

- rebook and saved household preferences
- recurring cleaning V1
- transparent platform-fee pilot in cleaning and furniture assembly candidates
- founder-led manual B2B account support
- one anchor partner pilot in assembly, moving, property, or relocation if supply is reliable

## Recommended Revenue Stack

| Revenue path                                  | Fit for Mongolia                 | Solo feasibility     | Timing                   | Verdict                     |
| --------------------------------------------- | -------------------------------- | -------------------- | ------------------------ | --------------------------- |
| Customer platform / booking fee               | High if visible and low          | Medium               | Phase 2 pilot            | First paid wedge            |
| Recurring cleaning workflow                   | High                             | Medium               | Phase 2                  | First retention wedge       |
| Paid household membership                     | Medium, evidence-dependent       | Medium-high          | Phase 4 optional         | Wait for repeat behavior    |
| Manual B2B accounts and invoice exports       | High for repeat buyers           | Medium               | Phase 2 optional         | Start manually              |
| Retail / furniture / relocation partner pilot | Medium-high                      | High operationally   | Phase 2 optional         | One anchor pilot only       |
| Tasker Pro subscription                       | Medium, supply-density dependent | Medium               | Phase 3                  | Later                       |
| Promoted listings                             | Low until traffic is dense       | Medium               | Phase 3 optional         | Later                       |
| Lead credits                                  | Risky early                      | Medium               | Phase 3 optional         | Quote-heavy categories only |
| Escrow, wallet, payouts                       | Potentially useful, high risk    | High                 | Phase 3+                 | Defer                       |
| Partner API / white-label                     | Low near term                    | High                 | Phase 4                  | Defer                       |
| Data monetization                             | Low trust fit                    | High governance risk | Late, B2B aggregate only | Avoid near term             |

## What A Solo Developer Can Build With AI

### Feasible near term

These are realistic for a solo developer using AI if the scope stays narrow:

- rebook contract cleanup and rebook UX
- saved household preferences for repeat cleaning
- recurring cleaning V1 as a repeated task/request pattern, not a paid subscription
- platform-fee quote and display logic
- QPay/deeplink collection for Tasky's platform fee only
- fee waiver and fee experiment fields
- booked GMV, completed GMV, platform fee revenue, payment penetration, repeat customer, and rebook metrics
- admin-owned manual B2B account tags, invoice exports, and monthly account summaries

### Feasible but serious

These need tighter planning and verification:

- real payment provider callback handling beyond synthetic URLs
- ledger entries for Tasky fee reconciliation
- refund, cancellation, and fee-waiver policy
- partner-origin attribution and reporting
- leakage indicators using post-confirmation communication and support signals

### Not solo-friendly yet

These should wait until product evidence and operations mature:

- escrow
- wallet balances
- tasker payout operations
- full-job payment collection
- paid tasker subscriptions
- paid household membership
- lead-credit marketplace
- promoted ranking system
- white-label/API products

## Recommended Implementation Sequence

### Stage 0: Keep launch clean

- Preserve Phase 1 direct settlement.
- Do not expose payment protection, escrow, wallet, payout, membership, lead-credit, or B2B promises.
- Get the current launch dashboard and alert posture working for liquidity and trust metrics.

### Stage 1: Repeat behavior foundation

- Fix any rebook contract drift before making rebook strategic.
- Add saved preferences for cleaning.
- Add recurring cleaning V1 as repeated task creation, not a paid membership.
- Measure rebook rate and repeat customer rate before pricing a household plan.

### Stage 2: Platform-fee pilot

- Add a separate `platform_fee_enabled` guard; do not reuse `escrow_enabled`.
- Define fee eligibility by category and user cohort.
- Display underlying job price, platform fee, total payable amount, and fee waiver state before commitment.
- Collect only Tasky's platform fee. Keep the underlying job payment settled directly between participants.
- Track payment penetration, conversion drop, fee revenue, trust failures, and leakage.

### Stage 3: Manual B2B and partner discovery

- Add admin/manual account tagging and invoice export support.
- Track account GMV, jobs per account, operator time per account, and repeat behavior.
- Run one anchor partner pilot only after supply is reliable in the relevant category.
- Do not build a self-serve B2B portal or partner API until manual account evidence supports it.

### Stage 4: Later monetization

- Consider Tasker Pro only after taskers have enough on-platform work that analytics, boosts, or lower future fees create
  obvious value.
- Consider lead credits only in quote-heavy categories with enough verified supply and strong lead quality.
- Consider escrow, wallet, and payout operations only after legal, reconciliation, fraud, support, monitoring, and
  rollback posture are ready.

## Architecture Assessment

The current architecture can support the extension, but it should not be activated by simply turning on existing
deferred escrow surfaces.

Architecture strengths:

- modular monolith boundaries are compatible with a commerce module
- provider pattern supports local payment gateway integration
- idempotency and outbox patterns are suitable for payment callbacks and fee events
- feature toggles and admin audit trails fit controlled rollout
- projections and business events support metrics expansion

Architecture gaps:

- current payment code is escrow-gated, while the recommended first pilot is platform-fee-only
- current QPay adapter appears scaffolded and should be treated as non-production until provider behavior is verified
- wallet and payout code is not the right foundation for a simple fee pilot
- rebook contract and runtime behavior need alignment before recurring cleaning becomes a strategic product surface
- mobile and web deferred copy around escrow, wallet, lead unlock, and payment protection must stay hidden or be cleaned
  before commerce pilots

Implementation implication: build a clean `platform_fee_enabled` path and leave `escrow_enabled` for later money-hold,
wallet, and payout semantics.

## Feasibility And Undertaking Size

| Scope                                  | Estimated effort | Main risk                                                  |
| -------------------------------------- | ---------------- | ---------------------------------------------------------- |
| Documentation and roadmap alignment    | 1-3 days         | Cross-doc drift                                            |
| Rebook cleanup + recurring cleaning V1 | 2-4 weeks        | Contract and UX consistency                                |
| Manual B2B account support             | 2-4 weeks        | Operator workflow ambiguity                                |
| Platform-fee pilot                     | 6-10 weeks       | Payment provider, legal role, callback reliability, fee UX |
| Partner pilot                          | 8-16 weeks       | Sales and ops more than code                               |
| Escrow/wallet/payout                   | 3-6+ months      | Legal, reconciliation, fraud, disputes, support            |
| Full hybrid marketplace economics      | 9-18 months      | Operational complexity and category liquidity              |

## Open Questions

These should be answered before implementing fee collection:

1. What is Tasky's exact legal role when collecting only a platform fee?
2. Which local payment provider contract supports platform-fee-only flows cleanly?
3. What refund rule applies when the job is canceled or disputed but only the fee was collected?
4. How will fee waivers be represented in analytics and customer support?
5. What repeat-cleaning threshold is enough to justify paid household membership work?
6. What manual B2B account evidence justifies a self-serve B2B product surface?

## Product Decision Summary

The recommended direction is:

- Phase 1: launch baseline, free/direct settlement, liquidity and trust proof.
- Phase 2: repeat liquidity plus narrow commerce pilots.
- Phase 3: conditional supply monetization and payment-adjacent trust rails.
- Phase 4: broader revenue mix, paid household membership, partner/API, managed B2B, and geographic expansion.

This keeps Tasky realistic for a solo founder using AI while preserving a credible path to revenue once the marketplace
proves it can create repeat, trustworthy transactions in Ulaanbaatar.
