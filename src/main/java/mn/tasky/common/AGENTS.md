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
- `dispute.raise`
- `dispute.resolve`
- `payment.initiate`
- `wallet.request_payout`
- `wallet.process_payout`

`Idempotency-Key` is required by `IdempotencyService.requireKey(...)`.

## Outbox

- `DomainEventOutboxService` persists events.
- `DomainEventOutboxProcessor` scheduled poller dispatches:
    - `TASK_APPLICATION_ACCEPTED`
    - `PAYMENT_CONFIRMED`
    - `BOOKING_COMPLETED`

Processor side effects include messaging bootstrap, notifications, analytics tracking, and wallet crediting.

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
