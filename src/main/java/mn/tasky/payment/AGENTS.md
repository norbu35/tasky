# Feature: payment

QPay payment initiation and callback handling. **Post-MVP, feature-flagged.**

## Purpose

Integrates with QPay to initiate QR/deeplink payments for confirmed bookings and handle
asynchronous payment callbacks. All endpoints return `503 FEATURE_DEFERRED` while
`tasky.features.monetization-enabled=false`.

## API Endpoints

| Method | Path                                      | Auth                   | Notes                                            |
|--------|-------------------------------------------|------------------------|--------------------------------------------------|
| `POST` | `/api/v1/payments/bookings/{id}/initiate` | JWT (CUSTOMER)         | Initiate QPay payment for a booking — idempotent |
| `POST` | `/api/v1/payments/qpay/callback`          | Public (HMAC-verified) | QPay webhook callback                            |

## Request / Response Shapes

### `POST /api/v1/payments/bookings/{id}/initiate`

```json
// Request
{ "liability_disclaimer_accepted": true }
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)

// Response 200
{ "payment_url": "https://qpay.mn/...", "qr_code": "base64-or-url" }

// Response 400 — DISCLAIMER_REQUIRED (must be true)
// Response 404 — NOT_FOUND (booking not found or caller not the customer)
// Response 409 — INVALID_STATUS (booking not ASSIGNED)
// Response 503 — FEATURE_DEFERRED
```

### `POST /api/v1/payments/qpay/callback`

```json
// Request — sent by QPay; HMAC signature verified server-side
{ "payment_id": "string", "status": "string", "timestamp": 1735689600, "signature": "string" }

// Response 200: { "status": "ok" }
// Response 400 — INVALID_CALLBACK (signature mismatch or processing failure)
// Response 503 — FEATURE_DEFERRED
```

## Error Codes

| Code                  | HTTP | Trigger                                               |
|-----------------------|------|-------------------------------------------------------|
| `DISCLAIMER_REQUIRED` | 400  | `liability_disclaimer_accepted` is not `true`         |
| `NOT_FOUND`           | 404  | Booking not found or caller is not the customer       |
| `INVALID_STATUS`      | 409  | Booking is not in `ASSIGNED` status                   |
| `INVALID_CALLBACK`    | 400  | QPay callback HMAC signature invalid or unprocessable |
| `FEATURE_DEFERRED`    | 503  | Monetization feature flag is off                      |

## Idempotency

`POST /payments/bookings/{id}/initiate` requires `Idempotency-Key` header
(operation: `payment.initiate`). Replay returns the existing `payment_url` and `qr_code`.

## Security

- Callback endpoint is public (QPay-initiated); **HMAC signature verification is mandatory**
  using a server-side secret key before any state change is processed.
- Liability disclaimer must be explicitly accepted (`= true`) on initiation.

## Side Effects on Successful Payment

1. Booking status transitions from `ASSIGNED` → `PAID` (intermediate state post-MVP).
2. A `PAYMENT_CONFIRMED` outbox event is published with payment/booking/task/customer/tasker IDs.
3. `PAYMENT_CONFIRMED` analytics is tracked asynchronously by `DomainEventOutboxProcessor`.
4. Tasker wallet credit (`price - platform_fee`) occurs later on `BOOKING_COMPLETED` processing,
   not during payment callback processing.

## Cross-Module Dependencies

- `BookingService` — booking lookup, disclaimer acceptance recording, status transitions.
- `PaymentService` (application layer) — QPay API integration and callback processing.
- `IdempotencyService` — initiation idempotency.
