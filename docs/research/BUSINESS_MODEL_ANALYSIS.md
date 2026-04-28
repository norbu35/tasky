# Business & Monetization Model Analysis

_Analysis date: April 15, 2026. Synthesized from PRD v1.4, STRATEGY.md, MONGOLIA_MARKET_RESEARCH.md, PAYMENT_BEHAVIOUR_ANALYSIS.md, unegui_market_report_2026-03-03.md, and LAUNCH_ROADMAP.md._

Status: historical research input. Current business-model synthesis lives in
`docs/research/business-model-research.md`; governing product direction lives in `docs/PRD.md`,
`docs/STRATEGY.md`, `docs/METRICS.md`, and `docs/ROLLOUT_PHASES.md`.

---

## 1. What The Research Confirms Is Strong

**The market gap is real and quantifiable.** 43 new service listings per day on Unegui with explosive month-over-month growth, zero GPS data, 60%+ hidden pricing, no reviews, no verification, rampant spam. There is genuine consumer pain and a first-mover opening in home services. UBCab proves app-based labour matching works in Mongolia. Digital readiness (85% smartphones, 88% Facebook, 3.2M QPay users, 99% bank penetration) means the infrastructure is there.

**The trust-first thesis is correct for Mongolia.** The research converges: relationship-driven culture, low institutional trust, high personal-network trust. TaskRabbit failed in Japan for exactly this reason. Facebook groups are the incumbent precisely because they piggyback on social trust, but they offer zero trust infrastructure. Tasky's core bet -- that structured verification, mandatory reviews, and dispute resolution create a trust layer that informal channels can't replicate -- is well-grounded.

---

## 2. Revenue Ceiling

The market research (MONGOLIA_MARKET_RESEARCH.md, gap #10) flags the core constraint:

> UB: ~1.7M people, ~500K-600K households. At 5% penetration in Year 2: ~30,000 bookings/month. At MNT 50,000 avg task value and 10% take rate: **~$43,000/month revenue (~$516K/year).**

That's a real business, but it's a small one. The strategy document mentions "city-2 expansion (Darkhan/Erdenet)" and "higher-value categories" as future paths, but doesn't model them.

### Open questions

- **What does the business need to look like at 18 months to justify continued investment?** Is this a venture-scale play or a profitable lifestyle/SMB business? That answer changes everything about the monetization timeline.
- **The Unegui data shows construction and plumbing have the highest ticket sizes** (MNT 50K-80K median). Cleaning is only MNT 4K median. Category mix matters enormously for revenue. Are we staying in low-ticket categories for trust-building and then moving up? Or starting with higher-value categories sooner?
- **Darkhan (80K) and Erdenet (100K) are tiny.** City-2 expansion adds maybe 10-15% to the addressable market. The real scaling answer is either (a) much higher penetration in UB, (b) higher-value services, or (c) B2B recurring contracts. All three are Phase 3+ in the current plan.

---

## 3. QPay Timing: The Unresolved Strategic Conflict

The project documents contain a genuine strategic conflict:

- **The market research says** QPay at 0% should be Phase 1 because without it, Tasky is "structurally identical to a Facebook group."
- **The payment behaviour analysis says** forcing payment through a new platform kills adoption. Cash first, QPay incentivised later, escrow last.

The PRD sided with the payment analysis (direct settlement in Phase 1), which is the _safer_ call. But the market research has a valid point: if Phase 1 is posting + matching + cash settlement, the user experience is dangerously close to "a nicer Facebook group."

**The question is: what is the minimum trust differential that makes users come back?** If it's just "verified taskers who show up," that might be enough for Phase 1 without payment. If it's not, QPay is needed earlier. This is the single most important product experiment to design a decision metric for.

### Proposed decision gate

At **100 completed bookings**, measure: what % of customers say they'd use Tasky again over Facebook groups, and _why_?

- If the answer is "verified taskers" and "structured process," the trust differential is working without payment rails. Proceed as planned.
- If the answer is "it's about the same," QPay needs to come earlier than Phase 2. The 200-booking trigger may be too late.

---

## 4. Monetization Ladder: What's Missing

### Current plan

| Phase   | Revenue             | Trigger                                  |
| ------- | ------------------- | ---------------------------------------- |
| Phase 1 | Zero                | Launch                                   |
| Phase 2 | Lead fees (partial) | 200+ completed bookings, 40% repeat rate |
| Phase 3 | 10-15% take rate    | QPay habit established                   |
| Phase 4 | Subscriptions, B2B  | Market maturity                          |

### Gaps

- **No timeline even as a rough range.** If it takes 12 months to hit 200 completed bookings, that's a year at zero revenue. What's the runway?
- **Lead fees are the weakest model here.** The payment analysis warns that contact-detail exposure triggers leakage. Lead fees inherently require revealing information (the "lead") that enables disintermediation. There's a tension between "never expose contact details" and "charge for lead access."
- **The Unegui model is actually instructive.** They make money from promoted listings (VIP/Top tier): 7.7% of listings are paid, and VIP gets 23x more views. Free listings get a median of 5 views. This is supply-side frustration monetization -- and it works. A promoted/featured tasker model might fit better than lead fees for Mongolia.

---

## 5. Monetization Models Ranked For Mongolian Market Fit

| Model                                                              | Market fit     | Rationale                                                                                                      |
| ------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Promoted/featured tasker profiles**                              | High           | Proven on Unegui (supply pays for visibility). Doesn't require payment intermediation. Low consumer friction.  |
| **Tasker subscription tiers** (monthly fee for visibility + tools) | Medium-high    | Recurring revenue. Taskers who make MNT 1M+/month from the platform will pay MNT 20-50K for premium placement. |
| **Commission/take rate** (10-15%)                                  | Medium         | Standard model but highest leakage risk. Only works after habit formation.                                     |
| **Lead fees** (per-applicant)                                      | Medium-low     | Tension with anti-leakage strategy. Works better for high-value categories only.                               |
| **B2B/recurring service contracts**                                | High (later)   | Best revenue per account but requires operational maturity. Phase 4 is correct.                                |
| **Insurance/guarantee premium**                                    | Medium (later) | Culturally aligned (paying for safety), but requires scale for actuarial viability.                            |

### Recommendation: promoted listings as first monetization experiment

A "Featured Tasker" product that gives priority placement in search results is:

- Low friction (tasker pays, customer sees no fee)
- Proven in this exact market (Unegui VIP/Top tiers)
- Not in tension with the anti-leakage strategy (unlike lead fees)
- Testable at small scale with no infrastructure dependency on QPay or escrow

This could pilot as early as Phase 2 alongside the QPay incentive rollout. It won't be the long-term primary revenue model, but it generates signal and some revenue while the take-rate habit forms.

---

## 6. Category-Level Monetization Strategy

The Unegui pricing data makes clear that a blanket take rate doesn't work:

| Category     | Median price | Viable for 10% take rate?        |
| ------------ | ------------ | -------------------------------- |
| Cleaning     | MNT 4,000    | No -- MNT 400 fee is meaningless |
| Painting     | MNT 15,000   | Marginal                         |
| Electrical   | MNT 30,000   | Possible                         |
| Construction | MNT 50,000   | Yes                              |
| Moving       | MNT 60,000   | Yes                              |
| Plumbing     | MNT 80,000   | Yes                              |

### Proposed category roles

- **Cleaning/painting**: free or near-free forever, used for volume and habit formation
- **Moving/plumbing/construction/electrical**: where take rates, promoted listings, and premium features generate revenue
- **B2B recurring cleaning**: office/restaurant contracts -- this is where cleaning becomes a revenue category (recurring, higher volume, predictable)

---

## 7. Metrics: What To Measure Before Committing To Any Model

### Phase 1 metrics (already in PRD)

- Booking completion rate
- Repeat booking rate (the critical one)
- Review completion rate
- Time-to-first-applicant
- Verification queue turnaround time
- Dispute resolution time

### Phase 1 metrics needed for monetization readiness (not in PRD)

- **Willingness-to-pay signal**: Even at zero revenue, survey or A/B test. "Would you pay MNT 2,000 for priority visibility?" gives signal before building.
- **Value-per-booking to the customer**: How much time/effort does Tasky save vs. Facebook groups? If the answer is "not much," monetization at any level will fail.
- **Leakage rate**: What % of first-time matches convert to off-platform repeat transactions? This is the single best predictor of whether any take rate can work.
- **Category-level unit economics**: Cleaning at MNT 4,000 median can never support a take rate. Plumbing at MNT 80,000 can. Per-category viability analysis is needed.

### Disintermediation measurement (design now, even if monetization is later)

- **Message-to-booking ratio**: if users message 5 taskers but only book 1 on-platform, the other 4 may have gone off-platform
- **Repeat booking rate by same customer-tasker pair**: if a pair books once on Tasky and never again, they likely went direct
- **In-app message volume drop-off**: if messaging stops abruptly after first booking, contact details were exchanged
- **Phone number pattern detection in messages**: recommended in LAUNCH_ROADMAP.md Tier 2 fast-follow. Build the detector early even if enforcement comes later.

---

## 8. Seasonal Strategy

The Unegui data shows volume roughly doubled every month from October through February, with a 143 listings/day spike in late February (pre-Tsagaan Sar + spring renovation). This is actionable:

- **Pre-Tsagaan Sar (December-January)**: heaviest cleaning demand. If Tasky launches with verified cleaners who are guaranteed to show up during the busiest period, that's a powerful trust moment.
- **Spring surge (March-April)**: construction, painting, plumbing spike. This is when higher-value categories get tested.
- **Summer dip**: rural migration reduces supply. This is when B2B recurring contracts provide steady income for taskers who stay in UB.

---

## 9. Assessment Summary

### Solid

- Trust-first thesis, grounded in Mongolian consumer behaviour
- Phase 1 zero-monetization pilot with founder concierge backstop
- Information control strategy (no contact details, progressive location reveal)
- Mandatory reviews (culturally necessary, not just a nice-to-have)
- District-constrained launch with liquidity targets

### Needs more work

- Revenue ceiling acknowledgment and explicit path to viable business size
- Decision metrics for _when_ to introduce QPay (not just "after 200 bookings" -- what if 200 bookings takes 8 months?)
- Category-level monetization strategy instead of blanket take rate
- Promoted listings as first-revenue experiment (proven model, lower risk than lead fees)
- Disintermediation measurement from day one
- Seasonal GTM calendar with specific supply acquisition targets by period
- Explicit runway/burn model so the monetization timeline has financial constraints, not just product milestones
