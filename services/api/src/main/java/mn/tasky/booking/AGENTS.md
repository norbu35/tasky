# Feature: booking

Booking lifecycle transitions and booking-side effects.

## Implemented API

| Method | Path                                                 | Notes                                                    |
| ------ | ---------------------------------------------------- | -------------------------------------------------------- |
| `GET`  | `/api/v1/bookings`                                   | List bookings for caller; role/status/cursor filters     |
| `GET`  | `/api/v1/bookings/{id}`                              | Only customer/tasker participants can view               |
| `POST` | `/api/v1/bookings/{id}/cancel`                       | Customer or tasker; idempotent                           |
| `POST` | `/api/v1/bookings/{id}/complete`                     | Customer only; idempotent                                |
| `POST` | `/api/v1/bookings/{id}/mark-done`                    | Tasker only; idempotent                                  |
| `POST` | `/api/v1/bookings/{id}/reschedule`                   | Either party requests reschedule; idempotent             |
| `POST` | `/api/v1/bookings/{id}/reschedule/{eventId}/respond` | Counterparty accepts or declines request                 |
| `POST` | `/api/v1/bookings/{id}/no-show/flag`                 | Either party flags no-show after rule checks; idempotent |

## Booking Statuses in Code

- `ASSIGNED`
- `PAID`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

## Lifecycle Rules

- Complete: `ASSIGNED|PAID -> COMPLETED` (customer only)
- Cancel: `ASSIGNED|PAID -> CANCELLED` (customer or tasker)
- Mark-done: no booking status transition; writes completion signal timestamp
- Reschedule: request/accept/decline/expiry writes immutable `booking_schedule_events`; accepted response updates canonical schedule
- No-show: `ASSIGNED -> NO_SHOW` only after reminder/timer/activity checks pass

## Side Effects

- Customer cancel: task transitions to `CANCELLED`.
- Tasker cancel: task reopens to `OPEN`; non-safety cancellations add a `TASKER_CANCELLATION` strike and may suspend the tasker under the moderation policy.
- Late customer cancel (<4 hours before task schedule): reliability incident row is inserted.
- Complete: task transitions to `COMPLETED` and outbox event `BOOKING_COMPLETED` is published.
- Mark-done: sends customer push notification when newly marked.
- No-show: task transitions to `NO_SHOW`, writes immutable timeline + audit events, and records strike when tasker is at fault.

## Idempotency

| Endpoint                                                  | Operation key                |
| --------------------------------------------------------- | ---------------------------- |
| `POST /api/v1/bookings/{id}/cancel`                       | `booking.cancel`             |
| `POST /api/v1/bookings/{id}/complete`                     | `booking.complete`           |
| `POST /api/v1/bookings/{id}/mark-done`                    | `booking.mark_done`          |
| `POST /api/v1/bookings/{id}/reschedule`                   | `booking.reschedule_request` |
| `POST /api/v1/bookings/{id}/reschedule/{eventId}/respond` | `booking.reschedule_respond` |
| `POST /api/v1/bookings/{id}/no-show/flag`                 | `booking.no_show_flag`       |

Missing `Idempotency-Key` causes `400 IDEMPOTENCY_KEY_REQUIRED`.

## Still Outside This Module

- Instant-match offer creation and fallback ranking remain in task or matching flows, not booking state management.
