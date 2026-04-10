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

- `archive/greenfield-docs/docs/debates/2026-03-22-monetization-model/MONETIZATION-STRATEGY-ANALYSIS.md`
- `docs/adr/0001-liquidity-first-monetization-deferral.md`
- PRD Section 7.5 (Monetization Phased)
- PRD Section 12.4-12.6 (Phase Roadmap)

Phase mapping (debate analysis → PRD):
- Debate "Phase 0" (months 1-3) → PRD Phase 0-1
- Debate "Phase 1" (months 4-6) → PRD Phase 2 (early: promoted listings, B2B outreach)
- Debate "Phase 2" (months 7-10) → PRD Phase 2 (late: lead credits, B2B system)
- Debate "Phase 2b" (months 9-12) → PRD Phase 3 (subscriptions, B2B billing, escrow)
- Debate "Phase 3" (month 12+) → PRD Phase 4
