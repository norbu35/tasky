# Feature: admin

Admin-only operations for moderation, verification review, dispute resolution, and payout processing.

## Implemented API

All endpoints are under `/api/v1/admin/**` and require `ADMIN` role (enforced in `SecurityConfig`).

| Method | Path                                       | Notes                                                                      |
|--------|--------------------------------------------|----------------------------------------------------------------------------|
| `GET`  | `/api/v1/admin/users`                      | Search by `phone` (exact normalized match via blind index), cursor + limit |
| `POST` | `/api/v1/admin/users/{id}/ban`             | Ban user, writes audit log                                                 |
| `POST` | `/api/v1/admin/users/{id}/unban`           | Set user status to `ACTIVE`, writes audit log                              |
| `GET`  | `/api/v1/admin/verifications/pending`      | List pending verification requests                                         |
| `POST` | `/api/v1/admin/verifications/{id}/approve` | Approve verification (`PENDING` only)                                      |
| `POST` | `/api/v1/admin/verifications/{id}/reject`  | Reject verification (`PENDING` only)                                       |
| `GET`  | `/api/v1/admin/disputes`                   | List pending/open disputes                                                 |
| `GET`  | `/api/v1/admin/disputes/{id}`              | Dispute detail + booking context + up to 50 chat evidence messages         |
| `POST` | `/api/v1/admin/disputes/{id}/resolve`      | Resolve dispute; idempotent                                                |
| `GET`  | `/api/v1/admin/moderation/strike-policy`   | Current moderation policy                                                  |
| `PUT`  | `/api/v1/admin/moderation/strike-policy`   | Update moderation policy                                                   |
| `GET`  | `/api/v1/admin/payouts/pending`            | Pending payouts (feature-flagged)                                          |
| `POST` | `/api/v1/admin/payouts/{id}/process`       | Process payout (feature-flagged, Tue/Fri only, idempotent)                 |

## Behavioral Notes

- Verification approve/reject uses `AuthService`; approve sets user status to `VERIFIED`.
- `POST /admin/disputes/{id}/resolve` accepts outcomes: `RESOLVE_TASKER`, `RESOLVE_CUSTOMER`, `ESCALATE`.
- Payout endpoints are gated by `tasky.features.monetization-enabled`.
- `POST /admin/payouts/{id}/process` also enforces weekday rule: Tuesday or Friday only.
- Some admin endpoints return mixed error envelopes (`{code,message}` and `{error}`) depending on controller path.

## Idempotency

| Endpoint                                   | Operation key           |
|--------------------------------------------|-------------------------|
| `POST /api/v1/admin/disputes/{id}/resolve` | `dispute.resolve`       |
| `POST /api/v1/admin/payouts/{id}/process`  | `wallet.process_payout` |

Missing `Idempotency-Key` causes `400 IDEMPOTENCY_KEY_REQUIRED` via `IdempotencyService`.

## Cross-Module Dependencies

- `AuthService` (user moderation, verification, moderation policy)
- `DisputeService`
- `BookingService`
- `ConversationDao` and `MessageDao` (dispute evidence)
- `WalletService` (payout flows)
- `IdempotencyService`
