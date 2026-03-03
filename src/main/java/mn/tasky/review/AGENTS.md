# Feature: review

Post-completion ratings and reviews between booking participants.

## Purpose

Allows both the Customer and the Tasker to leave a 1–5 star rating and optional text review
after a booking reaches `COMPLETED` status. Reviews contribute to the reviewer's target user's
`rating_avg` and `is_pro` badge eligibility.

## API Endpoints

| Method | Path                            | Auth | Notes                                   |
|--------|---------------------------------|------|-----------------------------------------|
| `POST` | `/api/v1/bookings/{id}/reviews` | JWT  | Submit a review for a completed booking |
| `GET`  | `/api/v1/users/{id}/reviews`    | JWT  | List all reviews received by a user     |

## Request / Response Shapes

### `POST /api/v1/bookings/{id}/reviews`

```json
// Request
{
  "rating": 5,              // integer 1–5
  "comment": "string"       // optional, max 1000 chars
}

// Response 201 — ReviewResponse
{
  "id": "uuid",
  "booking_id": "uuid",
  "author_id": "uuid",
  "target_user_id": "uuid",
  "rating": 5,
  "comment": "Great job!",
  "created_at": "ISO-8601"
}
```

### `GET /api/v1/users/{id}/reviews`

```json
// Query params: cursor (opaque), limit (1–100, default 20)
// Response 200 — PagedResponse<ReviewResponse>
{
  "data": [ { ReviewResponse } ],
  "cursor": { "next": "...", "has_more": false }
}
```

## Error Codes

| Code                    | HTTP | Trigger                                    |
|-------------------------|------|--------------------------------------------|
| `INVALID_RATING`        | 400  | Rating is outside the 1–5 range            |
| `NOT_FOUND`             | 404  | Booking does not exist                     |
| `BOOKING_NOT_COMPLETED` | 400  | Booking is not in `COMPLETED` status       |
| `FORBIDDEN`             | 403  | Caller is not a participant in the booking |
| `ALREADY_REVIEWED`      | 409  | Caller has already reviewed this booking   |

## Side Effects

- Each accepted review updates the target user's `rating_avg` in `profiles`.
- `is_pro` is derived at read-time from profile stats (`completed_tasks >= 6` and `rating_avg >= 4.5`)
  in profile projection logic (`AuthService` / DAO projections), not persisted by `ReviewService`.

## Invariants & Guards

- Only the Customer and the Tasker of the booking may submit a review.
- Each party may submit exactly one review per booking.
- Reviews are only accepted on `COMPLETED` bookings.
- `target_user_id` is inferred server-side: the review targets the other participant
  (Customer reviews Tasker and vice-versa).
