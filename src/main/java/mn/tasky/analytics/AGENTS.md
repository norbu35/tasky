# Feature: analytics

Internal business event tracking. No public API.

## Purpose

Records funnel milestones and domain events to a persistent `analytics_events` table.
Called directly by other modules via `AnalyticsService`; there is no REST controller.

## Internal API — `AnalyticsService.track()`

```java
analyticsService.track(String eventName, String userId, Map<String, Object> properties);
```

The service automatically enriches every event with:

- `correlation_id` — from MDC (set by `RequestObservabilityFilter`)
- `locale` — from MDC (`Accept-Language`), defaults to `mn`
- `platform` — from MDC (`X-Client-Platform` header or User-Agent inference), defaults to `UNKNOWN`

## Tracked Events

| Event Constant                | Name                    | Emitter                                                    |
|-------------------------------|-------------------------|------------------------------------------------------------|
| `EVENT_TASK_POSTED`           | `TASK_POSTED`           | `TaskController`                                           |
| `EVENT_APPLICATION_SUBMITTED` | `APPLICATION_SUBMITTED` | `TaskController`                                           |
| `EVENT_TASKER_ACCEPTED`       | `TASKER_ACCEPTED`       | `DomainEventOutboxProcessor` (`TASK_APPLICATION_ACCEPTED`) |
| `EVENT_BOOKING_CONFIRMED`     | `BOOKING_CONFIRMED`     | `DomainEventOutboxProcessor` (`TASK_APPLICATION_ACCEPTED`) |
| `EVENT_BOOKING_COMPLETED`     | `BOOKING_COMPLETED`     | `BookingController` (via outbox)                           |
| `EVENT_DISPUTE_RAISED`        | `DISPUTE_RAISED`        | `DisputeController`                                        |
| `EVENT_PAYMENT_INITIATED`     | `PAYMENT_INITIATED`     | `PaymentController`                                        |
| `EVENT_PAYMENT_CONFIRMED`     | `PAYMENT_CONFIRMED`     | `DomainEventOutboxProcessor` (`PAYMENT_CONFIRMED`)         |

## Standard Properties

| Property         | Description                                          |
|------------------|------------------------------------------------------|
| `task_id`        | Task UUID (where applicable)                         |
| `booking_id`     | Booking UUID (where applicable)                      |
| `correlation_id` | Request correlation ID                               |
| `locale`         | User locale (`en`, `mn`)                             |
| `platform`       | Client platform (`IOS`, `ANDROID`, `WEB`, `UNKNOWN`) |

## Storage

Events are written to the `analytics_events` table via `AnalyticsEventDao`.
The `getEvents()` method returns all recorded events (used for internal reporting).

## Cross-Module Dependencies

This module is a **leaf** dependency — it is called by other modules and depends on nothing
except its own DAO and the common `RequestObservabilityFilter` MDC context.
