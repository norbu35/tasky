# Tasky Phase 1 KPI Model

## 1. Purpose

This document defines the KPI stack for the Phase 1 Ulaanbaatar launch. `docs/PRD.md`, `docs/OBSERVABILITY.md`, and `docs/maintenance/PRODUCTION_READINESS.md` should remain aligned with it.

## 2. KPI stack

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

## 3. Locked definitions

### 3.1 Self-Serve Fulfillment Rate

`% of eligible_task posts that reach completed_booking within 7 days of posting, through the platform flow, with no intervention`

- Primary slice: category
- District: drilldown
- Decision-valid only when denominator >= 30 posted tasks per category

### 3.2 Qualified Match Rate within 24h

`% of eligible_task posts receiving at least one qualified_application within 24h`

- Excludes spam, fraud, admin-invalid tasks, and user-mistake cancels within 30 minutes
- Paired diagnostic: median time to first qualified application

### 3.3 Post -> Confirmed Booking Rate within 48h

`% of eligible_task posts that reach confirmed_booking within 48h of posting before any system-assisted or manual-assisted intervention`

- Confirmed booking means customer selects + tasker accepts + system confirms
- Customer abandonment counts as failure
- Tasks that require intervention remain in the denominator but do not count as native confirmation success
- Paired diagnostic: median time from posting to confirmed booking

### 3.4 Booking Completion Rate

`% of confirmed_booking records that reach completed_booking within 7 days of confirmation`

- Denominator: all confirmed bookings
- Post-confirmation cancellation counts as failure
- Failure reason split required

### 3.5 Intervention Rate

`% of eligible_task posts that required non-standard rescue or assistance to progress`

- Track `intervention_type = manual_rescue | external_distribution | ops_override`
- Track `intervention_stage = pre_match | post_match | post_booking | completion_rescue`

### 3.6 Trust Failure Rate

`% of confirmed_booking records ending in objective trust-damaging failure`

- Includes post-confirmation cancellation, no-show, dispute, and serious complaint after completion
- Excludes vague dissatisfaction as a core KPI

### 3.7 Verification Queue Turnaround

Median and p95 from complete identity verification document submission to final decision.

## 4. Thresholds

### 4.1 Hard-gate thresholds

| Metric                                    | Green    | Yellow   | Red     |
| ----------------------------------------- | -------- | -------- | ------- |
| Qualified Match Rate within 24h           | `>= 50%` | `40-49%` | `< 40%` |
| Post -> Confirmed Booking Rate within 48h | `>= 25%` | `15-24%` | `< 15%` |
| Intervention Rate                         | `<= 40%` | `41-55%` | `> 55%` |
| Trust Failure Rate                        | `<= 15%` | `16-20%` | `> 20%` |

### 4.2 Monitored targets

| Metric                           | Target                        |
| -------------------------------- | ----------------------------- |
| Self-Serve Fulfillment Rate      | `>= 15%`                      |
| Booking Completion Rate          | `>= 65%`                      |
| Identity Verification Turnaround | median `<= 36h`, p95 `<= 96h` |

## 5. Event and vocabulary rules

Use the following conceptual event/state vocabulary in reporting:

- `eligible_task`
- `qualified_application`
- `confirmed_booking`
- `completed_booking`
- `intervention`

KPI computation should come from backend-exported business metrics derived from canonical events and state transitions, not ad hoc dashboard SQL.

## 6. Dashboard policy

- All seven KPIs must exist on a real dashboard before launch.
- Alerts are required only for the four hard-gate metrics.
- Category is the primary launch dashboard slice.
- District remains a drilldown and diagnostic slice.
- Diagnostics such as median time to first qualified application or failure-reason splits should support the core KPIs instead of replacing them.

## 7. Data quality rules

1. KPI decisions are valid only when the denominator threshold for that KPI is met.
2. If core event exports are degraded, pause KPI-based go / no-go decisions until tracking is repaired.
3. Native self-serve reporting and native confirmation success must exclude successes that occur after system-assisted or manual-assisted intervention.
