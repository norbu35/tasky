# Feature: review

Booking-based bilateral reviews and profile rating updates.

## Implemented API

| Method | Path                            | Notes                         |
| ------ | ------------------------------- | ----------------------------- |
| `POST` | `/api/v1/bookings/{id}/reviews` | Submit review                 |
| `GET`  | `/api/v1/users/{id}/reviews`    | List reviews received by user |

## Submit Rules

- Rating must be `1..5`.
- Booking must exist and be `COMPLETED`.
- Caller must be booking participant (customer or tasker).
- One review per booking per author.
- Target user is inferred as the opposite participant.
- Comment is sanitized plain text.

## Side Effects

- `AuthService.updateUserStats(targetUserId, rating, false)` updates target aggregate rating.

## Pagination

- `GET /api/v1/users/{id}/reviews` uses cursor + `limit` (controller fetches `limit+1` for `has_more`).
