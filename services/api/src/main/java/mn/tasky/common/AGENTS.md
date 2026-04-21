# Feature: common

Cross-cutting infrastructure used by all modules.

## HTTP / API Utilities

- `PagedResponse<T>` and `CursorPagination`
- `ApiResponseSupport` for trace-id and idempotency helpers
- `ApiExceptionHandler` global error mapping

Global handler maps:

- `RateLimitExceededException -> 429`
- `FacebookAuthException -> 401`
- `AccountRestrictedException -> 403`
- `IdempotencyException -> status from exception`
- validation exceptions -> `400 VALIDATION_ERROR`
- malformed JSON -> `400 INVALID_JSON`
- `IllegalArgumentException -> 400 INVALID_ARGUMENT`

## Idempotency Infrastructure

Operations in `IdempotencyOperations`:

- `task.accept_application`
- `booking.cancel`
- `booking.complete`
- `booking.mark_done`
- `booking.no_show_flag`
- `booking.reschedule_request`
- `booking.reschedule_respond`
- `dispute.raise`
- `dispute.resolve`
- `payment.initiate`
- `wallet.request_payout`
- `wallet.process_payout`

`Idempotency-Key` is required by `IdempotencyService.requireKey(...)`.

## Outbox

- **Two-path publish model:**
  - **Direct publish (happy path):** `DomainEventOutboxService` persists events to `domain_outbox_events`
    and, when `tasky.automation.broker.enabled=true`, immediately publishes to RabbitMQ via
    `EventRelayPublisher`. On successful publish, the row is marked `PROCESSED` in the same call.
  - **Relay recovery (failure path):** `OutboxRelayScheduler` runs every 10 s (ShedLock-guarded) and
    delegates to `OutboxRelayService`, which claims `PENDING`/`FAILED` rows, republishes, and marks them
    `PROCESSED` or `FAILED`. Failed events use exponential backoff (30 s base, 1 h max) with configurable
    max attempts (default 10). The old `DomainEventOutboxProcessor` polling relay is **retired**.
- **At-least-once delivery:** Direct publish on the happy path, relay recovery for failures.
  Handler-level idempotency via `WorkflowIdempotencyGuard` handles duplicate deliveries.
- `EventWorkerConsumer` (RabbitMQ listener) dispatches to registered `EventHandler`
  implementations by event type, with retry routing via x-death headers and DLQ fallback.
- Domain workflow handlers handle:
  - `TASK_APPLICATION_ACCEPTED`
  - `PAYMENT_CONFIRMED`
  - `BOOKING_COMPLETED`

Side effects include messaging bootstrap, notifications, analytics tracking, and wallet
crediting. Broker failure does **not** roll back the domain transaction because the outbox
row is already persisted. Admin replay via `OutboxReplayController` resets `FAILED` → `PENDING`,
and the relay picks up replayed events on the next cycle.

## Security and Crypto

- JWT filter: `JwtAuthenticationFilter`
- Principal: `JwtPrincipal(userId, role, status)`
- Field-level crypto: `CryptoService` (AES-GCM encryption + HMAC blind index)
- Access/denied handlers return JSON error envelopes.

## Observability

`RequestObservabilityFilter` sets MDC / request attributes:

- `trace_id`
- `correlation_id`
- `locale`
- `platform`

## Config Endpoints

- `GET /api/v1/system/version`

## Security Path Rules (from `SecurityConfig`)

Public paths include:

- `/api/v1/system/version`
- `/api/v1/auth/facebook`
- `/api/v1/auth/facebook/status`
- `/api/v1/auth/otp/request`
- `/api/v1/auth/otp/verify`
- `/api/v1/auth/token/refresh`
- `/api/v1/payments/qpay/callback`
- `/ws`
- `/api/v1/auth/dev/login` only when dev-auth enabled

Role routes:

- `/api/v1/admin/**` -> `ADMIN`
- `/api/v1/security/customer/**` -> `CUSTOMER`
- `/api/v1/security/tasker/**` -> `TASKER`
- `/api/v1/security/admin/**` -> `ADMIN`
- `POST /api/v1/tasks` -> `CUSTOMER`
