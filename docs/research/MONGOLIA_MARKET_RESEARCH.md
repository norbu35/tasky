# Mongolia Market Research: Tasky Gig Marketplace

_Research date: March 2026. Sources: DataReportal 2024/2025, World Bank, QPay IPO filings,
ESCAP 2024, ILO, Mondaq, Pandectes, NapoleonCat, Macrotrends, Similarweb, and comparable
market analysis._

Status: historical research input. This report preserves earlier recommendations that may conflict with the current
PRD and rollout direction. Use `docs/research/business-model-research.md` for the current business-model synthesis and
governing docs for product scope.

---

## 1. Demographics and Digital Landscape

### Population

| Metric                              | Value                                                 |
| ----------------------------------- | ----------------------------------------------------- |
| Mongolia total population (2024)    | 3,493,629                                             |
| Ulaanbaatar metro population (2024) | ~1,699,000 (~49% of country)                          |
| Urban/rural split (national)        | 70% urban, 30% rural                                  |
| Ger district residents (UB)         | ~60% of UB population live in unplanned ger districts |

Urbanisation has accelerated since the 1991 transition due to dzud climate disasters, mining
expansion, and economic pull toward UB. Ger district residents represent a large pool of
informal labour and price-sensitive consumers — the core Tasker supply.

### Internet and Smartphone

| Metric                         | Value                                                |
| ------------------------------ | ---------------------------------------------------- |
| Internet penetration (2024)    | 83.9% — 2.91M users                                  |
| Internet penetration (2025)    | 83.0% — 2.90M users (stable)                         |
| Smartphone penetration         | 85% (2024)                                           |
| Active mobile SIM connections  | 4.92M — 141% of population (many hold multiple SIMs) |
| Mobile connections on 3G/4G/5G | 92%                                                  |
| Median mobile internet speed   | 15.49 Mbps (cellular, Jan 2024)                      |

### Social Media

| Metric                                     | Value                                |
| ------------------------------------------ | ------------------------------------ |
| Social media users (Jan 2025)              | 2.60M — 74.4% of population          |
| Social media penetration of internet users | 89.6%                                |
| **Facebook users (April 2024)**            | **~3.0M — ~88% of total population** |
| TikTok users                               | 121,310 (87.9% aged 18-24)           |
| Instagram                                  | Growing; +100K users YoY Jan 2025    |
| LinkedIn                                   | 330,000 members                      |

**Key insight:** Facebook's near-total dominance (88%+ of population) is the defining feature
of Mongolia's digital landscape. Facebook groups function as de facto classifieds, job boards,
and informal service marketplaces. Any new platform must compete with or work through
Facebook-native behaviour.

### Income and Wages

| Metric                                  | Value                         |
| --------------------------------------- | ----------------------------- |
| Average monthly salary (2024)           | ~MNT 2,000,000 (~$436 USD)    |
| Average monthly salary (2025 NSO)       | MNT 2,479,600 (~$720 USD)     |
| Minimum wage (from Jan 1, 2025)         | MNT 792,000 (~$230 USD/month) |
| Average household monthly income (2025) | MNT 1,800,000                 |
| Shadow/informal economy                 | ~10–17% of GDP                |

Implied informal day rates for unskilled labour (cleaning, moving): MNT 20,000–50,000/day
(~$6–15). Skilled trades (plumbers, electricians): MNT 50,000–150,000/day (~$15–43).

### Youth Unemployment

| Metric                                | Value                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Youth unemployment rate (15-24, 2024) | **13.8%** (up from 12.33% in 2023)                                         |
| Overall unemployment rate             | 5.0%                                                                       |
| Informal employment persistence       | ILO: avg. worker in informal employment for 11.8 years; 64.8% for ≥8 years |

The ger district population — rural migrants after dzuds — represents a large underemployed
labour pool. No formalized gig platform currently captures this supply.

---

## 2. Payment Infrastructure

### QPay

| Metric                            | Value                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Registered users                  | **3.2M** (~91% of adults)                                                       |
| Connected merchants               | **200,000+**                                                                    |
| Transaction volume (Jan–Oct 2024) | 98.6M transactions — MNT 4.7 trillion (~$1.37B USD)                             |
| Bank integration                  | 12 commercial banks                                                             |
| IPO                               | December 4, 2024 on Mongolian Stock Exchange; revenue grew 15.6x from 2019–2022 |

QPay is not a feature add — it is the payment rail of the Mongolian economy. For a gig
marketplace, QPay integration is mandatory infrastructure, not optional.

### Other Payment Apps

| App                     | Notes                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| SocialPay (Golomt Bank) | Founded 2017; 93% of Golomt total transactions now digital; launched Junior (ages 7–18) in 2024 |
| Monpay                  | Independent wallet; merchant QR acceptance                                                      |
| Khan Bank mobile        | One of two largest bank-owned platforms; partnered with Alipay+ (June 2024)                     |

### Bank Account and Digital Penetration

| Metric                            | Value                                     |
| --------------------------------- | ----------------------------------------- |
| Bank account penetration (14+)    | **99%**                                   |
| Mobile banking accounts           | 58.8% of population                       |
| E-commerce market size (2024)     | $412.8M projected                         |
| Digital payments CAGR (2025–2028) | 14.49% — projected $10.05B market by 2028 |
| Online purchasers                 | 42% of population                         |

---

## 3. Gig and Informal Labour Market

### How People Currently Find Domestic Services

1. **Facebook groups** — primary discovery channel. Requests posted publicly; workers respond
   in comments/DMs. No escrow, no reviews, no verification, no dispute resolution.
2. **Unegui.mn** — dominant classifieds site. Listings-based, not transactional.
3. **Personal referrals** — most trusted channel for in-home services.

### Unegui.mn

| Metric            | Value                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Monthly visitors  | 1.5M (in a 3.5M population country)                                                                                      |
| Traffic rank      | #5 in Mongolia; #803 globally in classifieds                                                                             |
| Owner             | Cyprus-based Larixon Classifieds                                                                                         |
| Founded           | 2017                                                                                                                     |
| April 2025 update | Integrated E-Mongolia DAN identity verification — sets precedent for marketplace platforms using state ID infrastructure |

**Key limitation:** No real-time booking, no payment processing, no escrow, no robust review
system, no worker vetting. It is a notice board, not a marketplace.

### Existing Platforms

- **UBCab** — Mongolia's dominant ride-hailing app. 70,000+ registered users. Closest analog
  to a functional gig marketplace: demonstrates app-based labour matching works in this market.
- **Shoppy.mn** — product e-commerce, not services.
- **No identifiable on-demand home services platform** comparable to Urban Company, Handy, or
  TaskRabbit currently operating in Mongolia. This is the gap.

---

## 4. Consumer Behaviour and Trust Patterns

### Relationship-Driven Culture

Mongolia has a deeply relationship-driven culture rooted in nomadic traditions:

- **Trust is earned through relationships, not institutions.** Personal introductions carry
  far more weight than anonymous reviews.
- **Word-of-mouth is the dominant trust signal** for hiring service workers.
- **Third-party introductions** — being referred by a known contact significantly increases
  willingness to transact.

**Implication:** Early adopters recruited through personal networks convert at much higher
rates than cold digital acquisition. Tasker referral programs are culturally aligned, not just
a growth tactic.

### Tech Adoption Drivers

Research on Mongolian e-commerce adoption identifies: perceived usefulness, personal
innovativeness, and self-efficacy as the three key adoption factors. Users with higher
tech confidence adopt faster.

### Price Sensitivity and Negotiation

- Informal service market currently priced through direct negotiation (Facebook, referrals)
- High price sensitivity — average monthly wages are $436–$720, so service pricing must
  reflect local purchasing power
- A fixed-price transparent model (Urban Company style) could be experienced as a relief
  from negotiation friction rather than a constraint

### ID Verification and Data Sharing

- Mongolia has a biometric smart ID card (updated 2022) with fingerprint and facial recognition
- **E-Mongolia platform:** 606 digital government services across 59 agencies — mature digital
  identity infrastructure
- **Law on Protection of Personal Information** (effective May 1, 2022): comprehensive data
  privacy law covering all entities in Mongolia. Sensitive category data (biometric, genetic)
  requires explicit written consent.
- High relative trust in government-backed digital identity (E-Mongolia adoption at scale)

---

## 5. Regulatory Environment

### Gig Work

No dedicated gig economy or marketplace platform law as of 2024. The Civil Code governs
independent contractor relationships.

**Critical labour law risk:** If an independent contractor relationship with the same platform
exceeds **2 years cumulatively**, the Labour Code can deem it a permanent employment
relationship — triggering employee benefits and social insurance obligations.

**Freelancer tax:** Self-employed individuals pay 1% social insurance (vs. full employee
contributions). Annual tax return due February 15. Low compliance burden for taskers.

### Data Privacy

Full compliance required for a platform collecting biometric ID data, location, payment,
and personal ratings. Regulators: National Human Rights Commission + Ministry of Digital
Development, Innovation, and Communications.

---

## 6. Competitor Landscape

| Player                    | Type                         | Relevance                                                |
| ------------------------- | ---------------------------- | -------------------------------------------------------- |
| UBCab                     | Ride-hailing gig marketplace | Direct analog — proves app-based labour matching works   |
| Unegui.mn                 | Classifieds                  | Dominant but structurally limited; no booking or payment |
| Facebook groups           | Informal marketplace         | Primary incumbent; zero trust infrastructure             |
| No home services platform | Gap                          | First-mover opportunity exists                           |

Mongolia has 50 B2C e-commerce startups total; 8 funded; 2 with Series A+ — early-stage
ecosystem with limited capital.

### TaskRabbit in Comparable Markets

- **Japan failure:** The American model failed — Japanese consumers preferred personally
  referred tradespeople. Cultural dynamics (relationship primacy, face-to-face trust) closely
  match Mongolia.
- **General lesson:** Platforms that applied standardised Western models without local market
  research failed. Local cultural dynamics must drive product decisions.
- **Current TaskRabbit model:** 15% tasker commission + 7.5% client fee; ~$75M annual revenue
  (2025); 200,000+ taskers globally.

### Most Relevant Analog: Urban Company (India)

- Started as lead-gen; pivoted to full-stack service delivery ownership
- Initial cold start: personal investment + 500+ daily requests and 1,000+ professionals
  within months
- **Key decision:** Focused on one category first (beauty) before expanding to
  handyman/cleaning/repair
- **City-by-city expansion:** Started Delhi; now 45+ cities
- **Critical insight:** Light-touch lead-gen model failed; full-stack model with quality
  standards succeeded. This is likely the correct model for Mongolia where baseline quality
  standards are undefined.

---

## 7. Cold-Start Strategies That Worked in Similar Markets

### Proven Framework

**Fundamental rule (Andrew Chen / Reforge):** Constrain by geography OR by category. Do not
try to cover all of UB in all service categories simultaneously. Supply-side first — buyers
will wait for supply; supply will not wait for buyers.

### Airbnb Emerging Market Playbook

- Original cold start: scraped Craigslist for existing listings; cold-emailed to dual-list.
  **Directly applicable:** identify active providers in Facebook groups and Unegui.mn; recruit
  as first-wave taskers.
- Modern playbook: localised app, local payment options, streamlined onboarding.

### inDrive (Highly Relevant)

- Operates in Central Asian, South Asian, LatAm markets with trust dynamics similar to Mongolia
- Key differentiator: allows negotiated pricing rather than algorithm-set fares — designed for
  haggling cultures
- Raised $150M February 2023; operates in 1,065 cities across 48 countries by early 2026

### Post-Soviet Market Dynamics

- Domestic founders have legitimacy advantages foreign platforms cannot replicate
- Low institutional trust but high personal network trust — platforms that bridge this gap
  (providing trust infrastructure that informal channels lack) succeed
- Geographic constraint works in post-Soviet cities: UB is a single dense city of 1.7M with
  concentrated professional consumers in apartment districts and a large labour pool in ger
  districts

---

## 8. Key Numbers Summary

| Metric                                 | Value                      |
| -------------------------------------- | -------------------------- |
| Ulaanbaatar population                 | 1.7M                       |
| Mongolia total population              | 3.5M                       |
| Smartphone penetration                 | 85%                        |
| Internet penetration                   | 83.9%                      |
| Facebook penetration                   | ~88% of population         |
| QPay users                             | 3.2M                       |
| QPay transaction volume (Jan–Oct 2024) | MNT 4.7 trillion (~$1.37B) |
| Bank account penetration (14+)         | 99%                        |
| Average monthly wage                   | ~$436–720 USD              |
| Minimum monthly wage                   | ~$230 USD                  |
| Youth unemployment (15–24)             | 13.8%                      |
| E-commerce market (2024)               | $412.8M                    |
| Digital payments CAGR (2025–2028)      | 14.49%                     |
| Online purchasers (% of population)    | 42%                        |
| Gig market leader (home services)      | None — gap exists          |

---

## 9. PRD Review: Gaps and Recommendations

### What the PRD Gets Right

- Facebook OAuth as primary consumer auth (88%+ FB penetration validates this)
- 6-category launch constraint (correct cold-start discipline)
- Push notifications as supply trigger (correct for ger district labour pool)
- Mongolian language as default
- Manual ID verification for taskers (correct given no public API to national ID registry —
  though E-Mongolia DAN integration is now production-ready per Unegui.mn's April 2025 launch)

### Critical Gaps

#### 1. QPay deferral is the single largest strategic error

Off-platform cash settlement in Phase 1 makes Tasky structurally identical to a Facebook
group — better UX, same trust level. The core value proposition is _trust_, and without
payment infrastructure, the trust differential is cosmetic.

**Fix:** Integrate QPay in MVP Phase 1 at 0% platform fee. Escrow-held QPay payment creates
a fundamentally different trust proposition from day one.

#### 2. Facebook OAuth excludes a large portion of the supply side

Blue-collar workers from ger districts and craftsmen are phone-number-first digital identities.
Facebook OAuth creates an unnecessary barrier on the supply side. SMS OTP should be the
primary Tasker auth path.

#### 3. Admin verification bottleneck will kill supply growth

Manual review with no defined SLA creates an unpredictable supply queue. If admin can process
20 verifications/day and 200 people apply in week one, motivated early taskers abandon the
queue.

**Fix:** Define explicit SLA (< 24h target). Consider E-Mongolia DAN self-verification as a
fast path. Properly spec admin tooling — it is the supply growth bottleneck, not a secondary
concern.

#### 4. No supply acquisition strategy in the PRD

Every successful two-sided marketplace led with supply acquisition strategy before product
features. The PRD specifies the product for taskers but not how they get onto the platform.

**Add:** Tasker referral program, phone-first onboarding flow, concierge first-cohort
onboarding (assisted registration for first 50 taskers).

#### 5. Review system too passive

"Able to review" ≠ reviews actually happen. In high-context cultures with face-saving norms,
voluntary review completion rates are < 40% and ratings inflate to 5 stars regardless of
quality. Reviews that aren't happening don't build trust.

**Fix:** Make review submission a required step to unlock next booking for both parties.

#### 6. Seasonal demand not accounted for

- **Tsagaan Sar** (Jan–Feb): peak cleaning demand — the most important consumer moment in
  the Mongolian calendar
- **Spring thaw** (Apr–May): secondary cleaning + maintenance surge
- **Summer:** demand drop; supply drop as workers return to rural areas seasonally

Launch timing before Tsagaan Sar is the highest-leverage timing decision the platform can
make.

#### 7. Platform leakage risk underestimated

The risk appears in the PRD but its mechanism is underanalysed. Off-platform leakage is
triggered by: (a) both parties having each other's contact details, and (b) the introduction
of a take rate.

**Fix:** Never expose tasker phone numbers — in-app messaging only. Exact location revealed
only after payment commitment. Do not introduce take rate until repeat booking rate is high.

#### 8. Labour law 2-year contractor conversion threshold not addressed

Taskers who engage with the platform for 2+ cumulative years can be reclassified as employees
under Mongolian labour law. Product/legal must design around this from the start.

#### 9. No referral program

Given Mongolia's relationship-driven trust culture, referral programs are not just growth
tactics — they are culturally aligned supply acquisition. Not mentioned anywhere in the PRD.

#### 10. Small market size not addressed

UB has ~1.7M people, ~500K–600K households. At 5% penetration in Year 2: ~30,000 bookings/
month. At MNT 50,000 avg task value and 10% take rate: ~$43,000/month revenue. This is a
very small number. The PRD needs a path from liquidity validation to viable business —
either through higher market penetration, city 2 expansion (Darkhan, Erdenet), or a move
up-market to higher-value services (renovation, electrical).

### Risk Register

| Risk                                                                | Likelihood | Impact   | In PRD  |
| ------------------------------------------------------------------- | ---------- | -------- | ------- |
| QPay deferral makes platform indistinguishable from Facebook groups | High       | Critical | No      |
| Admin verification bottleneck kills supply growth                   | High       | High     | No      |
| Facebook API policy change breaks sole auth mechanism               | Medium     | Critical | No      |
| 2-year labour law contractor reclassification                       | Low–Medium | High     | No      |
| Leakage spike at Phase 3 take rate introduction                     | High       | High     | Partial |
| Seasonal demand collapse in summer                                  | High       | Medium   | No      |
| Rating inflation in high-context culture                            | High       | Medium   | No      |
| Market too small for scale without expansion plan                   | High       | High     | No      |
| E-Mongolia DAN verification makes manual verification obsolete      | Medium     | Medium   | No      |
| No review completion enforcement → hollow trust system              | High       | High     | No      |

### Business Model Phase Assessment

| Phase                                            | Assessment                             | Key Issue                                                                                              |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Phase 1 — 0% commission, off-platform settlement | Partially correct                      | Off-platform settlement undermines trust proposition; QPay at 0% fee is superior                       |
| Phase 2 — Pro Badge, Priority Matching           | Direction correct, mechanism undefined | Who does background check? What is the pricing? No implementation path specified                       |
| Phase 3 — Take rate 10–15%                       | Standard model                         | Timing risk: take rate triggers leakage if habit not formed; don't introduce until repeat rate is high |
| Phase 4 — Subscriptions + B2B                    | Correct long-term direction            | Premature for planning; focus on Phase 1–2 execution quality                                           |

### Top Recommendations

1. Bring QPay escrow into Phase 1 (0% platform fee, but payment through platform)
2. Make SMS OTP the primary Tasker registration path; keep Facebook OAuth for Customers
3. Define admin verification SLA (< 24h); spec admin tooling properly
4. Never expose contact details — in-app messaging only; location revealed only after payment
5. Make post-booking reviews mandatory (gate next action on completion)
6. Add Tsagaan Sar as a named product milestone in the go-to-market plan
7. Add Tasker and Customer referral programs as MVP features
8. Investigate E-Mongolia DAN integration for self-service verification fast path
9. Define quantitative liquidity targets by district and category
10. Plan city 2 expansion path in Year 2 as the revenue scaling answer to small market size
