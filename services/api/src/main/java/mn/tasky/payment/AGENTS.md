# Feature: payment

Escrow payment intent initiation and QPay callback processing.

## Implemented API

| Method | Path                                      | Notes                                          |
|--------|-------------------------------------------|------------------------------------------------|
| `POST` | `/api/v1/payments/bookings/{id}/initiate` | Customer initiates booking payment; idempotent |
| `POST` | `/api/v1/payments/qpay/callback`          | Gateway callback (public endpoint)             |

## Feature Flag

Both flows are gated by `escrow_enabled`.
When disabled, controllers return `503 FEATURE_DEFERRED`.

## Initiate Flow Rules

- Caller must be booking customer.
- Booking must be `ASSIGNED`.
- `liability_disclaimer_accepted` must be `true`.
- Flow is Phase 3+ escrow-gated; direct settlement remains canonical for Phase 0-2.
- Creates payment intent and returns synthetic `payment_url` + `qr_code`.

## Callback Rules

`PaymentService.processCallback(...)` accepts only when:

- signature is valid (`HMAC-SHA256` over `paymentId|status|timestamp`)
- callback timestamp is within configured age window
- status is `PAID`
- payment intent exists

On first accepted callback:

- marks payment intent processed
- transitions booking `ASSIGNED -> PAID`
- ensures task status assigned
- publishes outbox event `PAYMENT_CONFIRMED`

Repeated callback for already-processed payment returns success (`true`) without reapplying side effects.

## Idempotency

| Endpoint                                | Operation key      |
|-----------------------------------------|--------------------|
| `POST /payments/bookings/{id}/initiate` | `payment.initiate` |
