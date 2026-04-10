# Tasky Monetization Strategy Analysis
**Date:** 2026-03-22
**Method:** Four-way AI debate across 2 rounds (Claude Opus, Claude Sonnet, Gemini 2.5 Pro, OpenAI Codex o4-mini)
**Scope:** Optimal monetization phasing for a service marketplace in Ulaanbaatar, Mongolia

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Market Context](#market-context)
3. [Round 1: Is the Current PRD Model Right?](#round-1)
4. [Round 2: What Phasing Model Works Best?](#round-2)
5. [The Composite Blueprint](#composite-blueprint)
6. [Detailed Revenue Projections](#revenue-projections)
7. [Key Strategic Decisions](#key-decisions)
8. [Risks and Mitigations](#risks)
9. [Sources](#sources)

---

## 1. Executive Summary <a name="executive-summary"></a>

Eight distinct AI analyses across two debate rounds converged on a monetization strategy that differs materially from the current PRD (docs/PRD.md, Section 7.5). The core finding:

**The PRD's phased model (Free → Lead-Fee → Subscription+Escrow → Recurring) is directionally correct but requires four structural adjustments:**

1. **Add promoted listings and provider subscriptions before lead-fees** — bridge the zero-revenue gap
2. **Run B2B monetization in parallel with consumer monetization** — creates supply-side dependency
3. **Use category-tiered lead pricing** — flat pricing creates negative unit economics for low-ticket categories
4. **Lower the Phase 3 revenue gate from 12M to 6M MNT/month** and make escrow opt-in

The recommended Composite Blueprint targets **8-12M MNT/month (~$2,300-3,500 USD)** by month 12 through diversified revenue streams, compared to the PRD's projected 12M MNT from lead-fees alone.

---

## 2. Market Context <a name="market-context"></a>

### Mongolia Digital Economy (2026)
- **Population:** 3.5M (UB: ~1.5M, ~500-600K households)
- **Average salary:** 1.5M MNT/month (~$440 USD)
- **QPay users:** 3.2M (preparing for IPO)
- **QPay transactions (Jan-Oct 2025):** 98.6M transactions, ₮4.7T volume
- **Digital payments market:** $6.7B (2025), growing 14.49% CAGR to $10B by 2028
- **Cellular connections:** 4.97M (141% of population)
- **Dominant social platform:** Facebook (used extensively for commerce)

### Service Marketplace Landscape
- **Zar.mn:** Classifieds, promoted listings model (3-10K MNT per boost)
- **Unegui.mn:** Classifieds, 60%+ hide prices, listing fee model
- **Facebook groups:** 200K+ members in service-specific groups, free, direct phone number visible
- **Word of mouth:** Relationship-based (Танил тал), still the dominant channel

### Addressable Market (After Filtering)
- Total UB households: 500-600K
- Below economic threshold for paid services: -40-50%
- Exclusive word-of-mouth users: -20-30%
- Exclusive Facebook group users: -15-20%
- **Realistic addressable market: 50,000-100,000 households**
- At 5-10% monthly active penetration: **2,500-10,000 monthly active customers**

---

## 3. Round 1: Is the Current PRD Model Right? <a name="round-1"></a>

### Debate Question
*Is Tasky's phased monetization model (Free → Lead-Fee → Subscription+Escrow → Recurring) the right approach for Mongolia?*

### Participants and Positions

| Role | Model | Verdict | Score |
|------|-------|---------|-------|
| Realist | Opus | Correct philosophy, 3 fixable gaps | 43/50 |
| Alternative | Codex | Subscription + trust tools is better | 42/50 |
| Skeptic | Sonnet | Structural risks underweighted | 38/50 |
| Defender | Gemini | Endorse without reservation | 34/50 |

### Unanimous Findings
1. **Phase 0-1 free model is correct** — non-negotiable for Mongolia's trust culture
2. **Commission model is wrong** — triggers leakage, alienates independent taskers
3. **QPay is the right rail** — 3.2M users, universal adoption
4. **Facebook is the real competitor** — not other apps
5. **Market ceiling is real** — volume-dependent models will struggle
6. **Solo developer constraint is material** — Phase 2 engineering load is dangerous

### Key Disagreements
- **Lead-fees viable?** Gemini says yes (100 unlocks/day achievable). Sonnet and Codex say no (Facebook gives leads free, unit economics negative for low-ticket categories). Opus says maybe (thin market math is tough).
- **12M MNT gate realistic?** Only Gemini thinks so. Others say lower to 6M or use different metric.
- **Escrow timing?** All agree it should be later and opt-in, not default.

### Critical Insight: The Missing Ingredient
> "Grab, Gojek, Careem all succeeded by making supply economically dependent before monetizing. A tasker with 8 bookings in 3 months through Tasky while also using Facebook is not dependent." — Sonnet

This became the central question for Round 2.

---

## 4. Round 2: What Phasing Model Works Best? <a name="round-2"></a>

### Debate Question
*What is the optimal monetization phasing from trust/liquidity to sustainable revenue, calibrated for Mongolian market sentiment?*

### Four Competing Blueprints

#### Blueprint A: Hybrid Model (Opus)
- Visibility (month 4) → Category-tiered lead credits (month 7) → Pro subscriptions (month 10) → Opt-in escrow (month 12+)
- Multiple revenue streams, no single failure point
- **Month 12: 6.0M MNT | Year 1: 23.7M MNT**

#### Blueprint B: Subscription-First (Sonnet)
- Pro Badge at 9,900 MNT (month 4) → Two-tier subscriptions (month 10) → Family Plan (month 15+)
- Deepest cultural reasoning: subscription = professional standing (Нарантуул stall analogy)
- No lead-fees ever. Revenue follows trust.
- **Month 12: 2.07M MNT | Year 1: 7.7M MNT**

#### Blueprint C: Modified PRD (Gemini)
- Free leads (5/month) + paid lead fees (month 3) → Promoted listings "Онцлох"/"Яаралтай" (month 4) → QPay integration (month 6) → Subscription + escrow (month 10)
- Fastest early revenue, most aggressive tasker growth assumptions (3,000 by month 12)
- **Month 12: 15.1M MNT | Year 1: 61.4M MNT**

#### Blueprint D: B2B-Lite First (Codex)
- Free B2B concierge (months 1-4) → Host Lite 99K/location/month (month 5) → Ops Standard 249K (month 6) → Multi-Site 599K (month 8) → Supplier Pro 79K (month 11)
- Targets Airbnb hosts, offices, restaurants, apartment managers
- Creates supply dependency through recurring B2B demand
- **Month 12: 18.4M MNT | Year 1: 69.6M MNT**

### Round 2 Scoring

| Criterion | Hybrid | Subscription | Modified PRD | B2B-Lite |
|-----------|--------|-------------|-------------|----------|
| Cultural fit | 8/10 | **10/10** | 8/10 | 7/10 |
| Revenue realism | 7/10 | 5/10 | 6/10 | **7/10** |
| Solo dev feasibility | 6/10 | **9/10** | 7/10 | 7/10 |
| Supply dependency | 5/10 | 5/10 | 4/10 | **10/10** |
| Resilience | **9/10** | 6/10 | 7/10 | 6/10 |
| Actionability | 8/10 | **9/10** | 7/10 | 8/10 |
| **Total** | 43/60 | 44/60 | 39/60 | **45/60** |

### Round 2 Winner: B2B-Lite First (Codex)
Won because it directly solves the structural weakness all other models share: supply-side dependency. However, the Composite Blueprint (combining all four) is strongest overall.

---

## 5. The Composite Blueprint <a name="composite-blueprint"></a>

### Phasing Overview

```
Month:  1   2   3   4   5   6   7   8   9  10  11  12
        |---FREE---|---TRUST LAYER + B2B WEDGE---|---CREDITS + SUBS---|---MANAGED---|
Revenue:     0          500K-3M MNT/mo              3-8M MNT/mo        8-12M MNT/mo
```

### Phase 0: Free Foundation (Months 1-3)
**Revenue:** 0 MNT
**Products:** None
**Gate to exit:** 50+ completed bookings, 20+ verified taskers, 10+ repeat customers

Completely free. Focus on supply density in 3-4 categories (cleaning, plumbing, moving, handyman) across 6-8 UB districts. Founder personally concierges every booking.

**Facebook strategy:** Don't fight Facebook. Build shareable booking links that providers post in groups. Tasky becomes the transaction/trust layer; Facebook remains the discovery layer.

### Phase 1: Trust Layer + B2B Wedge (Months 4-6)
**Revenue target:** 500K-3M MNT/month
**Gate to exit:** 200+ completed bookings, 30+ Pro Profile taskers, 10+ paying business accounts

**Consumer products:**
| Product | Price | Rationale |
|---------|-------|-----------|
| Pro Badge | 9,900 MNT/month | Under 10K psychological threshold. Cheaper than 2 Unegui posts. Positioned as professional standing, not a toll. (Sonnet's insight) |
| Promoted Listing "Онцлох" | 15,000 MNT / 7 days | Familiar from Zar.mn. Low-friction first purchase. (Gemini's insight) |
| Urgent Boost "Яаралтай" | 25,000 MNT / 3 days | Higher visibility, short duration for urgent categories |

**B2B products (parallel track):**
| Product | Price | Target |
|---------|-------|--------|
| Manual concierge (free) | 0 MNT | First 15 business accounts — Airbnb hosts, guesthouses |

**B2B outreach:** Founder manually recruits Airbnb/Booking.com hosts (est. 2,000-3,000 in UB). Offer free concierge matching for the first 2 months. Track fill rate, response time, repeat rate. This is sales, not engineering.

**Engineering effort:** Pro badge (database flag + UI), promoted listing (sort-order + QPay one-time), booking link generator. ~3-4 weeks.

### Phase 2: Lead Credits + B2B Paid (Months 7-10)
**Revenue target:** 3-8M MNT/month
**Gate to exit:** 500+ completed bookings, 50+ credit-purchasing taskers, 20+ paying B2B accounts

**Consumer products (additions):**
| Product | Price | Rationale |
|---------|-------|-----------|
| Lead-unlock credit (Cleaning/Moving) | 1,500 MNT | Low-ticket categories need low credit cost (Opus insight) |
| Lead-unlock credit (Plumbing/Electrical) | 3,000 MNT | Mid-ticket |
| Lead-unlock credit (Renovation/Tutoring) | 5,000 MNT | High-ticket, justified by job value |
| Credit pack (10 credits) | 15% discount | Bulk purchase incentive |
| Signup bonus | 3 free credits | Reduce first-time friction |

**B2B products (conversion):**
| Product | Price | Target |
|---------|-------|--------|
| Host Lite | 99,000 MNT/location/month | Single-unit Airbnb hosts, guesthouses |
| Ops Standard | 249,000 MNT/location/month | Offices, restaurants, heavy hosts |
| Urgent Dispatch | 15,000 MNT per filled urgent job (Lite) / 10,000 (Standard) | On-demand surcharge |

**Supply dependency mechanism:** A cleaner with 3 weekly Airbnb turnovers through Tasky is economically dependent. This changes the marketplace dynamic — the tasker reserves capacity for Tasky's recurring demand, making the platform more reliable for all buyers.

**Engineering effort:** Credit system + QPay recurring. Category-tier pricing logic. B2B billing (QPay links + monthly invoices). ~6-8 weeks.

### Phase 2b: Professional Subscriptions (Months 9-12)
**Revenue target:** 8-12M MNT/month
**Gate to exit:** 6M+ MNT/month for 2 consecutive months

**Consumer products (additions):**
| Product | Price | Includes |
|---------|-------|----------|
| Standard Pro | 9,900 MNT/month | Pro badge, 3 free lead unlocks, priority ranking |
| Premium Pro | 29,000 MNT/month | 10 free unlocks, top-of-category, analytics, portfolio showcase |

**B2B products (expansion):**
| Product | Price | Target |
|---------|-------|--------|
| Multi-Site | 599,000 MNT/company/month | Apartment managers, multi-property hosts (up to 5 locations) |
| Supplier Pro | 79,000 MNT/month | Priority routing for B2B jobs, performance badge |

**Grandfathering:** All taskers from Phase 0 get permanent 5% discount on all future paid products. This creates evangelists.

### Phase 3: Managed Marketplace (Month 12+)
**Revenue target:** 12M+ MNT/month

**New products:**
| Product | Price | Rationale |
|---------|-------|-----------|
| Opt-in Booking Deposit | 3-5% of deposit (capped 15K MNT) | Customer-chosen, not forced. QPay 10-20% deposit for high-value jobs only. |
| Family Plan | 19,900 MNT/month | Priority matching to Pro providers, saved favorites, home service history |
| SMS OTP verification | Infrastructure cost | Revenue now justifies SMS spend |

**Escrow is opt-in, not default.** Customers choose deposit protection for high-value bookings (>300K MNT). This respects Mongolia's pay-on-completion culture while offering a trust upgrade.

---

## 6. Detailed Revenue Projections <a name="revenue-projections"></a>

### Conservative Scenario (Composite Blueprint)

| Month | Phase | Pro Badge | Promoted | Lead Credits | Consumer Subs | B2B Revenue | Total MNT |
|-------|-------|-----------|----------|-------------|---------------|-------------|-----------|
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| 2 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| 3 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| 4 | 1 | 198K | 225K | 0 | 0 | 0 | **423K** |
| 5 | 1 | 297K | 375K | 0 | 0 | 495K | **1.17M** |
| 6 | 1 | 376K | 525K | 0 | 0 | 1.24M | **2.14M** |
| 7 | 2 | 450K | 600K | 600K | 0 | 1.98M | **3.63M** |
| 8 | 2 | 500K | 700K | 1.0M | 0 | 2.97M | **5.17M** |
| 9 | 2b | 550K | 750K | 1.3M | 500K | 3.72M | **6.82M** |
| 10 | 2b | 550K | 800K | 1.5M | 870K | 4.71M | **8.43M** |
| 11 | 2b | 600K | 850K | 1.6M | 1.16M | 5.45M | **9.66M** |
| 12 | 2b | 600K | 900K | 1.7M | 1.45M | 6.20M | **10.85M** |

**Year 1 Total: ~48.3M MNT (~$14,100 USD)**

### Revenue Mix at Month 12
- B2B: 57% (most predictable, lowest churn)
- Lead Credits: 16%
- Consumer Subscriptions: 13%
- Promoted Listings: 8%
- Pro Badges: 6%

### Key Assumptions
- 20 Pro Badge subscribers at month 4, growing to 60 by month 12
- 15 promoted listings/month at month 4, growing to 40 by month 12
- 8 B2B Lite accounts at month 5, 28 Lite + 12 Standard + 4 Multi-Site by month 12
- Lead credit purchasing begins month 7 with 30 active buyers, growing to 60
- Consumer subscriptions begin month 9 with 25 Standard + 10 Premium, growing to 50 Standard + 20 Premium

---

## 7. Key Strategic Decisions <a name="key-decisions"></a>

### Decision 1: Subscription Price — 9,900 MNT, Not 29,000 or 59,000
**Rationale (from Sonnet):** Under 10K MNT feels materially different to a Mongolian consumer. Cheaper than 2 Unegui posts. Positioned as professional standing (Нарантуул stall license), not a tool subscription. At 0.7-1.2% of average monthly income, it's an impulse business expense.

### Decision 2: Category-Tiered Lead Pricing
**Rationale (from Opus):** A cleaner earning 50K MNT per job cannot pay the same unlock fee as a renovation contractor earning 500K. Flat pricing creates negative unit economics for low-ticket categories and leaves money on the table for high-ticket ones.

| Category | Job Value Range | Credit Price | Break-even at 20% conversion |
|----------|----------------|-------------|------------------------------|
| Cleaning/Moving | 40-80K MNT | 1,500 MNT | 7,500 MNT gross/lead — viable |
| Plumbing/Electrical | 80-200K MNT | 3,000 MNT | 15,000 MNT gross/lead — viable |
| Renovation/Tutoring | 200K+ MNT | 5,000 MNT | 25,000 MNT gross/lead — viable |

### Decision 3: B2B-Lite as Parallel Track from Month 4
**Rationale (from Codex):** B2B customers are less price-sensitive, more predictable, lower churn, and — critically — create supply-side dependency. A cleaner with 3 weekly Airbnb turnovers through Tasky IS dependent on the platform, unlike a consumer-only tasker who can always return to Facebook.

### Decision 4: Escrow Is Opt-In, Not Default
**Rationale (unanimous):** Mongolia's trust model is relational and sequential. QPay escrow held by a startup is a categorically different proposition than QPay POS payments. Multiple Mongolian e-commerce failures (2018-2021) created lasting skepticism. Start with optional 10-20% deposits for high-value bookings only.

### Decision 5: Facebook Coexistence, Not Competition
**Rationale (from Sonnet):** Build shareable booking links that providers post in Facebook groups. Facebook has the audience; Tasky has the infrastructure. Tasky becomes the trust/transaction layer that Facebook groups point to.

### Decision 6: Grandfather Early Adopters Permanently
**Rationale (from Gemini):** Phase 0 taskers get permanent 5% discount on all paid products. In a market built on word-of-mouth, these 500 taskers become evangelists. This is the most cost-effective marketing investment possible.

---

## 8. Risks and Mitigations <a name="risks"></a>

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Facebook groups remain primary after 6 months | Critical | High | Don't compete — use Facebook as discovery layer. If Tasky can't differentiate on trust/verification within 6 months, the lead-fee model needs rethinking. |
| B2B segment too small (<20 accounts by month 8) | High | Medium | Expand beyond Airbnb hosts to offices and restaurants faster. Lower Host Lite price to 59K as promotional rate. |
| Lead-fee churn (taskers stop buying credits) | High | High | Category-tiered pricing + free monthly credits for subscribers. Never let lead-fees be the only revenue stream. |
| Seasonal demand volatility (-40C winters) | Medium | Certain | Plan phase transitions around demand peaks (Tsagaan Sar in Jan-Feb, construction season May-Sep). Never launch a new paid product in November. |
| Bank of Mongolia e-money licensing for escrow | High | Medium | Verify requirements before building escrow. Consider partnering with a licensed fintech rather than holding funds directly. |
| Solo developer burnout during Phase 2 engineering | High | High | Decompose Phase 2 ruthlessly. Ship lead-fees + QPay first (2a), defer SMS OTP + DAN + algo matching (2b). Consider hiring part-time when B2B revenue covers cost (~800K MNT/month). |
| Ger district vs apartment district market fragmentation | Medium | High | Start in apartment districts (Bayanzürkh, Sükhbaatar) where digital adoption is highest. Expand to ger districts only after proving model. |
| Taskers exchange phone numbers and bypass platform | High | Certain | Information controls (REQ-LEAK series) help but won't eliminate this. The real defense is making the platform more convenient than direct contact — booking history, reviews, scheduling, and (for B2B) invoicing. |

---

## 9. Sources <a name="sources"></a>

### Mongolia Market Data
- [QPay IPO Preparation — Inside Mongolia](https://insidemongolia.mn/post/faCkurE4JHs) — 3.2M users, 98.6M transactions, ₮4.7T volume
- [Mongolia Digital Payments Forecast — Statista](https://www.statista.com/outlook/dmo/fintech/digital-payments/mongolia) — $6.7B 2025, 14.49% CAGR
- [Digital 2026 Mongolia — DataReportal](https://datareportal.com/reports/digital-2026-mongolia) — 4.97M cellular connections
- [Mongolia Global Findex 2025 — World Bank](https://microdata.worldbank.org/index.php/catalog/7947)
- [NSO Statistical Yearbook 2024](https://www.nso.mn/uploads/1762244920195-Statistical%2520Yearbook%25202024.pdf)
- [UB Airbnb Market Data — Airbtics](https://airbtics.com/annual-airbnb-revenue-in-ulaanbaatar-mongolia)

### Comparable Platforms
- [Thumbtack vs TaskRabbit — YoGigs](https://www.yo-gigs.com/blog/thumbtack-vs-taskrabbit-business-model-comparison/)
- [Marketplace Business Models — Sharetribe](https://www.sharetribe.com/academy/how-to-choose-the-right-business-model-for-your-marketplace/)
- [Recommend.my Pro Model](https://www.recommend.my/join-as-a-pro) — Lead-fee to outcome-based transition
- [SweepSouth MyHome Hub](https://campaign.sweepsouth.com/home-service-management/) — Subscription model for domestic services
- [Jiji Premium Services](https://jiji.ng/faq/22) — Visibility-based monetization in Africa

### Internal References
- Tasky PRD Section 7.5 (Monetization Phased)
- Tasky PRD Section 12.2-12.6 (Phase Roadmap)
- ADR 0001: Liquidity-First MVP and Monetization Deferral

---

*Analysis produced 2026-03-22 via structured four-way AI debate. Two rounds, eight distinct analytical positions, four AI models (Claude Opus 4.6, Claude Sonnet 4.6, Gemini 2.5 Pro, OpenAI Codex o4-mini). All monetary figures in MNT (1 USD ≈ 3,420 MNT as of March 2026).*
