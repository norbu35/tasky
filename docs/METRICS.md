# Tasky Marketplace Metrics (Year 1–2)

## Objective

Validate and improve marketplace liquidity.

**Liquidity definition:** A task is posted → receives a response → gets assigned → gets completed → receives a review.

All metrics serve this goal.

---

## 1. North Star Metric

**Category Liquidity Score** — percentage of tasks posted that receive at least one response within 24 hours.

```
Liquidity Score = tasks_with_response_within_24h / tasks_posted
```

Measured per category, weekly and monthly.

**Year 1 target:** ≥ 70% in core categories.

**Year 1 survival gate:** If this metric fails, the marketplace is not viable.

---

## 2. Marketplace Funnel

| Stage                | Metric          | Year 1 Target    |
|----------------------|-----------------|------------------|
| Posted → Response    | Response Rate   | ≥ 70% within 24h |
| Posted → Assigned    | Assignment Rate | —                |
| Posted → Completed   | Completion Rate | ≥ 60%            |
| Completed → Reviewed | Review Rate     | —                |

```
Response Rate   = tasks_with_response / tasks_posted
Assignment Rate = tasks_assigned / tasks_posted
Completion Rate = tasks_completed / tasks_posted
Review Rate     = reviews_left / tasks_completed
```

---

## 3. Supply-Side Metrics (Taskers)

**Active tasker definition:** Applied to ≥ 1 task OR completed ≥ 1 task in the last 30 days.

Track:

- Total taskers / active taskers / taskers per category
- Average response time, applications per tasker, jobs completed per tasker
- 30 / 60 / 90-day retention (at least 1 platform action in period)

**Response time target:** < 6 hours in core categories (p75).

---

## 4. Demand-Side Metrics (Customers)

Track:

- Tasks posted per day / week, tasks per category
- Median time to first response
- % customers who post again within 30 days
- Average tasks per customer

---

## 5. Quality & Risk Metrics

```
Cancellation Rate = tasks_cancelled / tasks_posted
Dispute Rate      = disputes_opened / tasks_completed
```

Also track: average rating per category, % 1-star reviews per category.

---

## 6. GMV (Even When Free)

Store `reported_task_value` on each task. Track monthly GMV to validate economic market size before monetization is
enabled.

---

## 7. Category Performance Dashboard

Per category, display: tasks posted, tasks completed, liquidity score, active taskers, average response time, completion
rate, GMV (reported).

Use to decide which categories to invest in, drop, or expand.

---

## 8. Event Tracking Schema

### events table

| Field       | Type      | Notes                           |
|-------------|-----------|---------------------------------|
| id          | UUID PK   |                                 |
| event_type  | TEXT      | See types below                 |
| actor_type  | TEXT      | `user` \| `tasker` \| `system`  |
| actor_id    | UUID      |                                 |
| entity_type | TEXT      | `task` \| `review` \| `message` |
| entity_id   | UUID      |                                 |
| metadata    | JSONB     |                                 |
| created_at  | TIMESTAMP |                                 |

### Required event types

**User/Tasker lifecycle:** `user_registered`, `tasker_registered`, `tasker_verified`, `tasker_deactivated`

**Task lifecycle:** `task_posted`, `task_viewed`, `tasker_applied`, `first_response_sent`, `task_assigned`,
`task_started`, `task_completed`, `task_cancelled`, `dispute_opened`, `review_left`

See `NFR-OBS-01` in `docs/PRD.md` for MVP funnel event requirements.

---

## 9. What NOT to Track (Year 1)

Avoid: page views, sessions, sign-up counts, bounce rates, marketing vanity metrics.

Only track behavior tied to completed tasks.

---

## 10. Weekly Founder Review

Each week, examine:

1. Worst-performing category by liquidity score
2. Lowest liquidity percentage
3. Longest response times
4. Highest cancellation rate

Then contact users in that segment. Data shows where; conversations reveal why.
