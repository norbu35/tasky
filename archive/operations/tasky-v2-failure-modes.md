# Tasky V2 Failure Modes and Recovery

> **Last updated:** 2026-04-13

## 1. Outbox Event Failures

### Symptom

- `GET /api/v1/admin/outbox/summary` shows growing `failed` count
- Structured logs contain `Outbox event relay failed` warnings

### Causes

| Cause                    | Frequency              | Recovery                                                   |
| ------------------------ | ---------------------- | ---------------------------------------------------------- |
| RabbitMQ unavailable     | transient              | Automatic retry after 15s (outbox processor poll interval) |
| Workflow handler throws  | transient or permanent | See per-handler failures below                             |
| Database connection lost | transient              | Automatic retry on next poll cycle                         |

### Recovery

```bash
# Inspect failed events
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  'http://localhost:8080/api/v1/admin/outbox/events?status=FAILED'

# Replay individual event after fixing root cause
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/events/<event-id>/replay

# Replay all failed events
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/outbox/events/replay-all
```

### Prevention

- The outbox processor uses `FOR UPDATE SKIP LOCKED` — multiple poller instances are safe
- Events already persisted in the database before relay; relay is fire-and-forget
- Max 10 attempts in the outbox processor before marking as permanently failed

---

## 2. Worker Consumer Failures

### Symptom

- RabbitMQ `automation.worker` queue depth grows
- Messages move to `automation.worker.retry` (30s TTL) then `automation.worker.dlq`
- DLQ depth grows in RabbitMQ management UI

### Causes

| Cause                                | Recovery                                           |
| ------------------------------------ | -------------------------------------------------- |
| EventHandler throws RuntimeException | Automatic retry (up to 3 deaths), then DLQ         |
| Malformed message                    | Logged as warning, message rejected (no retry)     |
| No handler registered for event type | Logged as warning, message acknowledged (no retry) |

### Retry Behavior

- **Worker consumer:** uses RabbitMQ `x-death` header; default max 3 retries (`tasky.automation.worker.max-retries`)
- **Outbox processor:** uses `attempts` column; max 10 retries (`DomainEventOutboxProcessor.MAX_ATTEMPTS`)
- These are **independent** retry loops: the outbox processor relays once, and the worker consumer retries independently

### DLQ Recovery

There is no automated DLQ consumer. Manual steps:

1. Inspect DLQ in RabbitMQ management UI (`http://localhost:15672`)
2. Check application logs for the `Event processing failed` error with the `eventId`
3. Fix the root cause (code bug, provider configuration, etc.)
4. The original outbox event should show as `PROCESSED` (the outbox processor already marked it done)
   - If the outbox event is also `FAILED`, use the outbox replay endpoint
5. Purge and republish from DLQ only if the event was never processed by the outbox processor (rare)

### Known Gap: Idempotency

Workflow handlers do **not** have idempotency guards. If a message is delivered twice (network partition, consumer crash before ack), side effects may repeat. This is the same behavior as the legacy `DomainEventOutboxProcessor` — not a regression, but a known risk.

**Mitigation planned for a future tranche:** Add `eventId`-based guard tables or `ON CONFLICT` upserts to each handler.

---

## 3. Workflow Handler Failures

### TaskApplicationAcceptedHandler (`messaging.workflow`)

**What it does:** starts conversation, sends push, tracks analytics

| Failure                        | Effect                                  | Recovery                                                               |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `MessagingService` unavailable | Conversation not started                | Replay outbox event                                                    |
| Push provider unavailable      | Push not sent (analytics still tracked) | Replay outbox event                                                    |
| Analytics service unavailable  | Analytics not recorded                  | Replay outbox event (safe — analytics calls are typically append-only) |

### PaymentConfirmedHandler (`notification.workflow`)

**What it does:** sends push to both parties, tracks analytics

| Failure                       | Effect                              | Recovery            |
| ----------------------------- | ----------------------------------- | ------------------- |
| Push provider unavailable     | Neither party receives notification | Replay outbox event |
| Analytics service unavailable | Analytics not recorded              | Replay outbox event |

### BookingCompletedHandler (`wallet.workflow`)

**What it does:** credits wallet, sends push, tracks analytics, creates review cases, recomputes reliability, evaluates badges

| Failure                                    | Effect                    | Recovery                                                  |
| ------------------------------------------ | ------------------------- | --------------------------------------------------------- |
| `WalletService.creditTaskCompletion` fails | Wallet not credited       | **Critical** — replay immediately after fixing root cause |
| Push provider unavailable                  | Push not sent             | Replay outbox event                                       |
| Review case creation fails                 | Review flow not triggered | Replay outbox event                                       |
| Reliability recomputation fails            | Tasker stats stale        | Replay outbox event                                       |

**WARNING:** `BookingCompletedHandler` has the most side effects and the highest financial impact. If its wallet credit is not idempotent, double-replay could double-credit. Verify idempotency of `creditTaskCompletion` before replaying.

---

## 4. Provider Failures

### General Pattern

All providers sit behind interfaces with health checks. Provider selection is via environment variable.

| Provider                | Failure Mode                              | Detection                          |
| ----------------------- | ----------------------------------------- | ---------------------------------- |
| `FacebookOAuthProvider` | Facebook API down or token expired        | Health check fails; login failures |
| `S3StorageProvider`     | MinIO/S3 unreachable                      | Upload/download errors             |
| `QPayPaymentProvider`   | QPay webhook unreachable or HMAC mismatch | Payment callbacks fail             |
| `FirebasePushProvider`  | Firebase service account invalid          | Push delivery errors               |
| `LoggingLlmProvider`    | N/A (stub)                                | Always succeeds                    |

### Circuit Breaker

`FacebookOAuthProvider` uses a circuit breaker (`Resilience4j`). Other providers do not yet have circuit breakers — a failure in these providers propagates directly to the caller.

### Fallback Policy

- `logging` providers are always available as fallbacks for development
- Production should use real providers; no automatic failover between production providers
- If a provider is permanently unavailable, switch via environment variable and restart

---

## 5. Projection Staleness

### Symptom

- Admin verification/dispute queues show stale data
- Queue summary counts don't match actual database state

### Cause

Projections are Postgres-native views, not broker-backed. They are updated synchronously with the transaction that writes the source data.

### Recovery

- Views should always be consistent with source tables (they are queries, not materialized copies)
- If a materialized view is introduced later, add a `REFRESH MATERIALIZED VIEW` procedure to the runbook

---

## 6. Database Connection Exhaustion

### Symptom

- `HikariPool-1 - Connection is not available, request timed out`
- Application becomes unresponsive

### Configuration

| Parameter            | Default | Location          |
| -------------------- | ------- | ----------------- |
| `maximum-pool-size`  | 10      | `HIKARI_MAX_POOL` |
| `minimum-idle`       | 2       | `HIKARI_MIN_IDLE` |
| `connection-timeout` | 20s     | hardcoded         |
| `max-lifetime`       | 10m     | hardcoded         |

### Recovery

1. Check for long-running queries or uncommitted transactions
2. Check PgBouncer pool limits (runtime must not bypass PgBouncer)
3. Increase `HIKARI_MAX_POOL` if traffic has genuinely outgrown the pool
4. Kill long-running queries in PostgreSQL if they are stuck

---

## 7. Security and Auth Failures

### JWT Validation

- JWT secret configured via `TASKY_JWT_SECRET`
- Token TTL: access = 900s (15min), refresh = 1209600s (14 days)

### Symptom

- 401 on all endpoints
- Health probe `/actuator/health/liveness` still passes (it doesn't require auth)

### Recovery

1. Verify `TASKY_JWT_SECRET` matches the value used to sign tokens
2. If secret was rotated, existing tokens are invalid — users must re-login
3. Check that `RequestObservabilityFilter` is not blocking requests

### Dev Auth

- `TASKY_DEV_AUTH_ENABLED=true` enables dev auth endpoint
- Should never be enabled in production

---

## 8. Data Corruption

### Encryption

- Phone numbers and sensitive fields encrypted with `TASKY_ENCRYPTION_KEY`
- Blind indexes use `TASKY_BLIND_INDEX_KEY`

### Symptom

- `CryptoService.decrypt()` throws on valid-looking data
- Verification queue shows garbled phone numbers

### Recovery

1. Verify `TASKY_ENCRYPTION_KEY` has not changed
2. If key was rotated, data encrypted with the old key is unrecoverable without the old key
3. **Never rotate encryption keys without a migration plan**

---

## Failure Matrix

| Failure                 | Impact                     | Auto-Recovery          | Manual Recovery       | Data Loss Risk         |
| ----------------------- | -------------------------- | ---------------------- | --------------------- | ---------------------- |
| RabbitMQ down           | Async workflows paused     | Yes (on reconnect)     | Restart RabbitMQ      | No (outbox persists)   |
| Worker crash            | In-flight event lost       | Yes (outbox re-polled) | Replay via admin API  | Low                    |
| Provider timeout        | Single workflow step fails | Yes (retry loop)       | Fix provider, replay  | Depends on provider    |
| DB connection lost      | All writes fail            | No                     | Fix DB, replay outbox | No (outbox is in DB)   |
| Encryption key lost     | Encrypted data unreadable  | No                     | **None possible**     | **HIGH**               |
| Double message delivery | Duplicate side effects     | No                     | Manual correction     | Medium (wallet credit) |
