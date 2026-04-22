# Tasky Phase 1 KPI Model

**Status:** Canonical  
**Last updated:** 2026-04-22

## 1. Purpose

This document defines the launch KPI stack for the Phase 1 Bayangol pilot. `docs/PRD.md`,
`docs/OBSERVABILITY.md`, and `docs/maintenance/PRODUCTION_READINESS.md` must match this file.

## 2. KPI Stack

### 2.1 Hard-gate metrics

1. Qualified Match Rate within 24h
2. Post -> Confirmed Booking Rate within 48h
3. Intervention Rate
4. Trust Failure Rate

### 2.2 Monitored metrics

1. Self-Serve Fulfillment Rate
2. Booking Completion Rate
3. Verification Queue Turnaround

Category is the primary decision slice. District is drilldown only.

## 3. Locked Definitions

### 3.1 Self-Serve Fulfillment Rate

`% of pilot_eligible_task posts that reach completed_booking within 7 days of posting, through the platform flow, with no intervention`

- Primary slice: category
- District: drilldown
- Decision-valid only when denominator >= 30 posted tasks per category

### 3.2 Qualified Match Rate within 24h

`% of pilot_eligible_task posts receiving at least one qualified_application within 24h`

- Excludes spam, fraud, admin-invalid tasks, and user-mistake cancels within 30 minutes
- Paired diagnostic: median time to first qualified application

### 3.3 Post -> Confirmed Booking Rate within 48h

`% of pilot_eligible_task posts that reach confirmed_booking within 48h of posting`

- Confirmed booking means customer selects + tasker accepts + system confirms
- Customer abandonment counts as failure
- Paired diagnostic: median time from posting to confirmed booking

### 3.4 Booking Completion Rate

`% of confirmed_booking records that reach completed_booking within 7 days of confirmation`

- Denominator: all confirmed bookings
- Post-confirmation cancellation counts as failure
- Failure reason split required

### 3.5 Intervention Rate

`% of pilot_eligible_task posts that required non-standard rescue or assistance to progress`

- Track `intervention_type = manual_rescue | external_distribution | ops_override`
- Track `intervention_stage = pre_match | post_match | post_booking | completion_rescue`

### 3.6 Trust Failure Rate

`% of confirmed_booking records ending in objective trust-damaging failure`

- Includes post-confirmation cancellation, no-show, dispute, and serious complaint after completion
- Excludes vague dissatisfaction as a core KPI

### 3.7 Verification Queue Turnaround

Median and p95 from complete document submission to final decision.

- Split identity verification turnaround vs category-vetting turnaround

## 4. Thresholds

### 4.1 Hard-gate thresholds

| Metric                                    | Green    | Yellow   | Red     |
| ----------------------------------------- | -------- | -------- | ------- |
| Qualified Match Rate within 24h           | `>= 50%` | `40-49%` | `< 40%` |
| Post -> Confirmed Booking Rate within 48h | `>= 25%` | `15-24%` | `< 15%` |
| Intervention Rate                         | `<= 40%` | `41-55%` | `> 55%` |
| Trust Failure Rate                        | `<= 15%` | `16-20%` | `> 20%` |

### 4.2 Monitored targets

| Metric                           | Target                         |
| -------------------------------- | ------------------------------ |
| Self-Serve Fulfillment Rate      | `>= 15%`                       |
| Booking Completion Rate          | `>= 65%`                       |
| Identity Verification Turnaround | median `<= 36h`, p95 `<= 96h`  |
| Category Vetting Turnaround      | median `<= 72h`, p95 `<= 120h` |

## 5. Event And Vocabulary Rules

Use the following conceptual event/state vocabulary in reporting:

- `pilot_eligible_task`
- `qualified_application`
- `confirmed_booking`
- `completed_booking`
- `intervention`
- `out_of_area_post_attempted`
- `out_of_area_waitlist_joined`
- `waitlist_area`
- `waitlist_category`

KPI computation must come from backend-exported business metrics derived from canonical events and state transitions,
not ad hoc dashboard SQL.

## 6. Dashboard Policy

- All seven KPIs must exist on a real dashboard before launch.
- Alerts are required only for the four hard-gate metrics.
- Category is the primary launch dashboard slice.
- District remains a drilldown and diagnostic slice.
- Diagnostics such as median time to first qualified application or failure-reason splits should support the core KPIs
  instead of replacing them.

## 7. Data Quality Rules

1. KPI decisions are valid only when the denominator threshold for that KPI is met.
2. If core event exports are degraded, pause KPI-based go/no-go decisions until tracking is repaired.
3. Native self-serve reporting must exclude both system-assisted and manual-assisted outcomes.
