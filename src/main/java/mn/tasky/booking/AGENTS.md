# Feature: booking

Booking lifecycle transitions and booking-side effects.

## Implemented API

| Method | Path                              | Notes                                                |
|--------|-----------------------------------|------------------------------------------------------|
| `GET`  | `/api/v1/bookings`                | List bookings for caller; role/status/cursor filters |
| `GET`  | `/api/v1/bookings/{id}`           | Only customer/tasker participants can view           |
| `POST` | `/api/v1/bookings/{id}/cancel`    | Customer or tasker; idempotent                       |
| `POST` | `/api/v1/bookings/{id}/complete`  | Customer only; idempotent                            |
| `POST` | `/api/v1/bookings/{id}/mark-done` | Tasker only; idempotent                              |

## Booking Statuses in Code

- `ASSIGNED`
- `PAID`
- `COMPLETED`
- `CANCELLED`

## Lifecycle Rules

- Complete: `ASSIGNED|PAID -> COMPLETED` (customer only)
- Cancel: `ASSIGNED|PAID -> CANCELLED` (customer or tasker)
- Mark-done: no booking status transition; writes completion signal timestamp

## Side Effects

- Customer cancel: task transitions to `CANCELLED`.
- Tasker cancel: task reopens to `OPEN` and strike is added.
- Late customer cancel (<4 hours before task schedule): reliability incident row is inserted.
- Complete: task transitions to `COMPLETED` and outbox event `BOOKING_COMPLETED` is published.
- Mark-done: sends customer push notification when newly marked.

## Idempotency

| Endpoint                        | Operation key       |
|---------------------------------|---------------------|
| `POST /bookings/{id}/cancel`    | `booking.cancel`    |
| `POST /bookings/{id}/complete`  | `booking.complete`  |
| `POST /bookings/{id}/mark-done` | `booking.mark_done` |

Missing `Idempotency-Key` causes `400 IDEMPOTENCY_KEY_REQUIRED`.

## Explicitly Not Implemented

- No no-show state or no-show endpoint transitions
- No reschedule endpoint
