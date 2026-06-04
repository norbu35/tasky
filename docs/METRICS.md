# Tasky Phase 1 KPI Model

## 1. Purpose

This document is the dedicated KPI source for the Phase 1 Ulaanbaatar launch and the post-launch commerce-pilot
learning metrics. `docs/PRD.md` delegates metric names, formulas, thresholds, denominator policy, dashboard rules, alert
policy, and KPI event vocabulary to this file. `docs/OBSERVABILITY.md` and
`docs/maintenance/PRODUCTION_READINESS.md` must remain aligned with it.

Changes that alter metric semantics are product behavior changes. Update `docs/PRD.md` in the same workflow when metric formulas, launch thresholds, denominator policy, or decision semantics change.

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

`qualified_application` is a metric event name. It means an application from an ID-verified, globally eligible tasker in Phase 1; it does not imply category-specific vetting, time-slot availability, or service-area gating.

### 2.3 Economic learning metrics

Economic learning metrics support Phase 2 commerce decisions. They do not replace the Phase 1 hard-gate liquidity and
trust metrics, and they must not justify monetization in a category whose launch liquidity and trust metrics are still
red.

One-time rebook events may be recorded during Phase 1 as repeat-demand learning. Rebook and repeat-customer metrics do
not become monetization approval by themselves; they must be read alongside liquidity, trust, intervention, and
completion health.

1. Booked GMV
2. Completed GMV
3. Platform Fee Revenue
4. Payment Penetration
5. Rebook Rate
6. Repeat Customer Rate
7. Leakage Indicator
8. Manual B2B Account GMV
9. CAC Payback Estimate

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
- Decision-valid only when denominator >= 30 eligible task posts per category

### 3.3 Post -> Confirmed Booking Rate within 48h

`% of eligible_task posts that reach confirmed_booking within 48h of posting before any system-assisted or manual-assisted intervention`

- Confirmed booking means customer selects + tasker accepts + system confirms
- Customer abandonment counts as failure
- Tasks that require intervention remain in the denominator but do not count as native confirmation success
- Paired diagnostic: median time from posting to confirmed booking
- Decision-valid only when denominator >= 30 eligible task posts per category

### 3.4 Booking Completion Rate

`% of confirmed_booking records that reach completed_booking within 7 days of confirmation`

- Denominator: all confirmed bookings
- Post-confirmation cancellation counts as failure
- Failure reason split required
- Decision-valid only when denominator >= 20 confirmed bookings per category

### 3.5 Intervention Rate

`% of eligible_task posts that required non-standard rescue or assistance to progress`

- Track `intervention_type = manual_rescue | external_distribution | ops_override`
- Track `intervention_stage = pre_match | post_match | post_booking | completion_rescue`
- Decision-valid only when denominator >= 30 eligible task posts per category

### 3.6 Trust Failure Rate

`% of confirmed_booking records ending in objective trust-damaging failure`

- Includes fault-attributed post-confirmation cancellation, validated no-show, evidence-backed dispute, and serious complaint after completion
- Excludes vague dissatisfaction as a core KPI
- Decision-valid only when denominator >= 20 confirmed bookings per category

### 3.7 Verification Queue Turnaround

Median and p95 from complete identity verification document submission to final decision.

- Decision-valid only when denominator >= 10 completed verification decisions in the measurement window

### 3.8 Booked GMV

Sum of locked booking prices for bookings confirmed in the measurement window.

- Track by category and customer maturity cohort
- Do not treat booked GMV as revenue
- Pair with cancellation and completion outcomes so confirmed-but-uncompleted volume does not overstate monetizable value

### 3.9 Completed GMV

Sum of locked booking prices for bookings that reach `completed_booking` in the measurement window.

- Primary economic basis for platform-fee take-rate analysis
- Track by category, district drilldown, and self-serve versus assisted outcome class
- Exclude canceled, disputed-unresolved, and no-show outcomes unless a later policy explicitly defines a fee-bearing
  terminal state

### 3.10 Platform Fee Revenue

Gross Tasky fee amount charged through an approved platform-fee pilot.

- Track fee rate, fee amount, category, customer maturity cohort, and whether the fee was waived
- Show separately from underlying job price and completed GMV
- A platform fee does not imply Tasky collected, held, or paid out the underlying job amount

### 3.11 Payment Penetration

`% of confirmed bookings in an approved commerce-pilot category where the Tasky platform fee was successfully collected through the platform`

- Applies only after a fee pilot is activated
- Denominator: confirmed bookings eligible for the active fee pilot
- Numerator: eligible bookings with successfully collected platform fee

### 3.12 Rebook Rate

`% of customers with a completed booking who create another task or booking request within 60-90 days`

- Primary category focus: cleaning
- Track rebook after same tasker versus new tasker
- Paid household membership should not be evaluated until repeat cleaning behavior is visible without paid membership

### 3.13 Repeat Customer Rate

`% of customers with at least two completed bookings in the trailing 90 days`

- Track by first completed category and most recent category
- Use as a retention signal before customer subscription or membership work

### 3.14 Leakage Indicator

Share of confirmed-intent conversations or booking flows with evidence that the parties moved coordination or payment
off platform before the tracked platform workflow completed.

- This is a diagnostic, not a punitive metric by default
- Track text-pattern flags, support notes, payment-step abandonment, and post-confirmation communication signals where
  policy permits
- Use only aggregated results for product decisions unless trust-and-safety policy requires case-level review

### 3.15 Manual B2B Account GMV

Completed GMV associated with founder-approved manual B2B accounts, invoice exports, or account-managed repeat buyers.

- Track account count, jobs per account, completed GMV per account, and operator time per account
- Manual B2B results are discovery evidence, not proof that a self-serve B2B portal is ready

### 3.16 CAC Payback Estimate

Estimated months for contribution margin from an acquired customer, tasker, or account to repay acquisition and
activation cost.

- Early values may be directional until attribution is reliable
- Use contribution margin, not gross revenue
- Track paid marketing, referral incentives, discounts, manual activation labor, and partner setup time separately where
  available

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
- `platform_fee_charged`
- `platform_fee_collected`
- `rebook_requested`
- `recurring_request_created`
- `manual_b2b_account_job_completed`

KPI computation should come from backend-exported business metrics derived from canonical events and state transitions, not ad hoc dashboard SQL.

## 6. Dashboard policy

- All seven KPIs must exist on a real dashboard before launch.
- Alerts are required only for the four hard-gate metrics.
- Category is the primary launch dashboard slice.
- District remains a drilldown and diagnostic slice.
- Diagnostics such as median time to first qualified application or failure-reason splits should support the core KPIs instead of replacing them.

### 6.1 Commerce-pilot dashboard

Before a platform-fee or recurring-cleaning pilot is activated, dashboards should expose:

- booked GMV and completed GMV, separated clearly
- platform fee revenue and fee waiver counts
- payment penetration for eligible pilot bookings
- rebook rate and repeat customer rate, with cleaning as the primary read
- leakage indicator trend
- manual B2B account GMV and jobs per account if manual accounts are active

These views are for learning and rollout control. They do not turn Phase 2 commerce experiments into Phase 1 launch
requirements.

## 7. Data quality rules

1. KPI decisions are valid only when the denominator threshold for that KPI is met.
2. Denominator thresholds are evaluated per primary decision slice unless a launch review explicitly records an aggregate-only reading.
3. If core event exports are degraded, pause KPI-based go / no-go decisions until tracking is repaired and backfilled.
4. Native self-serve reporting and native confirmation success must exclude successes that occur after system-assisted or manual-assisted intervention.
5. Assisted outcomes remain in denominator populations unless a specific formula says otherwise; they do not count as native/self-serve success.
6. Commerce-pilot decisions require both economic signals and healthy category liquidity/trust signals. Revenue lift alone
   is not sufficient evidence to expand fees.
7. Platform-fee metrics must distinguish Tasky fee revenue from underlying service GMV and must not imply escrow,
   payment protection, wallet balances, or payout operations.
