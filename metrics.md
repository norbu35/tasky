# GigHub Marketplace Metrics Specification (Year 1–2)

## Objective

Primary Objective (Year 1):

Validate and improve marketplace liquidity.

Liquidity Definition:

A job is posted → receives response → gets assigned → gets completed → receives review.

All metrics serve this goal.

---

# 1. Event Tracking System

## 1.1 Event Storage Model

Table: `events`

Fields:

- id (UUID, PK)
- event_type (TEXT)
- actor_type (TEXT) — 'user' | 'tasker' | 'system'
- actor_id (UUID)
- entity_type (TEXT) — 'job' | 'review' | 'message' | etc
- entity_id (UUID)
- metadata (JSONB)
- created_at (TIMESTAMP)

---

## 1.2 Required Event Types

### User / Tasker Lifecycle
- user_registered
- tasker_registered
- tasker_verified
- tasker_deactivated

### Job Lifecycle
- job_posted
- job_viewed
- tasker_applied
- first_response_sent
- job_assigned
- job_started
- job_completed
- job_cancelled
- dispute_opened
- review_left

---

# 2. Core Marketplace State Model

## 2.1 Jobs Table

Fields:

- id
- category_id
- customer_id
- assigned_tasker_id (nullable)
- status — posted | assigned | in_progress | completed | cancelled
- budget_amount (numeric, nullable)
- reported_job_value (numeric, nullable)
- created_at
- assigned_at
- started_at
- completed_at
- cancelled_at

Status transitions must be enforced at service level.

---

# 3. North Star Metric

## 3.1 Category Liquidity Score

Definition:

Liquidity Score =
(Number of jobs with at least 1 response within 24h)
/
(Total jobs posted)

Measured:
- Per category
- Weekly
- Monthly

Target Year 1:
≥ 70% in core categories

---

# 4. Supply-Side Metrics (Taskers)

## 4.1 Supply Health

Track:

- Total taskers
- Active taskers (responded in last 30 days)
- Taskers per category
- Average response time
- Average applications per tasker
- Jobs completed per tasker

### Active Tasker Definition

A tasker who:
- Applied to ≥1 job OR
- Completed ≥1 job
in last 30 days.

---

## 4.2 Tasker Retention

Measure:

- 30-day retention
- 60-day retention
- 90-day retention

Retention Definition:

Tasker performs at least 1 platform action in the period.

---

# 5. Demand-Side Metrics (Customers)

## 5.1 Job Posting Metrics

Track:

- Jobs posted per day
- Jobs posted per week
- Jobs per category
- Percentage of jobs with at least 1 response
- Median time to first response
- Percentage of jobs assigned
- Percentage of jobs completed

---

## 5.2 Customer Retention

Track:

- Percentage of customers who post again within 30 days
- Repeat job frequency
- Average jobs per customer

---

# 6. Matching & Conversion Metrics

## 6.1 Marketplace Funnel

Stages:

1. Job Posted
2. ≥1 Response
3. Assigned
4. Completed
5. Reviewed

Metrics:

Response Rate =
jobs_with_response / jobs_posted

Assignment Rate =
jobs_assigned / jobs_posted

Completion Rate =
jobs_completed / jobs_posted

Review Rate =
reviews_left / jobs_completed

Target:
Completion Rate ≥ 60% in Year 1

---

# 7. Time-Based Metrics

## 7.1 Time to First Response

Definition:

first_response_timestamp - job_created_timestamp

Track:

- Median
- 75th percentile

Target:
< 6 hours in core categories

---

## 7.2 Time to Completion

Definition:

completed_at - created_at

Used for category performance comparison.

---

# 8. Quality & Risk Metrics

Track:

- Cancellation Rate
- Dispute Rate
- Average Rating per Category
- Percentage of 1-star reviews per category

Definitions:

Cancellation Rate =
jobs_cancelled / jobs_posted

Dispute Rate =
disputes_opened / jobs_completed

---

# 9. GMV (Even If Free)

Store:

reported_job_value

Definition:

GMV =
SUM(reported_job_value)

Track monthly.

Purpose:
Validate economic size of the market before monetization.

---

# 10. Category Performance Dashboard Requirements

For each category, display:

- Jobs posted
- Jobs completed
- Liquidity score
- Active taskers
- Average response time
- Completion rate
- GMV (reported)

Use this to determine which categories to:
- Invest in
- Drop
- Expand

---

# 11. Weekly Founder Review Ritual

Every week review:

1. Worst-performing category
2. Lowest liquidity percentage
3. Longest response times
4. Highest cancellation rate

Then:
Contact users in that segment to understand the cause.

Data shows where.
Conversations reveal why.

---

# 12. What NOT to Track (Year 1)

Avoid obsessing over:

- Page views
- Sessions
- Sign-up counts
- Bounce rates
- Marketing vanity metrics

Only track behavior tied to completed jobs.

---

# 13. Year 1 Survival Metric

If one metric determines survival:

Percentage of jobs receiving response within 24 hours.

If this fails → marketplace is dead.
If this succeeds → growth compounds.

---

End of Specification.

