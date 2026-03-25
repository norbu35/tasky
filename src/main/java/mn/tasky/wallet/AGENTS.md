# Feature: wallet

Phase 3+ wallet balances, ledger reads, payout requests, and internal wallet accounting helpers.

## Implemented API

| Method | Path                          | Notes                          |
|--------|-------------------------------|--------------------------------|
| `GET`  | `/api/v1/wallet`              | Balance + pending payout total |
| `POST` | `/api/v1/wallet/payouts`      | Request payout; idempotent     |
| `GET`  | `/api/v1/wallet/transactions` | Ledger entries                 |

## Feature Flag

All wallet endpoints are gated by `escrow_enabled`.
When disabled, controllers return `503 FEATURE_DEFERRED`.

## Payout Request Behavior

- Amount must be positive and <= available balance.
- On request, available balance is reduced immediately and payout row is created as `PENDING`.
- Admin processing happens through `admin` module endpoint `/api/v1/admin/payouts/{id}/process`.

## Idempotency

| Endpoint               | Operation key           |
|------------------------|-------------------------|
| `POST /wallet/payouts` | `wallet.request_payout` |

## Internal Service Capabilities (not directly exposed as user API)

- credit task completion earnings
- hold/release/confiscate funds
- credit refund/cancellation amounts
- process payout into ledger
