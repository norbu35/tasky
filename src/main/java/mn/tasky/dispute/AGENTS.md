# Feature: dispute

Dispute raise/view flow for booking participants and admin resolution helpers.

## Implemented API

| Method | Path                             | Notes                                |
|--------|----------------------------------|--------------------------------------|
| `POST` | `/api/v1/bookings/{id}/disputes` | Raise dispute; idempotent            |
| `GET`  | `/api/v1/disputes/{id}`          | Participant view; admin can view any |

Admin resolution endpoints are in `admin` module.

## Raise Rules

- Reason is sanitized and must be non-empty.
- Booking must exist and caller must be customer/tasker participant.
- Booking status must be `ASSIGNED` or `COMPLETED`.
- For `COMPLETED`, dispute must be within 24 hours of booking `updated_at`.
- Only one open dispute per booking.

## Dispute Status Values Used

- Open: `OPEN`
- Resolution states: `RESOLVED_TASKER`, `RESOLVED_CUSTOMER`, `ESCALATED`

## Idempotency

| Endpoint                       | Operation key   |
|--------------------------------|-----------------|
| `POST /bookings/{id}/disputes` | `dispute.raise` |

## Admin-side Resolution Contract (service level)

`DisputeService.resolveDispute(...)` accepts outcomes:

- `RESOLVE_TASKER`
- `RESOLVE_CUSTOMER`
- `ESCALATE`

and rejects invalid outcome or non-open disputes.
