# Feature: admin

Administration surface — user moderation, verification review, dispute resolution, and payout processing.

## Purpose

Provides admin-only endpoints for moderating users, approving/rejecting KYC verifications,
resolving disputes, and (post-MVP) processing payout requests.
All endpoints under `/api/v1/admin/` require ADMIN role.

## API Endpoints

### User Management

| Method | Path                                | Notes                                                                       |
|--------|-------------------------------------|-----------------------------------------------------------------------------|
| `GET`  | `/api/v1/admin/users?phone={phone}` | Search users by normalized phone equality via blind index; cursor-paginated |
| `POST` | `/api/v1/admin/users/{id}/ban`      | Ban a user                                                                  |
| `POST` | `/api/v1/admin/users/{id}/unban`    | Unban a user                                                                |

### KYC Verification

| Method | Path                                       | Notes                                        |
|--------|--------------------------------------------|----------------------------------------------|
| `GET`  | `/api/v1/admin/verifications/pending`      | List pending verifications; cursor-paginated |
| `POST` | `/api/v1/admin/verifications/{id}/approve` | Approve a verification                       |
| `POST` | `/api/v1/admin/verifications/{id}/reject`  | Reject a verification with a reason          |

### Dispute Management

| Method | Path                                  | Notes                                              |
|--------|---------------------------------------|----------------------------------------------------|
| `GET`  | `/api/v1/admin/disputes`              | List pending disputes; cursor-paginated            |
| `GET`  | `/api/v1/admin/disputes/{id}`         | Get dispute with booking context and chat evidence |
| `POST` | `/api/v1/admin/disputes/{id}/resolve` | Resolve a dispute — idempotent                     |

### Moderation Policy

| Method | Path                                     | Notes                            |
|--------|------------------------------------------|----------------------------------|
| `GET`  | `/api/v1/admin/moderation/strike-policy` | Get current Tasker strike policy |
| `PUT`  | `/api/v1/admin/moderation/strike-policy` | Update strike policy             |

### Payouts (Post-MVP, feature-flagged)

| Method | Path                                 | Notes                                          |
|--------|--------------------------------------|------------------------------------------------|
| `GET`  | `/api/v1/admin/payouts/pending`      | List pending payout requests                   |
| `POST` | `/api/v1/admin/payouts/{id}/process` | Process a payout — idempotent; only on Tue/Fri |

## Request / Response Shapes

### `POST /api/v1/admin/users/{id}/ban` and `/unban`

```json
// Request
{ "reason": "string (required)" }
// Response 200: { "status": "BANNED" } or { "status": "ACTIVE" }
// Response 404: user not found
```

### VerificationDetailResponse

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_phone": "+976...",
  "user_name": "string",
  "id_card_front_url": "https://s3.presigned.../...",  // short-lived presigned GET URL
  "id_card_back_url": "https://s3.presigned.../...",
  "status": "PENDING|APPROVED|REJECTED",
  "admin_notes": "string|null",
  "submitted_at": "ISO-8601",
  "reviewed_at": "ISO-8601|null"
}
```

### `POST /api/v1/admin/verifications/{id}/reject`

```json
// Request
{ "reason": "string (required)" }
// Response 200 — VerificationDetailResponse
// Response 404 — NOT_FOUND
// Note: current implementation collapses NOT_FOUND and NOT_PENDING into one 404 response
```

### `POST /api/v1/admin/disputes/{id}/resolve`

```json
// Request
{ "outcome": "RESOLVE_CUSTOMER|RESOLVE_TASKER|ESCALATE", "notes": "string" }
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)
// Response 200 — full admin DisputeResponse
```

### StrikePolicyResponse

```json
{
  "strike_window_days": 30,
  "strike_threshold": 3,
  "first_suspension_days": 7,
  "repeat_suspension_days": 14,
  "repeat_offense_window_days": 60,
  "auto_unsuspend_enabled": true,
  "updated_at": "ISO-8601|null"
}
```

### `PUT /api/v1/admin/moderation/strike-policy`

```json
// Request — same fields as StrikePolicyResponse (except updated_at)
// Validation: repeatSuspensionDays ≥ firstSuspensionDays
//             repeatOffenseWindowDays ≥ strikeWindowDays
// Response 200 — StrikePolicyResponse
// Response 400 — INVALID_POLICY
```

### PayoutResponse (admin)

```json
{ "id": "uuid", "user_id": "uuid", "amount": 150000, "status": "PENDING|PROCESSED", "created_at": "ISO-8601" }
```

## Error Codes

| Code                         | HTTP | Trigger                                                                  |
|------------------------------|------|--------------------------------------------------------------------------|
| `NOT_FOUND`                  | 404  | Resource does not exist                                                  |
| `NOT_PENDING`                | 409  | Verification is not in PENDING status                                    |
| `INVALID_POLICY`             | 400  | Strike policy values violate ordering constraints                        |
| `FEATURE_DEFERRED`           | 503  | Payout operation called when `tasky.features.monetization-enabled=false` |
| `IDEMPOTENCY_IN_PROGRESS`    | 409  | Concurrent identical admin request in flight                             |
| `IDEMPOTENCY_REPLAY_MISSING` | 409  | Replay state exists but resource cannot be loaded                        |

## Idempotency

| Endpoint                            | Operation key           |
|-------------------------------------|-------------------------|
| `POST /admin/disputes/{id}/resolve` | `dispute.resolve`       |
| `POST /admin/payouts/{id}/process`  | `wallet.process_payout` |

## Payout Processing Constraints (Post-MVP)

- Requires `tasky.features.monetization-enabled=true`.
- Payouts may only be processed on **Tuesday** or **Friday**; any other day returns 400.
- Idempotent via `Idempotency-Key` header (required by IdempotencyService).
- Day-rule and business validation failures currently return `{ "error": "..." }` payloads (not structured `code`
  envelopes).

## Audit Trail

Every destructive or sensitive admin action is written to the `audit_log` table:

| Action                 | Trigger                                  |
|------------------------|------------------------------------------|
| `BAN_USER`             | `POST /admin/users/{id}/ban`             |
| `UNBAN_USER`           | `POST /admin/users/{id}/unban`           |
| `APPROVE_VERIFICATION` | `POST /admin/verifications/{id}/approve` |
| `REJECT_VERIFICATION`  | `POST /admin/verifications/{id}/reject`  |

Schema: `id`, `admin_id` (UUID of the acting admin), `action` (TEXT), `target_user_id` (UUID),
`reason` (TEXT), `created_at` (TIMESTAMPTZ).

There is no public read API for the audit log. Access is at the database level only.

## Security

- All endpoints require ADMIN role (enforced by Spring Security role filter).
- ID card images are never stored or returned as public URLs. Admin views use short-lived
  presigned GET URLs generated at read time by the storage layer.

## Cross-Module Dependencies

- `AuthService` — user search, ban/unban, verification approve/reject, strike policy.
- `DisputeService` — dispute listing and resolution.
- `BookingService` — booking context for dispute detail view.
- `ConversationDao` / `MessageDao` — chat evidence for dispute admin view.
- `WalletService` — payout listing and processing (post-MVP).
- `IdempotencyService` — idempotency on resolve and process-payout.
