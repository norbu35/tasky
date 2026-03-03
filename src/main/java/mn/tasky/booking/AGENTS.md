# Feature: booking

Booking lifecycle management — cancellation, completion, and tasker mark-done.

## Purpose

Manages state transitions on confirmed bookings (`ASSIGNED|PAID → COMPLETED|CANCELLED`).
Enforces cancellation policy, strike recording, and task status synchronisation.

## API Endpoints

| Method | Path                              | Auth           | Notes                                          |
|--------|-----------------------------------|----------------|------------------------------------------------|
| `GET`  | `/api/v1/bookings`                | JWT            | List caller's bookings (as customer or tasker) |
| `GET`  | `/api/v1/bookings/{id}`           | JWT            | Get booking — parties only                     |
| `POST` | `/api/v1/bookings/{id}/cancel`    | JWT            | Cancel booking — idempotent                    |
| `POST` | `/api/v1/bookings/{id}/complete`  | JWT (CUSTOMER) | Mark booking complete — idempotent             |
| `POST` | `/api/v1/bookings/{id}/mark-done` | JWT (TASKER)   | Tasker signals job done — idempotent           |

## Query Parameters — `GET /api/v1/bookings`

| Param    | Default | Constraints                                                                               |
|----------|---------|-------------------------------------------------------------------------------------------|
| `role`   | —       | `customer` or `tasker`; any other value falls back to participant view                    |
| `status` | —       | Free-form status filter; expected values are `ASSIGNED`, `PAID`, `COMPLETED`, `CANCELLED` |
| `cursor` | —       | Opaque pagination cursor                                                                  |
| `limit`  | `50`    | 1–100                                                                                     |

## Response Shape

### BookingResponse

```json
{
  "id": "uuid",
  "task_id": "uuid",
  "tasker_id": "uuid",
  "customer_id": "uuid",
  "price": 50000,
  "status": "ASSIGNED|PAID|COMPLETED|CANCELLED",
  "cancellation_fee": 0,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

`cancellation_fee` field exists in response shape but is not currently set by booking transitions
(typically `null`).

### `POST /bookings/{id}/mark-done` — Response 200

```json
{
  "booking": { BookingResponse },
  "tasker_marked_done_at": "ISO-8601"
}
```

## Error Codes

| Code             | HTTP | Trigger                                                 |
|------------------|------|---------------------------------------------------------|
| `NOT_FOUND`      | 404  | Booking does not exist or caller is not a party         |
| `FORBIDDEN`      | 403  | Caller is not authorised for this transition            |
| `INVALID_STATUS` | 409  | Booking is not in the required state for the transition |

## Idempotency

All state-changing endpoints require `Idempotency-Key` (enforced by `IdempotencyService`):

| Endpoint          | Operation key       |
|-------------------|---------------------|
| `POST /cancel`    | `booking.cancel`    |
| `POST /complete`  | `booking.complete`  |
| `POST /mark-done` | `booking.mark_done` |

Replay returns the latest booking state.

## Booking Status Lifecycle

```
ASSIGNED|PAID → COMPLETED   (Customer confirms via /complete)
ASSIGNED|PAID → CANCELLED   (Customer or Tasker via /cancel)
```

The `mark-done` action does **not** change booking status itself; it sets `tasker_marked_done_at`
and notifies the Customer to confirm completion.

## Cancellation Policy

- **Customer cancellation**: task transitions to `CANCELLED`.
    - If the cancellation occurs **< 4 hours** before `scheduled_at`, the backend records a
      `booking_reliability_incidents` row (`CUSTOMER_LATE_CANCEL`).
    - Current implementation does **not** assign a non-zero `bookings.cancellation_fee`.
- **Tasker cancellation**: task reverts to `OPEN`; a **strike** is recorded for the Tasker.
  3 strikes within the configured window results in an automatic suspension.

## Domain Events / Side Effects

- `POST /complete`:
    - Updates `tasks.status` → `COMPLETED`.
    - Publishes `BOOKING_COMPLETED` outbox event with `booking_id`, `task_id`, `customer_id`, `tasker_id`, `price`.
- `POST /cancel` (Tasker):
    - Reopens task (status → `OPEN`) via `TaskService`.
    - Adds a strike to the Tasker via `AuthService`.
- `POST /cancel` (Customer):
    - Transitions task to `CANCELLED` via `TaskService`.
- `POST /mark-done`:
    - Sends push notification ("Tasker marked job complete") to Customer.

## Cross-Module Dependencies

- `TaskService` — task status transitions on cancel and complete.
- `AuthService` — strike recording on Tasker cancellation.
- `NotificationService` — push on mark-done.
- `DomainEventOutboxService` — reliable `BOOKING_COMPLETED` event publication.
- `IdempotencyService` — idempotency on all state-changing operations.

## Invariants & Guards

- Only the booking parties (customer or tasker) may view or mutate a booking.
- Only the **Customer** may call `/complete`.
- Only the **Tasker** may call `/mark-done`.
- Either party may call `/cancel`.
- Booking must be `ASSIGNED` or `PAID` to cancel or complete.
- Booking must be `ASSIGNED` (or `PAID`) to mark-done.
