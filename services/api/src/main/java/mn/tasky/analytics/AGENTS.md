# Feature: analytics

Internal event tracking and KPI reporting. No public HTTP endpoints.

## Internal Services

- `AnalyticsService.track(eventName, userId, properties)`
- `AnalyticsService.getEvents()`

## Event Constants

- `TASK_POSTED`
- `APPLICATION_SUBMITTED`
- `TASKER_ACCEPTED`
- `BOOKING_CONFIRMED`
- `PAYMENT_INITIATED`
- `PAYMENT_CONFIRMED`
- `BOOKING_COMPLETED`
- `DISPUTE_RAISED`

## Enrichment Behavior

`AnalyticsService` enriches events with MDC values when present:

- `correlation_id`
- `locale` (defaults to `mn`)
- `platform` (defaults to `UNKNOWN`)

## Storage

- Persisted via `AnalyticsEventDao` to `analytics_events`.
- `getEvents()` returns all recorded events.

## Emitters (current code)

- `TaskCreationService`: `TASK_POSTED`
- `TaskApplicationService`: `APPLICATION_SUBMITTED`
- `PaymentService`: `PAYMENT_INITIATED`
- `DisputeController`: `DISPUTE_RAISED`
- Domain workflow handlers (via `EventWorkerConsumer`): `TASKER_ACCEPTED`, `BOOKING_CONFIRMED`, `PAYMENT_CONFIRMED`, `BOOKING_COMPLETED`
