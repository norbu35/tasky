# Tasky V2 Operations Runbook

> **Target audience:** solo engineer operating Tasky v2 in production
> **Last updated:** 2026-04-13

## Quick Reference

| Surface       | URL prefix             | Auth                     |
| ------------- | ---------------------- | ------------------------ |
| Public API    | `/api/v1/...`          | JWT (customer or tasker) |
| Admin API     | `/api/v1/admin/...`    | JWT (ADMIN role)         |
| Health probes | `/actuator/health/...` | none                     |
| Metrics       | `/actuator/prometheus` | none (scrape only)       |

## Architecture Overview

Tasky v2 is a modular monolith with four logical runtime surfaces:

```
request -> public-api / admin-api  (synchronous, request-path)
        -> command/query handlers   (narrow module ports)
        -> outbox table             (within same transaction)
        -> DomainEventOutboxProcessor (polls outbox, relays to RabbitMQ)
        -> EventWorkerConsumer      (RabbitMQ listener, dispatches to workflow handlers)
        -> workflow handlers        (domain-owned aftermath: push, analytics, wallet credit, etc.)
```

### Key Components

| Component                    | Location            | Responsibility                                                              |
| ---------------------------- | ------------------- | --------------------------------------------------------------------------- |
| `DomainEventOutboxService`   | `common.outbox`     | Writes events to `domain_outbox_events` with full context                   |
| `DomainEventOutboxProcessor` | `common.outbox`     | Polls outbox, relays to RabbitMQ (fire-and-forget, event already persisted) |
| `EventRelayPublisher`        | `automation.broker` | Publishes `AutomationEventEnvelope` to RabbitMQ                             |
| `EventWorkerConsumer`        | `automation.worker` | Consumes from `automation.worker` queue, dispatches to handlers             |
| Workflow handlers            | `*.workflow`        | Domain-owned aftermath (messaging, notification, wallet)                    |

### Context Propagation

Canonical tracing fields survive from HTTP request through async workers:

```
RequestContext -> MDC -> OutboxEvent -> AutomationEventEnvelope -> MDC (worker) -> structured logs
```

Fields: `correlation_id`, `trace_id`, `causation_id`, `command_id`, `workflow_id`, `job_id`, `actor_id`, `locale`, `platform`

## Operational Procedures

### 1. Check System Health

```bash
# Readiness (includes db, facebook, outbox)
curl http://localhost:8080/actuator/health/readiness

# Liveness
curl http://localhost:8080/actuator/health/liveness
```

### 2. Inspect Outbox State

```bash
# Summary counts
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/summary

# List failed events
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  'http://localhost:8080/api/v1/admin/outbox/events?status=FAILED&limit=50'

# Inspect a single event
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/events/<event-id>
```

### 3. Replay Failed Outbox Events

```bash
# Replay a single event (resets to PENDING, clears attempts and error)
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/events/<event-id>/replay

# Replay all failed events
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/events/replay-all
```

**What replay does:**

- Sets status back to `PENDING`, resets `attempts` to 0, clears `last_error`
- The `DomainEventOutboxProcessor` poller picks it up on the next cycle (default: every 1s)
- The event is relayed to RabbitMQ again, triggering the workflow handler again

**When replay is safe:**

- Workflow handlers should be idempotent (see Failure Modes)
- Replay is the standard recovery path for transient failures (network timeout, provider unavailable)

### 4. Check RabbitMQ Queue State

```bash
# Connect to RabbitMQ management UI (if enabled)
open http://localhost:15672

# Key queues:
#   automation.worker       — main consumer queue
#   automation.worker.retry — TTL-backed retry queue (30s TTL)
#   automation.worker.dlq   — dead-letter queue (manual inspection required)
```

### 5. Provider Health and Selection

All providers are selected via environment variables:

| Provider           | Env var                           | Default    | Options               |
| ------------------ | --------------------------------- | ---------- | --------------------- |
| Auth SMS           | `TASKY_AUTH_SMS_PROVIDER`         | `logging`  | `logging`             |
| OAuth              | `TASKY_AUTH_OAUTH_PROVIDER`       | _(empty)_  | _(empty)_, `facebook` |
| Push               | `TASKY_PUSH_PROVIDER`             | `logging`  | `logging`, `firebase` |
| SMS (notification) | `TASKY_NOTIFICATION_SMS_PROVIDER` | `logging`  | `logging`             |
| Storage            | `TASKY_STORAGE_PROVIDER`          | `s3`       | `s3`                  |
| Payment            | `TASKY_PAYMENT_PROVIDER`          | `qpay`     | `qpay`                |
| Geocoding          | `TASKY_GEOCODING_PROVIDER`        | `district` | `district`            |
| LLM                | `TASKY_LLM_PROVIDER`              | `logging`  | `logging`             |

The `logging` providers are no-op stubs that log to console — useful for local development.

### 6. Enable/Disable Broker

```yaml
# application.yml (or env var TASKY_AUTOMATION_BROKER_ENABLED)
tasky:
  automation:
    broker:
      enabled: false # default; worker path is disabled
```

When `enabled: false`:

- `EventRelayPublisher` bean is not created
- `EventWorkerConsumer` is not registered
- `DomainEventOutboxProcessor` still runs but has no relay target (events stay in outbox)
- Workflow handlers are not invoked

When `enabled: true`:

- Full async pipeline is active
- RabbitMQ connection is required at startup

### 7. Structured Log Fields

All logs include these fields when available:

| Field            | Source                        | Example    |
| ---------------- | ----------------------------- | ---------- |
| `correlation_id` | Request header or generated   | `abc-123`  |
| `trace_id`       | Request header or generated   | `def-456`  |
| `causation_id`   | Parent event's command_id     | `cmd-789`  |
| `command_id`     | Original request command      | `cmd-001`  |
| `workflow_id`    | Workflow instance ID          | `wf-001`   |
| `actor_id`       | User who initiated the action | `user-123` |
| `locale`         | Accept-Language header        | `mn`       |
| `platform`       | X-Client-Platform or UA sniff | `WEB`      |

## Deployment Checklist

1. PostgreSQL is running and accessible
2. Flyway migrations apply cleanly (`V23__outbox_context_propagation.sql`, `V24__outbox_additional_context.sql`)
3. RabbitMQ is running (if `tasky.automation.broker.enabled=true`)
4. Environment variables set for all required secrets:
   - `TASKY_JWT_SECRET`
   - `TASKY_ENCRYPTION_KEY`
   - `TASKY_BLIND_INDEX_KEY`
5. Health probes return healthy
6. Admin endpoint returns summary: `curl /api/v1/admin/outbox/summary`

## Rollback Procedure

1. Stop the application
2. Revert to the previous container image / binary
3. Do NOT roll back Flyway migrations (they are forward-only and additive)
4. If broker was newly enabled and causing issues, set `TASKY_AUTOMATION_BROKER_ENABLED=false`
5. Restart; the outbox processor will continue polling and relaying events
