# Tasky Business Strategy & Go-To-Market

## Overview

4-phase go-to-market strategy for the Mongolian market. Core philosophy: **prioritize liquidity and trust over immediate
revenue** to solve the marketplace cold-start problem.

Phase numbering in this document follows the current PRD baseline. The zero-monetization launch window is the PRD's combined `Phase 0-1` period; PRD Section 12 further splits that window into Phase 0 and Phase 1 rollout stages.

- `Phase 0-1`: liquidity and trust formation
- `Phase 2`: soft monetization
- `Phase 3`: subscription and escrow
- `Phase 4`: recurring revenue expansion

---

## Phase 0-1 — Liquidity (0% Commission)

**Goal:** Build an initial pool of verified Taskers and real customer demand before any monetization.
**Revenue:** $0

### Supply-Side Acquisition

Target two initial Tasker pools using zero-cost tactics:

- **Pool A — University students:** Market at universities, malls, and markets. Messaging: install the app, turn on push
  notifications, earn flexible income. Map to "Delivery & Errands" and "Cleaning" categories.
- **Pool B — Craftsman district ("100 Ail"):** Posters and guerrilla marketing in the building materials district. Map
  to "Handyman", "Moving & Hauling", "Furniture Assembly", "Painting".

### Demand-Side Acquisition

Automatically cross-post new Tasky tasks to relevant local Facebook groups (e.g., UB job boards, community groups). This
bridges the platform and where the current audience already lives.

### Market Constraint Strategy

Restrict initial marketing to **6 categories only** to artificially compress the market and maximize the probability
that a posted task finds a Tasker within minutes.

### Push-Notification Engine

Because the app sits passively on devices, push notifications act as the supply trigger — mobilizing the latent Tasker
pool at zero ongoing cost when a task is posted nearby.

---

## Phase 2 — Soft Monetization

**Goal:** Standardize lead-fee monetization while keeping core matching free.
**Revenue:** Lead-unlock credits purchased by Taskers.

- **Core matching remains free:** Taskers browse and apply for free; Customers review applicants for free.
- **Lead unlock charge point:** Credits are charged only when the selected Tasker accepts and unlocks Customer contact
  details.
- **Ramp-up policy:** Unlock credit cost starts low and scales by admin policy as trust and demand stabilize.
- **Phone auth migration:** SMS OTP becomes primary auth; Phase 0-1 Facebook-only users migrate by verifying phone OTP.

---

## Phase 3 — Take Rate (Core Monetization)

**Goal:** Sustainable unit economics once users rely on the platform.

- **Grandfather clause:** Lock Phase 1 & 2 Taskers into a low, eternal commission rate (e.g., 5%). Apply market-standard
  rates (10–15%) to new Taskers.
- **Fee split:** Supply side (Taskers) pays the majority for lead generation. Customers pay a smaller "Trust & Safety"
  fee (3–5%).
- **Anti-leakage:** On-platform jobs become invaluable via escrow payments, platform insurance, and a robust public
  review score that directly affects Tasker earnings.

---

## Phase 4 — Recurring Revenue

**Goal:** Predictable, non-transactional revenue from high-value users.

- **Tasky Plus (Customers):** Monthly subscription waiving Trust & Safety fees and guaranteeing minimum-time matching (<
  1 hour).
- **Tasky for Business:** B2B invoicing for offices, restaurants, and retail shops that need recurring temporary hires.

---

## Phase 0-1 Management Philosophy

1. **Optimize for liquidity quality first.** North Star metric in the first 6 months is Category Liquidity Score.
   Revenue remains a lagging indicator.
2. **Be the concierge.** For the first 30 tasks, personally match, monitor, and intervene to guarantee a 5-star
   outcome.
3. **Build the trust moat.** Every feature — identity verification, secure messaging, dispute resolution — builds the
   trust differential that justifies future commission.

---

## AI-Enabled Solo Ops

Use AI as an execution multiplier, not as final authority:

1. **Verification Copilot:** Prioritize queue by SLA risk and suspected fraud signals.
2. **Dispute Copilot:** Summarize evidence threads and recommend policy-aligned outcomes for founder approval.
3. **Supply Activation Copilot:** Recommend outreach and push-notification timing by district/category liquidity gaps.
4. **Retention Copilot:** Generate rebook/referral campaigns for high-intent cohorts.
5. **Founder Weekly Brief:** Auto-generate one-page report with blockers, risk alerts, and next 3 actions.

---

## Facebook Growth Tactics (Phase 0-1 Supplement)

### Supply-Side Cross-Posting

When a Customer posts a task on Tasky, automatically cross-post it to relevant Facebook groups:

> *"New Job Alert: Someone nearby needs a plumber! Budget: 50,000 MNT. See exactly where and apply
instantly: [Deep_Link]"*

Taskers must download Tasky to access task details. Exact location is revealed after booking, and Customer contact
details are revealed only after paid lead unlock in Phase 2+.

### Demand-Side Import (Advanced)

A scraper bot monitors targeted Facebook groups for intent posts ("Need my house cleaned today in 13th microdistrict,
will pay 30k"), parses them via LLM into structured tasks, and auto-imports them onto Tasky. A reply is posted to the
original Facebook post linking the auto-generated task.

**Technical stack:** Browser automation (Puppeteer/Playwright), rotating residential Mongolian IPs, aged Facebook
accounts, `gpt-4o-mini` for parsing, a dedicated microservice calling the Tasky API.

**Risks:**

| Risk               | Mitigation                                                                    |
|--------------------|-------------------------------------------------------------------------------|
| Account bans       | Pool of 10–20 aged accounts; swap on ban; Mongolian residential IPs           |
| Spam flags         | Randomize reply text (spintax); throttle to 3–5 cross-posts per group per day |
| Group admin blocks | Interleave human-like behaviour in automation sessions                        |
| Data quality       | Mark imported tasks clearly as "Imported from Facebook" in the UI             |

**Recommendation:** Start with supply-side cross-posting first (safer, lower risk). Enable demand-side import only after
the task map has density.

> **Note:** Demand-side scraping violates Facebook's Terms of Service and must be executed carefully and only in the
> early liquidity phase.
