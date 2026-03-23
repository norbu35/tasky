# Monetization Phasing & B2B Lite Advancement — Design Spec

**Date:** 2026-03-22
**Scope:** PRD updates + new ADR. No code changes.
**Origin:** Four-way AI debate analysis (`docs/debates/2026-03-22-monetization-model/MONETIZATION-STRATEGY-ANALYSIS.md`) synthesized through multi-turn design review.

---

## 1. Context

The current PRD (docs/PRD.md) defines four monetization phases:

- Phase 0-1: Free (direct settlement)
- Phase 2: Lead-fee credits
- Phase 3: Subscription + escrow
- Phase 4: Recurring revenue & expansion (includes B2B)

A structured four-way AI debate (Claude Opus, Claude Sonnet, Gemini 2.5 Pro, OpenAI Codex o4-mini) identified three structural gaps:

1. **Zero-revenue gap between Phase 0-1 and Phase 2.** No revenue products exist until lead credits ship. Promoted listings and boost products can bridge this gap with minimal engineering.
2. **B2B placed too late.** Phase 4 delays the one mechanism that creates supply-side dependency — B2B recurring demand. A tasker with 3 weekly Airbnb turnovers through Tasky is economically locked in; a consumer-only tasker can always return to Facebook.
3. **Flat lead pricing is wrong.** A cleaner earning 50K MNT per job cannot pay the same unlock fee as a renovation contractor earning 500K. Category-tiered pricing fixes unit economics for low-ticket categories.

Additionally, the design review identified a naming collision between the earned Pro Badge (trust marker) and the proposed paid subscription. This spec separates them cleanly.

---

## 2. Decisions

### 2.1 Advance B2B Lite from Phase 4 to Phase 2-3

B2B Lite (Shape A — bulk-buyer subscriptions for Airbnb hosts, offices, restaurants) moves from Phase 4 to Phase 2-3. The domain model (accounts, locations, members, task tagging, priority dispatch) ships in Phase 2. Subscription billing ships in Phase 3 alongside the consumer subscription infrastructure.

B2B Managed (Shape B — recurring scheduling, SLA guarantees, PMS integrations) remains Post-Phase 4, contingent on Shape A validation.

**Timing:**
- Months 5-6: Founder sales outreach to Airbnb/Booking.com hosts (no engineering)
- Months 6-7: Manual B2B concierge for 5-10 host accounts (no engineering)
- Months 8-10: B2B system module ships (Phase 2 engineering)
- Phase 3: B2B subscription billing goes live

**Why not month 4 (per debate recommendation):** Supply density is insufficient (~20 verified taskers, ~50 completed bookings). B2B tasks (Airbnb turnovers) have hard deadlines that require reliable supply. Two more months provides reliability data on top taskers. Founder bandwidth is also consumed by Phase 2 engineering (promoted listings, lead credits).

**Why not month 12 (current PRD):** Twelve months of consumer-only operation lets supply become independent. Taskers build direct client relationships through Tasky introductions and no longer need the platform. The supply dependency argument requires B2B demand before this happens.

### 2.2 Add promoted listings and urgent boosts to Phase 2

Promoted listings ("Онцлох") and urgent boosts ("Яаралтай") are familiar monetization patterns in Mongolia (Zar.mn uses them). They ship early in Phase 2 (months 4-6), before lead credits, as the lowest-engineering-cost revenue products.

### 2.3 Category-tiered lead credit pricing

Replace flat lead-unlock pricing with category tiers calibrated to job value:

| Category | Job Value Range | Credit Price | Break-even at 20% conversion |
|----------|----------------|-------------|------------------------------|
| Cleaning/Moving | 40-80K MNT | 1,500 MNT | 7,500 MNT gross/lead |
| Plumbing/Electrical | 80-200K MNT | 3,000 MNT | 15,000 MNT gross/lead |
| Renovation/Tutoring | 200K+ MNT | 5,000 MNT | 25,000 MNT gross/lead |

### 2.4 Separate Pro Badge (earned) from Tasky Pro Subscription (paid)

- **Pro Badge** remains an earned trust marker (>15 completed jobs, >4.5 avg rating). Free. Already implemented in `BadgeEvaluationService.java`. Unchanged.
- **Tasky Pro Subscription** is a paid product in Phase 3 that requires the earned Pro Badge as an eligibility gate. Two tiers:
  - Standard: 9,900 MNT/month (3 free lead unlocks, priority ranking)
  - Premium: 29,000 MNT/month (10 free lead unlocks, top-of-category placement, analytics dashboard, portfolio showcase)

The earned badge is the trust layer. The subscription is the monetization layer. Only proven taskers can subscribe.

### 2.5 Escrow is opt-in, not default

REQ-PAY-32 changes from "Customer pays at booking confirmation" (implying default) to opt-in for bookings above a configurable threshold (initial: 300K MNT). Respects Mongolia's pay-on-completion culture while offering deposit protection for high-value jobs.

### 2.6 Lower Phase 3 revenue gate

From 12M MNT/month for 3 consecutive months to 6M MNT/month for 2 consecutive months. The debate analysis showed 12M from lead-fees alone is unrealistic for the addressable market. With diversified revenue (promoted listings + lead credits + B2B), 6M is achievable and sufficient to justify Phase 3 complexity.

### 2.7 Grandfathering early adopters

Phase 0 taskers who complete 5+ bookings before monetization launch receive a permanent 5% discount on all future paid products (subscriptions, credit packs). Implemented as a flag on user profile.

---

## 3. PRD Changes — Section 3 (Deferred Items Table)

**File:** `docs/PRD.md`, line ~113

Replace:

```
| B2B recurring service products                 | Phase 4      |
```

With:

```
| B2B Lite (bulk-buyer subscriptions)            | Phase 2      |
| B2B Managed (SaaS platform, Shape B)           | Post-Phase 4 |
```

---

## 4. PRD Changes — Section 7.5 (Monetization Phased)

### 4.1 Phase 2 additions

**File:** `docs/PRD.md`, after line ~392 (after Phase 2 Credit System Requirements block)

Insert new subsection:

```markdown
##### Phase 2 Promoted Listings & Visibility Products

* **REQ-PAY-23**: **Promoted Listing "Онцлох"**: Task owners MAY purchase a 7-day
  visibility boost at 15,000 MNT via QPay one-time payment. Promoted tasks receive
  a sort-order boost in category feed and a visual "Онцлох" label. Maximum one
  active promotion per task. Feature-gated behind `promoted_listings_enabled` toggle.
* **REQ-PAY-24**: **Urgent Boost "Яаралтай"**: Task owners MAY purchase a 3-day
  high-priority boost at 25,000 MNT via QPay one-time payment. Urgent tasks appear
  above promoted tasks in feed and push notifications. Visual "Яаралтай" label.
  Feature-gated behind `promoted_listings_enabled` toggle.

##### Phase 2 B2B Lite (Domain Model)

B2B Lite targets Airbnb/Booking.com hosts, offices, and restaurants as high-volume
bulk buyers of the existing marketplace. B2B tasks reuse the standard task/booking
flow — B2B is a thin coordination layer, not a parallel system.

* **REQ-PAY-25**: **Business Accounts**: System MUST support business account
  registration with: account name, owner (FK → users, CUSTOMER role), locations
  (label, address, PostGIS coordinates), and members (OWNER, MANAGER roles).
  Business account CRUD is feature-gated behind `b2b_enabled` toggle.
* **REQ-PAY-26**: **B2B Task Tagging & Priority Dispatch**: Tasks created by
  business members on behalf of a business account MUST be tagged with
  `business_account_id`. B2B tasks receive a configurable priority weight boost
  in the matching/ranking algorithm. The standard task/booking flow is reused —
  no separate B2B booking path. Business members can list all tasks for their
  account.
* **REQ-PAY-27**: **Category-Tiered Lead Credit Pricing**: Lead-unlock credit
  cost MUST vary by category tier. Initial tiers: Cleaning/Moving 1,500 MNT,
  Plumbing/Electrical 3,000 MNT, Renovation/Tutoring 5,000 MNT. Tier-to-category
  mapping is admin-configurable. REQ-PAY-14 (ramp-up policy) is refined by
  this requirement to use tiered pricing instead of flat ramp-up.
* **REQ-PAY-28**: **Grandfathering**: Taskers who completed 5+ bookings before
  the first paid product launch receive a permanent 5% discount on all future
  paid products (subscriptions, credit packs). Implemented as a `grandfathered`
  flag on user profile. Discount is applied at checkout.
```

### 4.2 Phase 2 REQ-PAY-14 update

**File:** `docs/PRD.md`, line ~371

Replace:

```
* **REQ-PAY-14**: Lead-unlock credit pricing MUST follow a ramp-up policy in Phase 2 (starting at 1 credit),
  configurable by admin as trust and demand stabilize.
```

With:

```
* **REQ-PAY-14**: Lead-unlock credit pricing MUST follow category-tiered pricing
  as defined in REQ-PAY-27. The initial ramp-up period MAY use a flat introductory
  rate before tiered pricing activates, configurable by admin.
```

### 4.3 Phase 3 updates

**File:** `docs/PRD.md`, line ~395-396

Replace REQ-PAY-30:

```
* **REQ-PAY-30**: Top-rated Taskers (Pro Badge holders) MUST be offered a **Monthly Subscription** tier: flat monthly
  fee in exchange for zero lead-fee credit costs, algorithmic priority in search results, and Premium badge visibility.
```

With:

```
* **REQ-PAY-30**: **Tasky Pro Subscription**: Taskers holding the earned Pro Badge
  (REQ-SAFE-04) are eligible for a monthly subscription with two tiers:
    * **Standard** (9,900 MNT/month): 3 free lead unlocks per month, priority
      ranking in search results, Pro Subscriber visual indicator.
    * **Premium** (29,000 MNT/month): 10 free lead unlocks per month,
      top-of-category placement, analytics dashboard (application success rate,
      profile views, earnings summary), portfolio showcase (up to 10 photos).
  Subscription requires the earned Pro Badge as an eligibility gate. Pro Badge
  uses hysteresis thresholds: assigned at >=4.5 avg rating, revoked at <4.0
  (already implemented in `BadgeEvaluationService.java`). Taskers who lose
  Pro Badge status retain their active subscription until the current billing
  period ends, then cannot renew until Pro Badge is re-earned. Subscription
  billing via QPay recurring.
  Feature-gated behind `subscription_enabled` toggle.
```

**File:** `docs/PRD.md`, line ~398-399

Replace REQ-PAY-32:

```
* **REQ-PAY-32**: System MUST support **escrow** flow: Customer pays at booking confirmation → funds held by platform →
  released to Tasker's wallet 4 hours after Customer marks completion (or earlier if manually confirmed). `[F6]`
```

With:

```
* **REQ-PAY-32**: System MUST support **opt-in escrow** flow: For bookings above
  a configurable threshold (initial: 300,000 MNT), Customer MAY choose deposit
  protection at booking confirmation. When opted in: Customer pays 10-20% deposit
  via QPay → funds held by platform → released to Tasker's wallet 4 hours after
  Customer marks completion (or earlier if manually confirmed). Escrow is NOT
  the default settlement mode. Direct settlement remains available for all
  bookings. `[F6]`
```

**File:** `docs/PRD.md`, after line ~408 (after REQ-PAY-38)

Insert new requirement:

```markdown
* **REQ-PAY-39**: **B2B Subscription Billing**: Business accounts (REQ-PAY-25) MUST
  be offered monthly subscription plans:
    * **Host Lite** (99,000 MNT/location/month): Single-unit Airbnb hosts and
      guesthouses. Priority dispatch for tasks from this account.
    * **Ops Standard** (249,000 MNT/location/month): Offices, restaurants, and
      heavy-use hosts. Priority dispatch plus dedicated concierge escalation path.
  Billing occurs on the account's `billing_cycle_day` (1-28) via QPay payment link.
  Plan pricing is stored as `PricingPlan` rows and is admin-configurable.
  Feature-gated behind `b2b_enabled` toggle.
```

### 4.4 Phase 4 update

**File:** `docs/PRD.md`, lines ~410-416

Replace the Phase 4 block:

```
#### Phase 4 — Recurring Revenue & Ecosystem

* **REQ-PAY-40** *(Phase 4)*: **Tasky Plus (Customer Subscription)**: Monthly subscription waiving lead-matching wait
  times and guaranteeing priority matching (< 1 hour).
* **REQ-PAY-41** *(Phase 4)*: **Tasky for Business (B2B)**: Commercial subscription tiers for SMEs and offices to
  schedule recurring temporary hires using Premium Taskers.
* **REQ-PAY-42** *(Phase 4)*: SocialPay and bank-transfer alternatives alongside QPay.
```

With:

```
#### Phase 4 — Recurring Revenue & Ecosystem

* **REQ-PAY-40** *(Phase 4)*: **Tasky Plus (Customer Subscription)**: Monthly
  subscription for priority matching (< 1 hour guarantee), waived trust fees,
  saved favorites, and home service history.
* **REQ-PAY-41** *(Phase 4)*: **B2B Managed (Shape B)**: Contingent on B2B Lite
  (REQ-PAY-25/26/39) validation. Adds recurring schedule templates, SLA
  guarantees, PMS integrations (Guesty, Hostaway), and Multi-Site plan (599,000
  MNT/company/month, up to 5 locations). Requires demonstrated Shape A traction:
  20+ paying B2B accounts for 3+ consecutive months.
* **REQ-PAY-42** *(Phase 4)*: SocialPay and bank-transfer alternatives alongside
  QPay.
* **REQ-PAY-43** *(Phase 4)*: **Family Plan** (19,900 MNT/month): Priority
  matching to Pro-subscribed providers, saved provider favorites, household
  service history.
```

---

## 5. PRD Changes — Section 7.12.5 (Acceptance Criteria)

**File:** `docs/PRD.md`, lines ~686-691

Replace:

```
* **REQ-PAY-40**: Tasky Plus subscribers receive priority queueing and SLA tracking that shows <1 hour match guarantee
  eligibility; non-subscribers cannot access Plus-only queue.
* **REQ-PAY-41**: B2B plans support recurring scheduling, organization billing profile, and seat-based admin controls;
  contract tests verify tenant isolation from consumer accounts.
* **REQ-PAY-42**: In Phase 4, checkout supports QPay plus SocialPay/bank-transfer rails with per-rail success/failure
  telemetry and fallback messaging.
```

With:

```
* **REQ-PAY-23**: Promoted listing purchase creates time-bounded sort boost;
  feed query respects boost expiry; QPay one-time payment verified before
  activation; maximum one active promotion per task enforced.
* **REQ-PAY-24**: Urgent boost appears above promoted listings in feed and
  push; 3-day expiry enforced; QPay one-time payment verified.
* **REQ-PAY-25**: Business account CRUD operations enforce owner-is-CUSTOMER
  constraint; locations store PostGIS coordinates; member roles limited to
  OWNER and MANAGER; membership check enforced on all B2B endpoints.
* **REQ-PAY-26**: Tasks with `business_account_id` appear in business task
  listing; priority weight boost is applied in matching query; standard
  task/booking flow is unchanged for B2B tasks.
* **REQ-PAY-27**: Lead-unlock credit cost varies by category tier; tier
  mapping is admin-configurable; category change on a task recalculates
  unlock cost.
* **REQ-PAY-28**: Grandfathered flag is set for eligible taskers; 5% discount
  applied at checkout for all paid products; flag is permanent and
  non-revocable.
* **REQ-PAY-30**: Subscription requires active Pro Badge; two tiers with
  distinct free-lead-unlock counts; QPay recurring billing; badge loss
  blocks renewal but does not cancel active period.
* **REQ-PAY-32**: Escrow is opt-in; threshold is admin-configurable; direct
  settlement remains default; deposit percentage is 10-20% of booking value.
* **REQ-PAY-39**: B2B plans bill monthly on configured cycle day; QPay
  payment link generated per cycle; plan pricing is admin-configurable;
  suspended accounts retain data but lose priority dispatch.
* **REQ-PAY-40**: Tasky Plus subscribers receive priority queueing and SLA
  tracking that shows <1 hour match guarantee eligibility; non-subscribers
  cannot access Plus-only queue.
* **REQ-PAY-41**: B2B Managed (Shape B) activation requires 20+ paying
  B2B Lite accounts for 3+ months; recurring schedule templates support
  weekly/biweekly/monthly patterns; PMS webhook integration tested against
  Guesty and Hostaway APIs.
* **REQ-PAY-42**: In Phase 4, checkout supports QPay plus SocialPay/bank-
  transfer rails with per-rail success/failure telemetry and fallback
  messaging.
* **REQ-PAY-43**: Family Plan billing via QPay recurring; priority matching
  routes to Pro-subscribed providers; saved favorites persisted per household.
```

---

## 6. PRD Changes — Section 12.4 (Phase 2 Roadmap)

**File:** `docs/PRD.md`, lines ~1082-1112

Replace entire section 12.4:

```markdown
### 12.4 Phase 2 — Soft Monetization (Lead-Fee + Promoted Listings + B2B Lite)

**Goal:** Introduce first revenue streams through promoted listings, category-tiered
lead credits, and B2B Lite domain model while keeping core matching free.
**Revenue:** Promoted listing purchases + credit purchases from Taskers + B2B trial
accounts (free in Phase 2, paid in Phase 3). Target: cover infrastructure costs.
**Duration:** Until Phase 3 readiness criteria are met.

| Area                | Additions over Phase 1                                                                                                                                                                                                                   |
|:--------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Matching**        | Algorithm-assisted application model live (REQ-BOOK-01/02 Phase 2). Proactive push to best-matching Taskers. Applicant list sorted by relevance score with "Recommended" labels.                                                         |
| **Auth**            | SMS OTP activated as primary login method for Phase 2+. Existing Facebook-auth users must register and verify phone OTP. New users can register with OTP without connected Facebook ID. `[F5]`                                           |
| **Verification**    | E-Mongolia DAN API integration enabled as fast-path identity verification in Phase 2. Manual review remains as fallback path.                                                                                                            |
| **Promoted**        | Promoted listing "Онцлох" (15K MNT/7d) and Urgent Boost "Яаралтай" (25K MNT/3d) live. QPay one-time payment. Ships early in Phase 2 (months 4-6) as lowest-engineering-cost revenue.                                                   |
| **Credits**         | Credit system live. QPay merchant integration for credit pack purchases. Category-tiered pricing (REQ-PAY-27): Cleaning/Moving 1.5K, Plumbing/Electrical 3K, Renovation/Tutoring 5K MNT. 5 free credits on Tasker signup.                |
| **Monetization**    | Standard lead-fee model: Core matching remains free. Taskers pay credits only when accepting a selected lead to unlock Customer contact information (15-minute accept/decline window).                                                    |
| **B2B Lite**        | Months 5-6: founder outreach to Airbnb/Booking.com hosts. Months 6-7: manual concierge for 5-10 accounts (no engineering). Months 8-10: B2B system module ships (accounts, locations, members, task tagging, priority dispatch).          |
| **Grandfathering**  | Phase 0 taskers with 5+ completed bookings receive permanent 5% discount on all future paid products (REQ-PAY-28).                                                                                                                       |
| **Notifications**   | SMS fallback for critical events (Hired, Booking Confirmed) when app is not open.                                                                                                                                                        |
| **Incentives**      | QPay digital payment incentives: MNT 5,000-10,000 booking credit for first digital payment. "Secure Booking" badge. `[Payment]`                                                                                                         |
| **Referrals**       | Referral program goes live (REQ-REF-01..04): shareable link/code, attribution tracking, and priority-boost reward at launch.                                                                                                             |
| **Task Intake**     | Structured intake coverage expanded to all active categories. Optional AI summary polish may be tested behind feature toggle with deterministic fallback retained as default.                                                             |
| **Admin**           | Credit pack pricing configuration, category-tier mapping, promoted listing management, B2B account management, revenue reporting, and SMS cost monitoring.                                                                               |
| **Geography**       | Expand to remaining central UB districts if liquidity thresholds met.                                                                                                                                                                    |
| **Categories**      | Add remaining seed categories based on demand signals (Furniture Assembly, Tutoring, Digital Tasks).                                                                                                                                     |

**Exit Criteria for Phase 3:**

- Monthly net revenue (after direct payment/SMS/infra costs) of **>= 6,000,000 MNT**
  for 2 consecutive months
    - Rationale: diversified revenue (promoted listings + lead credits + B2B trial
      data) makes 6M achievable. Sufficient operating buffer before escrow/wallet
      complexity is enabled.
- Lead unlock acceptance rate > 85% with no sustained complaint spike
- QPay payment habit established (>30% of bookings settled via QPay)
- 500+ total completed bookings
- Pro Badge Taskers: 10+ (eligible for subscription tier)
- 10+ active B2B accounts (free trial or manual concierge)
```

---

## 7. PRD Changes — Section 12.5 (Phase 3 Roadmap)

**File:** `docs/PRD.md`, lines ~1114-1128

Replace entire section 12.5:

```markdown
### 12.5 Phase 3 — Subscription + Opt-In Escrow + B2B Billing

**Goal:** Lock in elite supply with Tasky Pro subscriptions. Activate B2B paid
billing. Introduce opt-in escrow for high-value bookings.
**Revenue:** Tasky Pro subscriptions (Tasker MRR) + B2B subscriptions + platform
fee on escrow transactions + continued promoted listings and lead credits.

| Area             | Additions over Phase 2                                                                                                                                                                        |
|:-----------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Matching**     | Instant Match option live (REQ-BOOK-08) for high-liquidity categories. "Match me now" button with 5-minute accept/decline window. Fallback to application flow after 3 declines.              |
| **Subscription** | Tasky Pro Subscription live (REQ-PAY-30): Standard (9,900 MNT/mo) and Premium (29,000 MNT/mo). Eligibility requires earned Pro Badge. QPay recurring billing.                                |
| **B2B Billing**  | B2B subscription plans live (REQ-PAY-39): Host Lite (99K/location/mo) and Ops Standard (249K/location/mo). Monthly billing via QPay. Conversion of Phase 2 trial accounts to paid.            |
| **Payment**      | Opt-in escrow flow live (REQ-PAY-32): Customer chooses deposit protection for bookings >300K MNT. 10-20% deposit held, released after completion. Direct settlement remains default.          |
| **Payouts**      | Tasker wallet with payout requests. Admin payout processing (Tuesdays and Fridays). Manual bank transfer initially.                                                                           |
| **Anti-leakage** | Exact address gated behind escrow payment commitment for escrow bookings. Phone number detection in messages becomes enforced (warning + admin flag).                                         |
| **Dispute**      | Monetary dispute resolution: "Refund Customer" / "Release to Tasker" actions in admin panel.                                                                                                  |
| **Geography**    | Full UB coverage. Begin market assessment for city 2 (Darkhan or Erdenet).                                                                                                                    |
| **Trust**        | Completion guarantee pilot: unsatisfactory work → partial refund or free redo (limited to escrow bookings).                                                                                   |

**Exit Criteria for Phase 4:**

- 20+ paying B2B subscription accounts for 3+ consecutive months
- Tasky Pro subscriber count: 30+ (Standard + Premium combined)
- Escrow opt-in rate: >15% of eligible bookings (>300K MNT)
- Monthly revenue: 12M+ MNT from diversified streams
```

---

## 8. PRD Changes — Section 12.6 (Phase 4 Roadmap)

**File:** `docs/PRD.md`, lines ~1130-1143

Replace entire section 12.6:

```markdown
### 12.6 Phase 4 — Recurring Revenue & Expansion

**Goal:** Diversify revenue with consumer subscriptions and B2B expansion. Expand
beyond UB. Evaluate B2B Managed (Shape B) based on Shape A traction.
**Revenue:** Tasky Plus + B2B expansion (Multi-Site) + Family Plan + transaction fees.

| Area             | Additions over Phase 3                                                                                                                                                  |
|:-----------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Customer Sub** | Tasky Plus (REQ-PAY-40): monthly subscription for priority matching (< 1 hour guarantee) and waived trust fees.                                                         |
| **Family Plan**  | Family Plan (REQ-PAY-43): 19,900 MNT/month for household service history, saved favorites, priority routing to Pro-subscribed providers.                                |
| **B2B Managed**  | Contingent on B2B Lite validation (REQ-PAY-41). If 20+ paying accounts sustained: recurring schedule templates, SLA guarantees, Multi-Site plan (599K MNT/company/mo).  |
| **Geography**    | Launch in Darkhan and/or Erdenet using Phase 0 playbook (district-first, concierge, 3 categories).                                                                      |
| **Categories**   | Higher-value categories: renovation, deep electrical, ger district specialised services, expat concierge. `[F12]`                                                       |
| **Payment**      | SocialPay and bank-transfer alternatives alongside QPay (REQ-PAY-42).                                                                                                   |
| **Pricing**      | Dynamic pricing experimentation engine (surge, seasonal, category-based).                                                                                               |
| **Insurance**    | Investigate platform insurance/guarantee product for high-value bookings.                                                                                               |
```

---

## 9. PRD Changes — Section 9 (Metrics & Phase 3 Trigger Formula)

### 9.1 Metrics table update

**File:** `docs/PRD.md`, line ~886

Replace:

```
| Monthly net revenue | Gross platform revenue minus direct variable platform costs (payment rails, SMS, infra) | Must be >= 12,000,000 MNT for 3 consecutive months before Phase 3    |
```

With:

```
| Monthly net revenue | Gross platform revenue minus direct variable platform costs (payment rails, SMS, infra) | Must be >= 6,000,000 MNT for 2 consecutive months before Phase 3     |
```

### 9.2 Phase 3 Trigger Formula worked example update

**File:** `docs/PRD.md`, lines ~898-903

Replace:

```
Worked example for the current gate:

- `TargetNetRevenue = 12,000,000 MNT`
- If `AvgRevenuePerPaidTransaction = 6,000 MNT` and `AvgVariableCostPerPaidTransaction = 1,500 MNT`
- Then `UnitContributionMargin = 4,500 MNT`
- `RequiredPaidTransactions = ceil(12,000,000 / 4,500) = 2,667 paid transactions/month` (~89/day)
```

With:

```
Worked example for the current gate (diversified revenue):

- `TargetNetRevenue = 6,000,000 MNT`
- Revenue mix: promoted listings (~900K) + lead credits (~1.7M) + B2B trial (0) +
  consumer subs (~1.45M) + Pro badges (~600K) = ~4.65M from non-credit sources
- Remaining from lead credits: `RequiredCreditRevenue = 6,000,000 - 4,650,000 = 1,350,000 MNT`
- If `AvgCreditPrice = 2,500 MNT` (blended across tiers) and `AvgVariableCost = 500 MNT`
- Then `UnitContributionMargin = 2,000 MNT`
- `RequiredPaidCreditUnlocks = ceil(1,350,000 / 2,000) = 675 credit unlocks/month` (~23/day)
- Note: this example uses conservative month-10 projections from the debate
  composite blueprint. Actual mix will vary.
```

---

## 10. PRD Changes — Section 7.12.4 (REQ-PAY-14 Acceptance Criteria)

**File:** `docs/PRD.md`, line ~650-651

Replace:

```
* **REQ-PAY-14**: Lead-unlock price table is admin-configurable by category/district with minimum start value 1 credit;
  all price changes are versioned with effective timestamp.
```

With:

```
* **REQ-PAY-14**: Lead-unlock pricing follows category-tiered model (REQ-PAY-27);
  tier-to-category mapping is admin-configurable; all price changes are versioned
  with effective timestamp; optional flat introductory rate may precede tiered
  activation.
```

---

## 11. PRD Changes — Section 10.2 (Risk Table)

**File:** `docs/PRD.md`, line ~977

Replace:

```
| **Market Size Ceiling** (UB ~500K–600K households)         | High     | High       | Phase 4 city expansion (Darkhan, Erdenet). Higher-value category expansion. B2B recurring services. `[F12]`                                                                                  |
```

With:

```
| **Market Size Ceiling** (UB ~500K–600K households)         | High     | High       | B2B Lite from Phase 2 (supply lock-in + revenue diversification). Phase 4 city expansion (Darkhan, Erdenet). Higher-value category expansion. B2B Managed services. `[F12]`                  |
```

---

## 12. New ADR — `docs/adr/0003-b2b-lite-phase-advancement.md`

Create new file with the following content:

```markdown
# ADR 0003: B2B Lite Phase Advancement (Phase 4 → Phase 2)

## Status

proposed

## Date

2026-03-22

## Context

The PRD (Section 7.5, REQ-PAY-41) places B2B monetization in Phase 4 as a managed
service ("commercial subscription tiers for SMEs to schedule recurring temporary
hires"). This implies Shape B: recurring scheduling, tenant isolation, seat-based
admin controls, and PMS integrations.

A structured four-way AI debate (2026-03-22) across two rounds identified
supply-side dependency as the critical structural advantage a service marketplace
needs to build before competitors (primarily Facebook groups) become entrenched.
The debate's core finding:

> "Grab, Gojek, Careem all succeeded by making supply economically dependent
> before monetizing. A tasker with 8 bookings in 3 months through Tasky while
> also using Facebook is not dependent." — Sonnet

Waiting until Phase 4 (~month 12) to introduce B2B means spending a year building
a consumer-only marketplace where no tasker is economically dependent on the
platform. By month 12, top taskers have built direct client relationships through
Tasky introductions and can operate independently.

## Decision

Advance B2B Lite (Shape A — bulk-buyer subscriptions) from Phase 4 to Phase 2-3:

1. B2B Lite domain model (business accounts, locations, members, task tagging,
   priority dispatch) ships in Phase 2 (months 8-10).
2. B2B subscription billing (Host Lite, Ops Standard) ships in Phase 3 alongside
   consumer subscription infrastructure.
3. Manual B2B concierge validates demand (months 5-7) before system module ships.
4. B2B Managed (Shape B — recurring scheduling, SLA guarantees, PMS integrations)
   remains Phase 4+, contingent on Shape A traction (20+ paying accounts for 3+
   consecutive months).

Shape A scope is deliberately thin: 3 tables (business_accounts, business_locations,
business_members), a thin service layer delegating to existing task/booking services,
and monthly QPay billing. B2B tasks reuse the standard task/booking flow with a
`business_account_id` tag and priority dispatch weight — no parallel booking system.

## Consequences

Positive:

1. Earlier supply-side lock-in through recurring B2B demand (Airbnb turnovers,
   office cleaning).
2. Revenue diversification — B2B projected at ~57% of month-12 revenue, reducing
   dependence on consumer lead-fees.
3. Revenue predictability — monthly subscriptions have lower churn than
   per-transaction credits.
4. Demand validation before engineering — manual concierge (months 5-7) proves the
   model before the system module ships.

Negative:

1. Founder time split between consumer operations and B2B sales outreach.
2. Risk of failed B2B delivery damaging reputation at low supply density.
3. Phase 2 engineering scope increases (B2B domain model + priority dispatch).

## Alternatives Considered

1. Keep B2B at Phase 4 (month 12+).
   Rejected: delays supply dependency mechanism. Twelve months of consumer-only
   operation lets taskers become independent of the platform.

2. Start B2B at month 4 per debate recommendation.
   Rejected: supply density insufficient (~20 verified taskers, ~50 bookings).
   B2B tasks (Airbnb turnovers) have hard deadlines requiring reliable supply.
   Founder bandwidth consumed by Phase 2 engineering (promoted listings, lead
   credits). Month 6-7 start provides reliability data and engineering bandwidth.

3. Build B2B Managed (Shape B) directly.
   Rejected: Shape B (recurring scheduling, SLA guarantees, PMS integrations) is
   a different product requiring significant engineering. At solo-dev scale with
   pre-revenue, this would be a fatal scope expansion. Shape A validates demand
   with minimal engineering before Shape B investment.

## References

- `docs/debates/2026-03-22-monetization-model/MONETIZATION-STRATEGY-ANALYSIS.md`
- `docs/adr/0001-liquidity-first-monetization-deferral.md`
- PRD Section 7.5 (Monetization Phased)
- PRD Section 12.4-12.6 (Phase Roadmap)

Phase mapping (debate analysis → PRD):
- Debate "Phase 0" (months 1-3) → PRD Phase 0-1
- Debate "Phase 1" (months 4-6) → PRD Phase 2 (early: promoted listings, B2B outreach)
- Debate "Phase 2" (months 7-10) → PRD Phase 2 (late: lead credits, B2B system)
- Debate "Phase 2b" (months 9-12) → PRD Phase 3 (subscriptions, B2B billing, escrow)
- Debate "Phase 3" (month 12+) → PRD Phase 4
```

---

## 13. Unchanged Sections

The following are explicitly NOT modified by this spec:

- **PRD Section 7.5 Phase 0-1** (REQ-PAY-01 through REQ-PAY-03): Free phase unchanged.
- **PRD Section 7.5 Phase 2 Credit System** (REQ-PAY-10 through REQ-PAY-22): Lead credit mechanics unchanged except REQ-PAY-14 (pricing policy updated to reference REQ-PAY-27).
- **REQ-SAFE-04** (Pro Badge auto-assignment): Earned badge logic unchanged. Already implemented.
- **API.yaml**: Not updated in this spec. Endpoint design follows during implementation planning.
- **ARCHITECTURE.md**: Not updated in this spec. Architecture changes follow during implementation.
- **Codebase**: No code changes. This is a spec-only update.

---

## 14. Traceability

| New Requirement | Phase | Origin |
|-----------------|-------|--------|
| REQ-PAY-23 (Promoted Listing) | 2 | Debate: Gemini blueprint, Zar.mn precedent |
| REQ-PAY-24 (Urgent Boost) | 2 | Debate: Gemini blueprint |
| REQ-PAY-25 (B2B Accounts) | 2 | Debate: Codex blueprint (B2B-Lite First) |
| REQ-PAY-26 (B2B Task Tagging) | 2 | Debate: Codex blueprint + architecture review |
| REQ-PAY-27 (Category-Tiered Pricing) | 2 | Debate: Opus blueprint (unit economics analysis) |
| REQ-PAY-28 (Grandfathering) | 2 | Debate: Gemini blueprint (evangelist strategy) |
| REQ-PAY-30 update (Two-Tier Subscription) | 3 | Debate: Sonnet blueprint (9,900 MNT threshold) + design review (earned badge gate) |
| REQ-PAY-32 update (Opt-In Escrow) | 3 | Debate: unanimous finding |
| REQ-PAY-39 (B2B Billing) | 3 | Debate: Codex blueprint + timing review (month 6-7 start) |
| REQ-PAY-41 update (Shape B Contingent) | 4 | Design review: scope separation Shape A vs Shape B |
| REQ-PAY-43 (Family Plan) | 4 | Debate: Sonnet blueprint |
| Revenue gate 12M→6M | 3 gate | Debate: unanimous finding (market ceiling) |
