# Feature: common

Shared infrastructure — cross-cutting concerns used by all feature modules.

## Purpose

Provides reusable building blocks: pagination envelope, idempotency, security principal,
outbox event publishing, request observability, and global exception handling.
Also contains cross-domain outbox processing glue (`DomainEventOutboxProcessor`) that dispatches
selected domain events to messaging, notification, analytics, and wallet side effects.

## Sub-packages

### `api` — HTTP Response Utilities

| Class                 | Role                                                                    |
|-----------------------|-------------------------------------------------------------------------|
| `PagedResponse<T>`    | Standard list response: `{ "data": [...], "cursor": { ... } }`          |
| `CursorPagination`    | Cursor envelope: `{ "next": "string\|null", "has_more": bool }`         |
| `ApiResponseSupport`  | Factory methods for idempotency error responses and trace-ID resolution |
| `ApiExceptionHandler` | `@RestControllerAdvice` — maps exceptions to standard error JSON        |

### Standard Error Envelope

```json
{ "code": "ERROR_CODE", "message": "Human-readable message.", "trace_id": "uuid" }
```

### `idempotency` — At-Most-Once Execution Guard

Prevents duplicate execution of state-changing operations on retry.

**Operations registered in `IdempotencyOperations`:**

| Constant             | Operation Key             |
|----------------------|---------------------------|
| `ACCEPT_APPLICATION` | `task.accept_application` |
| `CANCEL_BOOKING`     | `booking.cancel`          |
| `COMPLETE_BOOKING`   | `booking.complete`        |
| `MARK_BOOKING_DONE`  | `booking.mark_done`       |
| `RAISE_DISPUTE`      | `dispute.raise`           |
| `RESOLVE_DISPUTE`    | `dispute.resolve`         |
| `INITIATE_PAYMENT`   | `payment.initiate`        |
| `REQUEST_PAYOUT`     | `wallet.request_payout`   |
| `PROCESS_PAYOUT`     | `wallet.process_payout`   |

**Flow:**

1. Controller calls `idempotencyService.claim(userId, operation, key)`.
2. Claim result is one of: `NEW` (proceed), `IN_PROGRESS` (409), `COMPLETED` (replay).
3. On success: `completeWithResource(...)` records the created resource ID.
4. On failure: `abandon(...)` releases the claim so the client can retry.

**Storage:** `idempotency_keys` table — unique index on `(user_id, operation, idempotency_key)`.

**Idempotency-Key header:** Required in current implementation for all supporting endpoints.
`IdempotencyService.requireKey(...)` returns `400` (`IDEMPOTENCY_KEY_REQUIRED`) when missing.

### `outbox` — Reliable Domain Event Publication

Postgres-backed outbox pattern for at-least-once event delivery.

| Class                        | Role                                                              |
|------------------------------|-------------------------------------------------------------------|
| `DomainEventOutboxService`   | Publishes events to `domain_outbox_events` table                  |
| `OutboxEventTypes`           | String constants for event type names (e.g., `BOOKING_COMPLETED`) |
| `DomainEventOutboxProcessor` | Scheduled poller that claims/processes pending events             |

Events are persisted in the same transaction as the state change, then processed asynchronously.

Current processor handles these event types:

- `TASK_APPLICATION_ACCEPTED`
- `PAYMENT_CONFIRMED`
- `BOOKING_COMPLETED`

**Table:** `domain_outbox_events` — columns: `id`, `event_type`, `aggregate_type`, `aggregate_id`,
`payload` (JSONB), `status` (`PENDING|PROCESSING|PROCESSED|FAILED`), `attempts`, `available_at`,
`created_at`, `processed_at`, `last_error`.

Indexed on `(status, available_at, created_at)` for efficient polling by the processor.

### `security` — JWT Authentication & Field-Level Encryption

#### JWT

| Class             | Role                                                  |
|-------------------|-------------------------------------------------------|
| `JwtPrincipal`    | Immutable principal: `userId()`, `role()`, `status()` |
| `JwtTokenService` | Issues (HS256) and validates access + refresh tokens  |

Authentication header: `Authorization: Bearer <jwt>`

Security filter enforces:

1. JWT signature and expiry validation.
2. `users.status` DB check on every request — banned/suspended users are rejected even with a valid JWT.

#### Field-Level Encryption (NFR-SEC-01)

`CryptoService` provides AES-256-GCM authenticated encryption and HmacSHA256 blind-index
hashing. It is used for all PII stored in the database.

| Table            | Column                                  | Treatment                                                          |
|------------------|-----------------------------------------|--------------------------------------------------------------------|
| `users`          | `phone`                                 | AES-256-GCM encrypted; IV prepended, Base64-encoded                |
| `users`          | `phone_blind_idx`                       | HmacSHA256 blind index; enables equality search without decryption |
| `otp_challenges` | `phone_blind_idx`                       | Same HmacSHA256 scheme                                             |
| `verifications`  | `id_card_front_key`, `id_card_back_key` | Storage keys only; actual image bytes live in private S3 bucket    |

**Cipher details:** AES/GCM/NoPadding, 12-byte random IV per encryption, 128-bit auth tag.

**Required configuration:**

| Property                         | Requirement                        |
|----------------------------------|------------------------------------|
| `tasky.security.encryption-key`  | Base64-encoded 32-byte AES-256 key |
| `tasky.security.blind-index-key` | UTF-8 string, minimum 32 bytes     |

Both keys must be supplied as environment variables (`TASKY_ENCRYPTION_KEY`,
`TASKY_BLIND_INDEX_KEY`); the application fails to start if either is absent or undersized.

### `observability` — Request Tracing

`RequestObservabilityFilter` populates MDC on every request:

| MDC Key          | Header Source                                        | Purpose                                   |
|------------------|------------------------------------------------------|-------------------------------------------|
| `trace_id`       | `X-Trace-Id` (or auto-generated)                     | Correlates logs and error responses       |
| `correlation_id` | `X-Correlation-Id` (or auto-generated)               | Client-provided/request-level correlation |
| `locale`         | `Accept-Language`                                    | i18n locale for analytics and responses   |
| `platform`       | `X-Client-Platform` (fallback: User-Agent inference) | Client platform for analytics             |

### `persistence` — Database Utilities

`UuidHelper` — converts `String` ↔ `UUID` with validation; throws on invalid input.

### `validation` — Custom Constraints

`TextSanitizer` provides lightweight plain-text sanitation used by task/review/dispute/messaging flows.
Most schema/shape validation is performed via standard JSR-380 annotations in feature DTOs.

**Mongolian text (NFR-LOC-01):** User-generated content (task descriptions, review comments,
dispute reasons) is stored and returned as-is with no server-side Cyrillic normalization.
Unicode NFC normalization and character set validation are the responsibility of the client.
The server enforces only length constraints and non-blank rules; it does not reject or normalize
Mongolian Cyrillic input.

**Accessibility (NFR-UI-02):** WCAG 2.1 AA keyboard navigation and contrast requirements are
enforced at the frontend layer only. There is no backend API surface for this NFR.
See `ARCHITECTURE.md §7.3–7.5` for the test-ID naming convention and CI gate definition.

### `config` — Framework Configuration

WebSocket/STOMP channel interceptor: injects `JwtPrincipal` into WebSocket sessions for
`@AuthenticationPrincipal` support in `@MessageMapping` handlers.

## Pagination Contract (All list endpoints)

```json
{
  "data": [ ... ],
  "cursor": {
    "next": "opaque-string | null",
    "has_more": true | false
  }
}
```

Query params: `cursor` (opaque, pass-through), `limit` (default varies, max 100).

## Global Exception Mapping

| Exception                         | HTTP   | Code                                                                                                                |
|-----------------------------------|--------|---------------------------------------------------------------------------------------------------------------------|
| `RateLimitExceededException`      | 429    | Dynamic (`OTP_REQUEST_RATE_LIMITED`, `OTP_VERIFY_RATE_LIMITED`, `TOKEN_REFRESH_RATE_LIMITED`, `OAUTH_RATE_LIMITED`) |
| `FacebookAuthException`           | 401    | Dynamic (`FACEBOOK_TOKEN_INVALID`, `FACEBOOK_TOKEN_MISMATCH`)                                                       |
| `AccountRestrictedException`      | 403    | `ACCOUNT_RESTRICTED`                                                                                                |
| `IdempotencyException`            | varies | (set on exception)                                                                                                  |
| `ConstraintViolationException`    | 400    | `VALIDATION_ERROR`                                                                                                  |
| `MethodArgumentNotValidException` | 400    | `VALIDATION_ERROR`                                                                                                  |
| `HttpMessageNotReadableException` | 400    | `INVALID_JSON`                                                                                                      |
| `IllegalArgumentException`        | 400    | `INVALID_ARGUMENT`                                                                                                  |
