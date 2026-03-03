# Feature: wallet

Internal Tasker wallet — balance, ledger, and payout requests. **Post-MVP, feature-flagged.**

## Purpose

Tracks Tasker earnings as credits after job completion and allows them to request payouts.
All endpoints return `503 FEATURE_DEFERRED` while `tasky.features.monetization-enabled=false`.

## API Endpoints

| Method | Path                          | Auth | Role              | Notes                         |
|--------|-------------------------------|------|-------------------|-------------------------------|
| `GET`  | `/api/v1/wallet`              | JWT  | Any authenticated | Get wallet balance            |
| `POST` | `/api/v1/wallet/payouts`      | JWT  | Any authenticated | Request a payout — idempotent |
| `GET`  | `/api/v1/wallet/transactions` | JWT  | Any authenticated | List ledger entries           |

## Request / Response Shapes

### `GET /api/v1/wallet` — Response 200

```json
{ "balance": 150000, "pending_payout": 50000, "currency": "MNT" }
```

### `POST /api/v1/wallet/payouts`

```json
// Request
{ "amount": 100000 }   // positive integer MNT
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)

// Response 200
{ "id": "uuid", "status": "PENDING" }
// Response 400 — insufficient balance or invalid amount
// Response 503 — FEATURE_DEFERRED
```

### `GET /api/v1/wallet/transactions` — Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 45000,
      "type": "DEPOSIT|FEE|PAYOUT|REFUND|HOLD|RELEASE|CONFISCATE",
      "reference_id": "uuid",
      "description": "string",
      "created_at": "ISO-8601"
    }
  ],
  "cursor": { "next": null, "has_more": false }
}
```

## Error Codes

| Code                         | HTTP | Trigger                                                  |
|------------------------------|------|----------------------------------------------------------|
| `FEATURE_DEFERRED`           | 503  | Monetization feature flag is off                         |
| `IDEMPOTENCY_IN_PROGRESS`    | 409  | Concurrent identical payout request in flight            |
| `IDEMPOTENCY_REPLAY_MISSING` | 409  | Replay state exists but payout resource cannot be loaded |

## Idempotency

`POST /wallet/payouts` requires `Idempotency-Key` header (operation: `wallet.request_payout`).
Validation failures (e.g., insufficient balance, non-positive amount) currently return
`400` with `{ "error": "..." }` payloads.

## Wallet Credit Model (Post-MVP)

1. Booking completes → `BOOKING_COMPLETED` event published via outbox.
2. Event processor credits Tasker wallet: `amount = price - platform_fee`.
3. Tasker requests payout → record created in `payout_requests` (status: `PENDING`).
4. Admin processes payout on Tuesday or Friday via `POST /admin/payouts/{id}/process`.

## Payout Schedule

Fixed: **Tuesday** and **Friday** only (enforced in `AdminPayoutController`).

## Cross-Module Dependencies

- `WalletService` (application layer) is the sole business logic provider.
- Admin payout processing is handled by the `admin` module (`AdminPayoutController`).
- Wallet credits are triggered by the `BOOKING_COMPLETED` outbox event (booking module).
