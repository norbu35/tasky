# Feature: dispute

Dispute raising and resolution for bookings — user surface and admin surface.

## Purpose

Either booking participant may raise a dispute on an active or recently completed booking.
Admins resolve disputes with an outcome and notes. Evidence (chat log) is surfaced to admins.

## API Endpoints

### User-facing

| Method | Path                             | Auth | Notes                                                          |
|--------|----------------------------------|------|----------------------------------------------------------------|
| `POST` | `/api/v1/bookings/{id}/disputes` | JWT  | Raise a dispute — idempotent                                   |
| `GET`  | `/api/v1/disputes/{id}`          | JWT  | Get dispute summary (same summary shape for parties and ADMIN) |

### Admin-facing (see also `admin` module)

| Method | Path                                  | Auth        | Notes                                              |
|--------|---------------------------------------|-------------|----------------------------------------------------|
| `GET`  | `/api/v1/admin/disputes`              | JWT (ADMIN) | List pending disputes                              |
| `GET`  | `/api/v1/admin/disputes/{id}`         | JWT (ADMIN) | Get dispute with booking context and chat evidence |
| `POST` | `/api/v1/admin/disputes/{id}/resolve` | JWT (ADMIN) | Resolve dispute — idempotent                       |

## Request / Response Shapes

### `POST /api/v1/bookings/{id}/disputes`

```json
// Request
{
  "reason": "string (10–2000 chars)"
}
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)

// Response 201 — DisputeSummary
{
  "id": "uuid",
  "booking_id": "uuid",
  "status": "OPEN",
  "reason": "string",
  "created_at": "ISO-8601"
}
```

### `GET /api/v1/disputes/{id}` — Participant view (summary)

```json
{
  "id": "uuid",
  "booking_id": "uuid",
  "status": "OPEN|RESOLVED_CUSTOMER|RESOLVED_TASKER|ESCALATED",
  "reason": "string",
  "created_at": "ISO-8601"
}
```

### Admin dispute view (full)

Extends summary with: `raiser_id`, `outcome` (`RESOLVE_CUSTOMER|RESOLVE_TASKER|ESCALATE`),
`resolution_notes`, `resolved_at`.

### `POST /api/v1/admin/disputes/{id}/resolve`

```json
// Request
{
  "outcome": "RESOLVE_CUSTOMER|RESOLVE_TASKER|ESCALATE",
  "notes": "string"
}
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)

// Response 200 — full admin DisputeResponse
```

### `GET /api/v1/admin/disputes/{id}` — Response 200

```json
{
  "dispute": {
    admin
    DisputeResponse
  },
  "booking": {
    "id": "...",
    "task_id": "...",
    "tasker_id": "...",
    "customer_id": "...",
    "status": "...",
    "updated_at": "..."
  },
  "conversation_id": "uuid|null",
  "evidence_messages": [
    {
      "id": "...",
      "sender_id": "...",
      "content": "...",
      "sent_at": "..."
    }
  ]
}
```

## Error Codes

| Code                         | HTTP | Trigger                                                           |
|------------------------------|------|-------------------------------------------------------------------|
| `BOOKING_NOT_FOUND`          | 404  | Booking does not exist (response body currently empty)            |
| `FORBIDDEN`                  | 403  | Caller is not a participant in the booking                        |
| `INVALID_REASON`             | 400  | Reason is blank or too short                                      |
| `INVALID_STATUS`             | 400  | Booking is not `ASSIGNED` or `COMPLETED`                          |
| `DISPUTE_WINDOW_EXPIRED`     | 400  | Completed booking is older than 24 hours                          |
| `DISPUTE_EXISTS`             | 409  | A dispute already exists for this booking                         |
| `IDEMPOTENCY_IN_PROGRESS`    | 409  | Concurrent identical request in flight                            |
| `IDEMPOTENCY_REPLAY_MISSING` | 409  | Previous idempotent request record found but resource unavailable |

Admin resolve path (`POST /api/v1/admin/disputes/{id}/resolve`) currently returns
`{ "error": "..." }` for several validation failures (`NOT_OPEN`, `BOOKING_NOT_FOUND`,
`INVALID_OUTCOME`) instead of structured `code` envelopes.

## Idempotency

| Endpoint                            | Operation key     |
|-------------------------------------|-------------------|
| `POST /bookings/{id}/disputes`      | `dispute.raise`   |
| `POST /admin/disputes/{id}/resolve` | `dispute.resolve` |

## Dispute Eligibility Window

- `ASSIGNED` bookings: can be disputed at any time.
- `COMPLETED` bookings: dispute must be raised within **24 hours** of completion.

## Analytics Events

Raising a dispute emits `DISPUTE_RAISED` with properties: `booking_id`, `dispute_id`, `task_id`.

## Cross-Module Dependencies

- `BookingService` — booking lookup and participant validation.
- `AnalyticsService` — tracks `DISPUTE_RAISED` event.
- `MessagingService` / `ConversationDao` / `MessageDao` — chat evidence for admin view.
- `IdempotencyService` — idempotency on raise and resolve.
