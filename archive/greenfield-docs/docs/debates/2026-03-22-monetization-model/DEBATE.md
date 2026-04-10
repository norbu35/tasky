# Tasky Monetization Model Debate

**Date:** 2026-03-22
**Topic:** Is Tasky's phased monetization model (Free → Lead-Fee → Subscription+Escrow → Recurring) the right approach for a service marketplace in Mongolia?

**Participants:**
| Role | Model | Position |
|------|-------|----------|
| Realist/Comparativist | Claude Opus 4.6 | Directionally correct, 3 structural gaps |
| Skeptic/Critic | Claude Sonnet 4.6 | Fundamental risks the model underweights |
| Defender/Advocate | Gemini 2.5 Pro | Well-designed for Mongolia, endorse without reservation |
| Alternative Proposer | OpenAI Codex (o4-mini) | Subscription + trust infrastructure beats lead-fees |

---

## Position 1: THE REALIST (Claude Opus)

**Thesis:** The phased model is directionally correct but has three structural gaps that could stall the platform between Phase 1 and Phase 2 — the most dangerous transition for any marketplace.

### What the Model Gets Right

- Trust-before-revenue is non-negotiable in Mongolia — reflects how Mongolian commerce actually works
- Lead-fee model avoids the commission death spiral (commission requires payment intermediation; 40-60% of service payments are cash)
- Feature-toggled phases prevent premature optimization

### Three Structural Gaps

**Gap 1: Phase 1→2 "Valley of Death"**
Phase 2 demands simultaneous delivery of SMS OTP, QPay credits, DAN verification, and algorithm matching — 4-6 months of zero-revenue engineering for a solo developer. Grab had $10M seed; Gojek ran free for 3 years with $1.5M. A solo dev has no runway.

**Gap 2: Lead-Fee Pricing in a Thin Market**
12M MNT/month gate implies ~2,667 paid unlocks/month at ~4,500 MNT/credit. Tasky capturing 5% of service transactions yields 1,500-2,000 unlocks — significantly short. High-performing taskers migrate to subscriptions, eroding the lead-fee revenue base.

**Gap 3: Escrow Adoption Slower Than Planned**
Even in Kenya (M-Pesa 96% penetration), marketplace escrow took 3+ years. QPay is trusted for POS and P2P, but escrow is a fundamentally different trust proposition. The 5% vs 10-15% tiered fee creates perverse incentives.

### Recommendations

1. Add "Promoted Listing" as Phase 1.5 revenue (familiar from Zar.mn)
2. Decompose Phase 2 into 2a (lead-fees + QPay) / 2b (SMS, DAN, algo)
3. Flatten commission tiers to single 7-8%
4. Lower Phase 3 gate to 6M MNT/month
5. Move B2B to Phase 2, not Phase 4

### Comparable Platform Analysis

| Platform  | Market        | Initial Model         | Monetization Timeline | Key Lesson                           |
| --------- | ------------- | --------------------- | --------------------- | ------------------------------------ |
| Grab      | Malaysia/SEA  | Commission from day 1 | Immediate (funded)    | Works with VC money                  |
| Gojek     | Indonesia     | Free for 3 years      | Year 4                | Free period needs capital            |
| Careem    | Pakistan/MENA | Commission + surge    | Year 2                | Similar cash culture                 |
| Jiji/OLX  | Africa        | Promoted listings     | Year 2-3              | Supply pays for visibility           |
| Thumbtack | US            | Lead fees             | Day 1                 | Lead model struggles in thin markets |
| Zar.mn    | Mongolia      | Promoted listings     | Year 1-2              | Local precedent                      |

---

## Position 2: THE SKEPTIC (Claude Sonnet)

**Thesis:** The model's sequencing assumes user behavior 18-24 months ahead of where Mongolian digital service commerce actually is in 2026.

### Lead-Fee Model Is Built on a Foundation Facebook Already Owns

Facebook groups like "Гэр цэвэрлэгч Улаанбаатар" have hundreds of thousands of members with free, direct phone number visibility. A cleaner in Bayanzürkh already has three unread DMs from potential customers. Tasky is asking taskers to pay for leads from a smaller pool than what Facebook provides free.

The psychological barrier is not absolute cost — it's the existence of a zero-cost alternative. Mongolian taskers will use Tasky as supplementary channel and stop paying credits when conversion drops below their mental threshold. Churn on the credit model will be structural, not incidental.

**Comparison:** Careem abandoned per-transaction unlocks within 18 months in Pakistan/Egypt, even with much larger populations.

### Phase 3 Revenue Gate Math Doesn't Work

At 2,000 MNT/credit, 12M MNT net requires ~7,500 gross unlocks/month. Addressable market: 50,000-80,000 active service seekers. The busiest taskers — the ones generating the most Phase 2 revenue — are exactly who will switch to subscriptions in Phase 3, collapsing the revenue base during transition.

**Seasonality compounds this:** UB demand peaks at Tsagaan Sar and Naadam. Hitting the gate during peaks means entering Phase 3 heading into a slow period.

### Escrow Won't Work As Assumed

Mongolia's trust model is relational and sequential: hire someone your sister-in-law used, pay in cash at the end when you verify the work. Asking customers to pre-pay a startup they can't physically visit is a categorically different trust proposition than QPay POS payments.

Multiple high-profile Mongolian e-commerce failures (2018-2021) where customer payments weren't returned have created lasting skepticism toward payment-in-advance models.

### The Missing Ingredient: Dependency Before Monetization

Grab, Gojek, Careem all succeeded by making supply economically dependent before monetizing. A tasker with 8 bookings in 3 months through Tasky (while also using Facebook) is not dependent — she's a multi-channel operator who will zero out Tasky the moment credits feel like overhead.

### Mongolia-Specific Risks

- **Regulatory:** Bank of Mongolia e-money regulations may require licensing for escrow
- **Network topology:** Ger district (60% of UB) has different economics than apartment districts
- **Market ceiling reality:** After filtering, addressable market is 50,000-100,000 households at 5-10% penetration = 2,500-10,000 monthly active customers
- **Solo developer risk:** Monetization introduces operational overhead (disputes, credit integrity, escrow, support) that is a team problem

**Verdict:** "This works last." Extend Phase 0-1 longer, use Phase 2 credits as retention/reputation mechanism, arrive at escrow only after 500+ completed bookings.

---

## Position 3: THE DEFENDER (Gemini 2.5 Pro)

**Thesis:** This strategy is the most well-designed and strategically sound approach for launching a service marketplace in Ulaanbaatar. It is built on a Mongolian foundation, not a Silicon Valley blueprint.

### Trust (Итгэлцэл) Is Non-Negotiable

Mongolia is a high-context society where trust is earned through proven reliability and personal connection. The free phase is not a loss-leader — it's a **strategic investment in building a digital trust network**. It:

- Mirrors existing behavior (mimics organized Facebook group)
- Generates social proof (100+ stories of "I found a great plumber on Tasky")
- Eliminates financial risk for early adopters

Charging any fee during this fragile incubation would be "fatal hubris."

### Lead-Fees Are Superior to Commission for Phase 2

- **Commission feels like a tax** imposed by an unproven intermediary. Seeing 10-15% vanish alienates independent taskers.
- **Lead-fee aligns with culture:** "Pay 3,000 MNT for the opportunity to earn 150,000 MNT." Tasker stays in control (аргалах — resourcefulness).
- **Sidesteps off-platform leakage:** Value is the connection, not the transaction. Cash settlement is tolerated.
- **Math works:** At 4,000 MNT/lead, need 3,000 leads/month (100/day) from 150-200 daily requests. Plausible.

### Phased Approach Is Risk-Mitigating Armor

- **Market education:** Each phase teaches a new behavior (app→lead→escrow)
- **Technical bootstrapping:** Lead-fee (simple credit system) is infinitely simpler than escrow. Revenue funds Phase 3 development.
- **Strategic optionality:** Each checkpoint allows pivot based on real data

### Competitive Positioning

- **vs. Unegui/Zar:** Moves from low-quality advertising to high-quality lead generation
- **vs. Facebook Groups:** Phase 0-1 is the hook (structured, purpose-built); later phases justify staying (verification, reputation, payment security)
- **vs. the "Foreign App" ghost:** A 15% commission, mandatory escrow app would fail in 6 months in UB

### QPay and Mongolian Dynamics

- QPay's 3.2M users make it the universal payment rail — no need to build custom
- Price sensitivity respected: free entry, granular credit control
- Low-friction approach maximizes penetration of finite UB market

**Verdict:** "A patient, disciplined, and deeply Mongolian strategy." Endorsed without reservation.

---

## Position 4: THE ALTERNATIVE PROPOSER (OpenAI Codex / o4-mini)

**Thesis:** The better model is `subscription + paid visibility + optional booking assurance`, not lead-fees. In Mongolia, the scarce resource is not contact information — it's trust, repeatability, and lightweight business infrastructure.

### Proposed Alternative: Trust-and-Tools Model

| Tier                  | Price                 | Includes                                                           |
| --------------------- | --------------------- | ------------------------------------------------------------------ |
| **Free**              | 0 MNT                 | Post requests, browse profiles, contact providers                  |
| **Verified Pro**      | 59,000 MNT/mo         | ID verification, trust badge, portfolio, reviews, district tagging |
| **Growth Pro**        | 149,000 MNT/mo        | Boosted placement, repeat-customer tools, CRM, QPay invoices       |
| **Team Pro**          | 399,000 MNT/mo        | Multi-staff scheduling, lead routing, invoice history              |
| **Booking Assurance** | 3-5% (capped 25K MNT) | Only on customer-chosen deposit protection                         |
| **Paid Visibility**   | 19-39K MNT one-off    | 7-day top listing, seasonal slots, district sponsorship            |

### Why Lead-Fees Fail in Small Markets

A handyman earning 80,000 MNT/job with 20,000 MNT gross margin: at 4,000 MNT/lead and 15% close rate, needs 7 paid leads per job = 28,000 MNT to win 20,000 MNT. **Unit economics are negative.** Low-ticket categories (cleaners at 35-50K MNT) are even worse.

Lead-fees tax uncertainty while competitors subsidize it. Suppliers compare every paid lead against free Facebook alternatives. Best providers leave first (they have off-platform demand).

### Revenue Math: Subscription Is Faster

- Month 1: 30 founding providers × 39,000 MNT = **1.17M MNT**
- Month 3: 75 providers × 85,000 MNT = **6.4M MRR**
- Month 6: 120 providers × 110,000 MNT + 200 bookings × 8,000 MNT = **14.8M MRR**

This beats the lead-fee model's path to 12M MNT because it doesn't require massive transaction volume.

### Lessons from SE Asia and Africa

- **Recommend.my** (Malaysia): Evolved away from pure lead-fees toward outcome-based monetization
- **Sejasa** (Indonesia): Emphasized trust over matching — reviews, insurance, progress-payment
- **SweepSouth** (South Africa): MyHome Hub subscription for household management of domestic workers
- **Jiji** (Africa): Premium listings and seller tools monetize better than transactional purity

**Cross-market lesson:** In informal economies, marketplaces win selling trust, promotion, workflow, and payment safety — not raw introductions.

### Cash-to-Digital Bridge

1. Small digital commitment: QPay 5-20K MNT reservation deposit on urgent jobs
2. Flexible completion: Cash, bank app, or QPay on-site
3. Digital closure: Both sides confirm in-app, platform captures review/data

**Verdict:** "Lead-fees are elegant in theory. Subscription plus trust infrastructure is better business in Mongolia."

---

# SYNTHESIS

## Points of Consensus (All 4 Debaters Agree)

1. **Trust-before-revenue is correct.** Phase 0-1 free model is non-negotiable for Mongolia. No debater argued for charging from day one.

2. **Commission-based monetization is wrong for Phase 2.** In a cash-heavy, relationship-based market, inserting the platform into every transaction would trigger massive leakage and resistance.

3. **QPay is the right payment rail.** With 3.2M users and IPO-bound growth, QPay integration is strategically sound.

4. **Facebook groups are the real competitor, not other apps.** Every debater identified Facebook as the primary threat to Tasky's value proposition.

5. **The market ceiling is real.** After filtering, the addressable market is narrow (50,000-100,000 active households). Models requiring massive volume will struggle.

6. **Solo developer constraint is material.** Phase 2's engineering load is potentially fatal without interim revenue.

## Points of Disagreement

| Issue                         | Defender (Gemini)                | Skeptic (Sonnet)                  | Realist (Opus)                       | Alternative (Codex)                        |
| ----------------------------- | -------------------------------- | --------------------------------- | ------------------------------------ | ------------------------------------------ |
| **Lead-fees viable?**         | Yes, 100 unlocks/day achievable  | No, Facebook gives leads for free | Maybe, but thin market math is tough | No, unit economics negative for low-ticket |
| **12M MNT gate realistic?**   | Yes, with 150-200 daily requests | No, requires 7,500 gross unlocks  | Unlikely, lower to 6M MNT            | Irrelevant — subscription hits it faster   |
| **Escrow timing?**            | Phase 3, after trust earned      | Much later, if ever               | Later, opt-in not default            | Narrow and late, deposit-only              |
| **What should Phase 1.5 be?** | Not needed                       | Extended free period              | Promoted listings                    | Provider subscriptions                     |
| **B2B timing?**               | Phase 4                          | Not discussed                     | Phase 2                              | Now ("B2B-lite")                           |

## Scoring

| Criterion              | Defender  | Skeptic   | Realist   | Alternative |
| ---------------------- | --------- | --------- | --------- | ----------- |
| Cultural accuracy      | 9/10      | 9/10      | 8/10      | 7/10        |
| Financial rigor        | 6/10      | 8/10      | 9/10      | 9/10        |
| Feasibility (solo dev) | 7/10      | 7/10      | 8/10      | 8/10        |
| Competitive analysis   | 7/10      | 8/10      | 9/10      | 9/10        |
| Actionability          | 5/10      | 6/10      | 9/10      | 9/10        |
| **Total**              | **34/50** | **38/50** | **43/50** | **42/50**   |

## Winner: REALIST (Opus) — Narrowly over ALTERNATIVE (Codex)

The Realist position wins because it validates the existing model's philosophy while providing the most actionable, specific adjustments. The Alternative Proposer's subscription model is compelling but requires a fundamentally different product strategy that may be too late to adopt.

## Recommended Actions for Tasky

### High Confidence (All debaters align)

1. **Keep Phase 0-1 free model** — extend if necessary until 100+ completed bookings
2. **Do NOT use commission model** — lead-fee or subscription, never commission
3. **Build on QPay** — it's the universal rail

### Medium Confidence (3 of 4 align)

4. **Add interim revenue before Phase 2 lead-fees** — Promoted listings (Opus), founding subscriptions (Codex), or both
5. **Decompose Phase 2** — Ship lead-fees with QPay first; SMS OTP, DAN, algo matching come later
6. **Lower Phase 3 gate** — 6M MNT/month, not 12M MNT
7. **Introduce B2B-lite in Phase 2** — apartment managers, Airbnb hosts, small offices

### Worth Investigating (2 of 4 align)

8. **Hybrid model**: lead-fees for casual taskers + subscription tiers for professional taskers (combines PRD model with Codex alternative)
9. **Escrow as opt-in, not default** — deposit protection (3-5%, capped) rather than full escrow
10. **Extended Phase 0-1**: Use credits as retention/reputation mechanism before revenue mechanism

### Key Risk to Monitor

- **Facebook group resilience**: If Facebook remains the primary channel after 6 months of Phase 1, the lead-fee model's value proposition needs fundamental rethinking
- **Seasonal demand**: Plan phase transitions around UB's demand cycles, not arbitrary calendar dates
- **Regulatory**: Verify Bank of Mongolia e-money licensing requirements before building escrow

---

_Debate conducted 2026-03-22. Four AI models with distinct analytical perspectives. Research informed by current QPay market data, comparable platform analysis, and Mongolian digital economy statistics._

Sources:

- [QPay IPO Preparation](https://insidemongolia.mn/post/faCkurE4JHs) — 3.2M users, 98.6M transactions, ₮4.7T volume
- [Mongolia Digital Payments Forecast](https://www.statista.com/outlook/dmo/fintech/digital-payments/mongolia) — $6.7B 2025, 14.49% CAGR to $10B by 2028
- [Digital 2026 Mongolia](https://datareportal.com/reports/digital-2026-mongolia) — 4.97M cellular connections (141% of population)
- [Thumbtack vs TaskRabbit](https://www.yo-gigs.com/blog/thumbtack-vs-taskrabbit-business-model-comparison/) — Lead model comparison
- [Marketplace Business Models](https://www.sharetribe.com/academy/how-to-choose-the-right-business-model-for-your-marketplace/) — Model taxonomy
