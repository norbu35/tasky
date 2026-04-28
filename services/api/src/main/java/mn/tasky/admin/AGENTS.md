# Feature: admin

Admin-only operations for moderation, verification review, and dispute resolution.
Payout processing is a Phase 3 deferred surface (gated by `escrow_enabled`).

## Implemented API

All endpoints are under `/api/v1/admin/**` and require `ADMIN` role (enforced in `SecurityConfig`).

| Method | Path                                          | Notes                                                              |
| ------ | --------------------------------------------- | ------------------------------------------------------------------ |
| `GET`  | `/api/v1/admin/users`                         | Search by `phone`, `name`, or `facebook_id`; cursor + limit        |
| `POST` | `/api/v1/admin/users/{id}/ban`                | Ban user, writes audit log                                         |
| `POST` | `/api/v1/admin/users/{id}/unban`              | Set user status to `ACTIVE`, writes audit log                      |
| `GET`  | `/api/v1/admin/verifications/pending`         | List pending verification requests                                 |
| `POST` | `/api/v1/admin/verifications/{id}/approve`    | Approve verification (`PENDING` only)                              |
| `POST` | `/api/v1/admin/verifications/{id}/reject`     | Reject verification (`PENDING` only)                               |
| `GET`  | `/api/v1/admin/disputes`                      | List pending/open disputes                                         |
| `GET`  | `/api/v1/admin/disputes/{id}`                 | Dispute detail + booking context + up to 50 chat evidence messages |
| `POST` | `/api/v1/admin/disputes/{id}/resolve`         | Resolve dispute; idempotent                                        |
| `GET`  | `/api/v1/admin/moderation/strike-policy`      | Current moderation policy                                          |
| `PUT`  | `/api/v1/admin/moderation/strike-policy`      | Update moderation policy                                           |
| `GET`  | `/api/v1/admin/bookings/{id}`                 | Booking detail for admin inspection                                |
| `POST` | `/api/v1/admin/bookings/{id}/override-status` | Force booking status transition; idempotent                        |
| `GET`  | `/api/v1/admin/payouts/pending`               | **Deferred – Phase 3.** Pending payouts (escrow_enabled gate)      |
| `POST` | `/api/v1/admin/payouts/{id}/process`          | **Deferred – Phase 3.** Process payout (Tue/Fri only, idempotent)  |

## Behavioral Notes

- Verification approve/reject uses `AuthService`; approve sets user status to `VERIFIED`.
- `POST /api/v1/admin/disputes/{id}/resolve` accepts outcomes: `RESOLVE_TASKER`, `RESOLVE_CUSTOMER`, `ESCALATE`.
- Payout endpoints are gated by `escrow_enabled`.
- Admin payout processing exists in deferred wallet code paths and may appear in the split OpenAPI only as a
  `x-tasky-status: deferred` Phase 3 discovery surface. It is not active Phase 1 behavior.
- Some admin endpoints return mixed error envelopes (`{code,message}` and `{error}`) depending on controller path.

## Idempotency

| Endpoint                                           | Operation key      |
| -------------------------------------------------- | ------------------ |
| `POST /api/v1/admin/disputes/{id}/resolve`         | `dispute.resolve`  |
| `POST /api/v1/admin/bookings/{id}/override-status` | `booking.override` |

Missing `Idempotency-Key` causes `400 IDEMPOTENCY_KEY_REQUIRED` via `IdempotencyService`.

## Cross-Module Dependencies

- `AdminBookingCompositionService` (booking override and detail)
- `AdminDisputeCompositionService`, `AdminDisputeResolutionService`
- `AuthService` (user moderation, verification, moderation policy)
- `DisputeService`
- `BookingService`
- `ConversationDao` and `MessageDao` (dispute evidence)
- `WalletService` (payout flows)
- `IdempotencyService`
