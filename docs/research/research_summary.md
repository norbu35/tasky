# Tasky PRD Research Compilation (March 3, 2026)

Historical synthesis prepared ahead of the PRD v1.3 rewrite. Use this document as research input, not as a canonical product or architecture baseline.

## 1. Purpose

This document compiles PRD-relevant findings from the market research outputs in `docs/research/` so `docs/PRD.md`
can be updated with evidence-backed decisions.

## 2. Source Files Distilled

1. `docs/research/MONGOLIA_MARKET_RESEARCH.md`
2. `docs/research/PAYMENT_BEHAVIOUR_ANALYSIS.md`
3. `docs/research/unegui_market_report_2026-03-03.md`

Associated raw market snapshots and scraper assets now live under:
- `research/market-data/`
- `research/unegui-scraper/`

## 3. Project Goal and Current State (from existing project docs)

### 3.1 Goal (unchanged)

- Tasky mission remains: build Mongolia's most trusted and efficient domestic service marketplace.
- Existing doctrine prioritizes trust, local market fit, liquidity, mobile-first UX, API contracts, and quality gates (
  `AGENTS.md`).

### 3.2 Baseline at Time of Compilation

- At the time of compilation, the working PRD baseline was `docs/PRD.md` v1.1 (liquidity-first, trust-first, phase-1 direct settlement, monetization deferred).
- Current business strategy (`docs/STRATEGY.md`) already favors 0% commission first, soft monetization later.
- Backlog and ticket status indicate broad backend foundation already exists, with product integration still ongoing (
  `TASK-080` in progress).

## 4. Distilled Findings for PRD Content

| ID  | Distilled finding (across reports)                                                                                           | PRD implication                                                                                                                                                  |
|-----|------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| F1  | Mongolia is digitally ready for marketplace usage (high smartphone/internet penetration, very high social and mobile usage). | Keep mobile-first, fast onboarding, and push-driven activation as first-class requirements.                                                                      |
| F2  | Ulaanbaatar concentration supports district-first liquidity strategy; citywide launch is high-risk.                          | Explicitly constrain launch by district and service category until liquidity thresholds are met.                                                                 |
| F3  | Core gap vs incumbents (Facebook groups, Unegui) is trust infrastructure, not listing availability.                          | PRD should elevate trust mechanisms (verification, dispute evidence, reputation, enforcement) as core value, not auxiliary features.                             |
| F4  | Relationship-driven trust culture means referrals and verified identity matter more than anonymous discovery.                | Add referral loops and stronger verification/review mechanics to MVP requirements.                                                                               |
| F5  | Supply side includes phone-first workers; Facebook-only auth excludes part of target taskers.                                | Split auth strategy by persona: keep social login for demand convenience, add phone-first onboarding path for taskers.                                           |
| F6  | QPay is dominant national rail, but platform escrow trust must be earned.                                                    | Use a staged payment model in PRD: phase-1 direct settlement + optional digital path, phase-2 incentives, phase-3 escrow standardization after trust milestones. |
| F7  | Off-platform leakage is structurally likely in home services; cannot be solved by fee policy alone.                          | Add stronger information-control requirements (no phone number exposure, in-app messaging only, progressive location reveal).                                    |
| F8  | Voluntary reviews underperform in high-context cultures and can inflate quality signals.                                     | Make bilateral reviews workflow-enforced (or strongly gated) to maintain trustworthy reputation data.                                                            |
| F9  | Manual verification and operations are unavoidable early; throughput bottlenecks can kill supply growth.                     | Add explicit admin SLA and “concierge/manual dispatch” operational mode for first launch cohort.                                                                 |
| F10 | Seasonal demand (especially pre-Tsagaan Sar cleaning surge) is a major planning variable.                                    | Add seasonal launch and category sequencing guidance to PRD assumptions and KPI planning.                                                                        |
| F11 | Legal risk exists around contractor status over long engagement windows and PII processing.                                  | Add compliance constraints and monitoring requirements (contractor classification risk, explicit consent/data controls).                                         |
| F12 | UB market size ceiling requires early plan for expansion or higher-value services post-liquidity.                            | Add post-MVP scaling hypotheses (city-2 expansion and/or higher-value categories) to future-scope section.                                                       |

## 5. Conflicts Across Reports and Resolution Decisions

| Topic              | Contradiction observed                                                                                                                                                        | Resolution for PRD update                                                                                                                                                       |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Payment timing     | `MONGOLIA_MARKET_RESEARCH.md` pushes QPay/escrow in phase-1; `PAYMENT_BEHAVIOUR_ANALYSIS.md` warns upfront escrow will hurt adoption; additional research supports cash/P2P early. | Adopt **graduated settlement**: phase-1 direct settlement permitted, phase-2 incentivized digital, phase-3 escrow default after trust/habit thresholds.                         |
| Auth channel       | Current PRD: Facebook OAuth primary; research: phone-first needed for blue-collar supply; additional research warns SMS cost.                                                      | Adopt **dual-lane auth**: demand can use social-first; taskers get phone-first path. Control SMS cost via scoped OTP usage/rate limits; keep alternative channels where viable. |
| Monetization model | Additional research proposes lead-fee race model; current PRD/strategy defer monetization; other findings stress trust before extraction.                                          | Keep **trust/liquidity first** for MVP. Treat lead-fee model as post-MVP experiment, not baseline requirement.                                                                  |
| Category breadth   | Some docs suggest larger category surface; multiple reports stress constrained launch.                                                                                        | Use **tight category + geography constraint** in MVP (small set of high-frequency, low-complexity categories first).                                                            |
| Automation level   | Some docx content assumes heavy AI-first operations replacing teams.                                                                                                          | Keep AI assistive where useful, but PRD should prioritize reliable human-reviewed trust/safety operations in early stages.                                                      |
| Verification mode  | Manual verification vs rapid DAN/e-government integration.                                                                                                                    | Keep **manual verification MVP + SLA**, design interface for future DAN fast-path integration when integration and compliance are ready.                                        |

## 6. Prioritized PRD Change Set (for next PRD revision)

### P0 — Must update in PRD now

1. Define district-first + category-constrained launch rule with explicit liquidity thresholds.
2. Add dual-lane auth policy (customer convenience path + tasker phone-first path).
3. Add anti-leakage information controls:
    - No public phone number exposure.
    - In-app messaging as default transaction channel.
    - Progressive location reveal tied to booking/payment state.
4. Replace passive reviews with workflow-enforced bilateral review completion.
5. Add admin verification SLA and first-cohort concierge/manual dispatch operations.
6. Add phased payment graduation model (direct settlement -> incentivized digital -> escrow default later).
7. Add legal/compliance constraints for contractor classification horizon and PII consent handling.

### P1 — Should add for stronger execution

1. Add culturally aligned referral mechanisms for both taskers and customers.
2. Add seasonal go-to-market milestones (pre-Tsagaan Sar priority window).
3. Add explicit disintermediation monitoring KPIs and intervention triggers.
4. Add trust-product milestones (dispute response SLA, evidence completeness, repeat booking confidence indicators).

### P2 — Keep in roadmap assumptions (post-MVP)

1. E-Mongolia DAN verification fast-path integration.
2. UB ceiling response: city-2 expansion (Darkhan/Erdenet) and/or higher-value category expansion.
3. B2B recurring service products after core consumer liquidity stabilizes.

## 7. Candidate Requirement Deltas (draft-ready for PRD editing)

- `REQ-AUTH-*`: Persona-based auth policy (customer social-first optionality, tasker phone-first onboarding support).
- `REQ-BOOK-*`: Progressive information reveal and settlement-state rules.
- `REQ-SAFE-*`: Mandatory or gated bilateral reviews, stronger anti-leakage communication controls.
- `REQ-ADMIN-*`: Verification queue SLA and concierge dispatch tools for early stage reliability.
- `REQ-PAY-*`: Staged payment architecture and graduation criteria instead of binary “deferred vs enabled”.
- `NFR-LEGAL-*`: Contractor classification monitoring and compliance controls.
- `NFR-OBS-*`: Leakage, review completion, time-to-verification, and payment-stage adoption instrumentation.

## 8. Summary

The four research reports converge on one central conclusion: **Tasky wins only if it creates a trust and execution
layer that Facebook/Unegui cannot replicate, while rolling out payment and monetization at the speed of user trust, not
at the speed of technical capability.**

This compilation is intended as the direct input for the next PRD rewrite/update pass.
