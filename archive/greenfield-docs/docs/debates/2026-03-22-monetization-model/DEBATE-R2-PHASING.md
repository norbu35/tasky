# Tasky Monetization Phasing Debate — Round 2

**Date:** 2026-03-22
**Topic:** What is the optimal monetization phasing model for Tasky, transitioning from trust/liquidity to sustainable revenue in Mongolia?

**Participants:**
| Role | Model | Blueprint |
|------|-------|-----------|
| Hybrid Model | Claude Opus 4.6 | Lead-fees + subscriptions + visibility, category-tiered |
| Subscription-First | Claude Sonnet 4.6 | Provider subscriptions only, no lead-fees |
| Modified PRD | Gemini 2.5 Pro | Existing phases + promoted listings bridge |
| B2B-Lite First | OpenAI Codex (o4-mini) | Business customers as monetization wedge |

---

## Head-to-Head Comparison

### Phase Structure

|                        | Hybrid (Opus)                     | Subscription-First (Sonnet) | Modified PRD (Gemini)         | B2B-Lite (Codex)              |
| ---------------------- | --------------------------------- | --------------------------- | ----------------------------- | ----------------------------- |
| **Phase 0**            | Free (months 1-3)                 | Free (months 1-3)           | Free (months 1-2)             | Free concierge (months 1-2)   |
| **First revenue**      | Month 4 (visibility)              | Month 4 (9,900 MNT badge)   | Month 3 (lead fees)           | Month 5 (B2B subs)            |
| **Lead-fees?**         | Yes, category-tiered (months 6-9) | No, never                   | Yes, 5,000 MNT flat (month 3) | No                            |
| **Subscriptions?**     | Yes, 29K/59K (months 9-12)        | Yes, 9.9K/24.9K (months 4+) | Yes, 100K (month 10+)         | Yes, 99K-599K B2B (months 5+) |
| **Escrow?**            | Opt-in deposit (month 12+)        | Not in first 18 months      | Opt-in 3% (month 10+)         | Not needed (B2B invoicing)    |
| **Customer-side fee?** | Not yet                           | Family Plan 19.9K (Phase 3) | Escrow fee 3%                 | Not in year 1                 |

### Revenue Projections (12 Months)

| Month            | Hybrid (Opus) | Subscription (Sonnet) | Modified PRD (Gemini) | B2B-Lite (Codex) |
| ---------------- | ------------- | --------------------- | --------------------- | ---------------- |
| 1                | 0             | 0                     | 0                     | 0                |
| 2                | 0             | 0                     | 0                     | 0                |
| 3                | 0             | 0                     | 375K                  | 0                |
| 4                | 300K          | 198K                  | 1.25M                 | 0                |
| 5                | 600K          | 277K                  | 2.5M                  | 1.44M            |
| 6                | 980K          | 376K                  | 3.76M                 | 2.68M            |
| 7                | 1.8M          | 495K                  | 4.39M                 | 4.37M            |
| 8                | 2.4M          | 614K                  | 5.0M                  | 6.91M            |
| 9                | 3.0M          | 772K                  | 6.76M                 | 9.20M            |
| 10               | 3.9M          | 1.24M                 | 10.05M                | 12.04M           |
| 11               | 4.7M          | 1.64M                 | 12.25M                | 14.53M           |
| 12               | 6.0M          | 2.07M                 | 15.1M                 | 18.40M           |
| **Year 1 Total** | **~23.7M**    | **~7.7M**             | **~61.4M**            | **~69.6M**       |

### Key Pricing Decisions

| Product          | Hybrid                   | Subscription | Modified PRD | B2B-Lite                  |
| ---------------- | ------------------------ | ------------ | ------------ | ------------------------- |
| Visibility boost | 15-49K MNT               | N/A          | 10-15K MNT   | N/A                       |
| Lead unlock      | 1.5-5K MNT (by category) | N/A          | 5K MNT flat  | N/A                       |
| Basic sub        | 29K MNT/mo               | 9.9K MNT/mo  | 100K MNT/mo  | 79K MNT/mo (Supplier Pro) |
| Premium sub      | 59K MNT/mo               | 24.9K MNT/mo | N/A          | N/A                       |
| B2B entry        | N/A                      | N/A          | N/A          | 99K MNT/location/mo       |
| B2B premium      | N/A                      | N/A          | N/A          | 599K MNT/company/mo       |

---

## Critical Analysis of Each Blueprint

### Hybrid Model (Opus) — "No Single Failure Point"

**Strengths:**

- Most resilient — if any revenue stream underperforms, others compensate
- Category-tiered lead pricing (1.5K cleaning vs 5K renovation) solves Round 1's unit economics problem
- Earliest revenue from familiar product (promoted listings, month 4)
- Subscription arrives naturally as an upgrade for heavy credit buyers

**Weaknesses:**

- Most complex to build — 5 distinct monetization products for a solo dev
- Risk of confusing users with too many payment options
- Revenue projections are conservative (6M MNT at month 12)
- Doesn't solve supply-side dependency

### Subscription-First (Sonnet) — "Status Over Transactions"

**Strengths:**

- Deepest cultural reasoning — "Нарантуул stall" analogy is brilliant and true
- 9,900 MNT price point is psychologically optimized for Mongolia
- Simplest engineering (subscription billing + badge = 3-4 weeks)
- Facebook coexistence strategy (shareable booking link) is pragmatic and specific
- Revenue follows trust, not the reverse

**Weaknesses:**

- Slowest revenue ramp (2M MNT at month 12 — barely covers infrastructure)
- Requires 1,500+ active providers before meaningful revenue, but UB supply may cap earlier
- No mechanism to create tasker dependency on the platform
- Family Plan (customer subscription) delayed until Phase 3 — could be 18+ months out
- Solo developer may not survive 12 months of near-zero revenue

### Modified PRD (Gemini) — "Proven Structure, Adjusted Gates"

**Strengths:**

- Highest early revenue (375K at month 3, 15M at month 12) due to aggressive lead-fee introduction
- Most familiar structure — builds on existing PRD, reducing strategic risk
- "Онцлох" / "Яаралтай" promoted listing naming is culturally precise
- Grandfathering clause (5% permanent discount for Phase 0 taskers) is strong retention play
- 5 free leads/month cushion softens the Facebook comparison

**Weaknesses:**

- Revenue projections assume 3,000 active taskers at month 12 — very aggressive for UB
- 5,000 MNT flat lead fee doesn't account for category variation (cleaning vs renovation)
- Introduces lead fees at month 3 — potentially too early before trust is established
- Escrow at month 10 may still be premature per Round 1 consensus
- 100K MNT/month subscription is 3-10x higher than other proposals — may limit adoption

### B2B-Lite First (Codex) — "Monetize Business Continuity"

**Strengths:**

- Highest total year-1 revenue projection (69.6M MNT) — most optimistic but backed by specific math
- Creates genuine supply-side dependency (cleaner with 3 weekly Airbnb turnovers IS dependent)
- B2B customers are less price-sensitive, more predictable, lower churn
- Avoids the Facebook competition entirely (businesses don't post in Facebook groups)
- Solves Round 1's biggest criticism: dependency before monetization
- Specific UB segment sizing (2-3K Airbnb hosts, 1.5-2.5K restaurants)

**Weaknesses:**

- Requires a different GTM motion — B2B sales (manual outreach) vs consumer viral growth
- Solo developer must be salesperson, support, AND engineer simultaneously
- 48 Lite + 20 Standard + 8 Multi-Site accounts by month 12 is optimistic for direct sales
- Consumer marketplace becomes secondary — may never build the consumer brand
- If B2B wedge doesn't reach 20 accounts by month 6, no fallback revenue

---

## Synthesis: What Actually Works in Mongolia

### Points of Universal Agreement (All 4 Models)

1. **Free phase is non-negotiable** — all start with 0 MNT
2. **Commission model is dead** — none propose it
3. **QPay is the only payment rail** — unanimous
4. **Escrow is late-stage or opt-in** — no model forces it before month 10
5. **Grandfathering early adopters is essential** — Mongolian loyalty economics

### The Winning Combination

No single model is optimal alone. The best strategy **cherry-picks across all four:**

**From Sonnet:** The 9,900 MNT subscription price point and the cultural framing as "professional standing" (Нарантуул stall analogy). Start subscriptions early and cheap.

**From Opus:** Category-tiered lead pricing and the multi-revenue-stream resilience. Don't depend on one mechanism.

**From Gemini:** Promoted listings as the bridge product ("Онцлох" / "Яаралтай"). This is the lowest-friction first purchase in Mongolia.

**From Codex:** B2B-lite as a parallel track. Don't wait for Phase 4 — start manual B2B outreach to Airbnb hosts in month 2, convert to paid in month 5. This creates the supply dependency that consumer-side monetization cannot.

### Recommended Phasing: The Composite Blueprint

| Phase               | Months | Revenue Products                                   | Target MNT/mo |
| ------------------- | ------ | -------------------------------------------------- | ------------- |
| **0: Free**         | 1-3    | None                                               | 0             |
| **1: Trust Layer**  | 4-6    | Pro Badge (9,900/mo) + Promoted Listings (15-49K)  | 500K-1.5M     |
| **1b: B2B Wedge**   | 4-8    | Manual B2B concierge → Host Lite (99K/location/mo) | 500K-3M       |
| **2: Lead Credits** | 7-10   | Category-tiered unlocks (1.5-5K) alongside subs    | 2-5M          |
| **2b: Pro Tiers**   | 9-12   | Standard (9.9K) + Pro (29K) + B2B Standard (249K)  | 5-10M         |
| **3: Managed**      | 12+    | Opt-in deposit escrow + Family Plan (19.9K)        | 10M+          |

**12-month target: 8-12M MNT/month from diversified streams**

### The Decisive Factor: Supply Dependency

Round 1's most important finding was that **the missing ingredient in all emerging market marketplace failures is supply-side dependency before monetization**. Codex's B2B model is the only one that directly solves this:

> "A cleaner who gets random leads from Facebook is not dependent.
> A cleaner who gets three Airbnb turnovers every week through Tasky is dependent."

This single insight should reshape the PRD. Consumer monetization and B2B monetization should run in parallel, with B2B creating the dependency flywheel that makes consumer monetization viable.

---

## Scoring

| Criterion            | Hybrid (Opus) | Subscription (Sonnet) | Modified PRD (Gemini) | B2B-Lite (Codex) |
| -------------------- | ------------- | --------------------- | --------------------- | ---------------- |
| Cultural fit         | 8/10          | 10/10                 | 8/10                  | 7/10             |
| Revenue realism      | 7/10          | 5/10                  | 6/10                  | 7/10             |
| Solo dev feasibility | 6/10          | 9/10                  | 7/10                  | 7/10             |
| Supply dependency    | 5/10          | 5/10                  | 4/10                  | 10/10            |
| Resilience           | 9/10          | 6/10                  | 7/10                  | 6/10             |
| Actionability        | 8/10          | 9/10                  | 7/10                  | 8/10             |
| **Total**            | **43/60**     | **44/60**             | **39/60**             | **45/60**        |

## Winner: B2B-LITE FIRST (Codex) — by 1 point over Subscription-First (Sonnet)

Codex wins because it directly addresses the structural weakness all other models share: **how do you create supply-side dependency in a market where Facebook gives leads for free?** The answer is recurring business demand, not better consumer matching.

However, the **Composite Blueprint** (combining all four) scores highest conceptually because it eliminates single points of failure. The recommended approach: run B2B-lite and consumer subscriptions in parallel from month 4.

---

_Debate Round 2 conducted 2026-03-22. Four AI models with distinct monetization blueprints. All monetary figures in MNT (1 USD ≈ 3,420 MNT)._
