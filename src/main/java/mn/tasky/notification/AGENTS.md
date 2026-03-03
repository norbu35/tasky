# Feature: notification

Device token registration and push notification delivery.

## Purpose

Manages device tokens for FCM/Expo push notifications and SMS fallback.
Other modules call `NotificationService` directly (internal API) to trigger notifications.
The REST endpoints here handle only device token lifecycle.

## API Endpoints

| Method   | Path                                    | Auth | Notes                          |
|----------|-----------------------------------------|------|--------------------------------|
| `POST`   | `/api/v1/notifications/devices`         | JWT  | Register a device push token   |
| `DELETE` | `/api/v1/notifications/devices/{token}` | JWT  | Unregister a device push token |

## Request / Response Shapes

### `POST /api/v1/notifications/devices`

```json
// Request
{ "token": "string (non-blank)", "platform": "IOS|ANDROID|WEB" }

// Response 200
{ "message": "Device registered successfully." }
```

### `DELETE /api/v1/notifications/devices/{token}` — Response 204 (no content)

## Notification Events (Internal, triggered by other modules)

The following push notifications are sent by `NotificationService` in response to domain events:

| Trigger                                             | Recipient           | Title / Type                                            |
|-----------------------------------------------------|---------------------|---------------------------------------------------------|
| Tasker applied to task                              | Customer            | "New Applicant" / `TASKER_APPLIED`                      |
| Application accepted                                | Tasker              | "You are hired!" / `HIRED`                              |
| Tasker marks job done                               | Customer            | "Tasker marked job complete" / `TASKER_MARKED_COMPLETE` |
| New open task matching Tasker's categories/location | Tasker (candidates) | "New task nearby" / `MATCHING_TASK_NEARBY`              |
| Payment confirmed                                   | Customer + Tasker   | "Booking Confirmed" / `BOOKING_CONFIRMED`               |
| Booking completed                                   | Tasker              | "Job Complete" / `JOB_COMPLETED`                        |

SMS fallback is sent only when the user has no registered device tokens and the notification
type is `HIRED` or `BOOKING_CONFIRMED`.
Current implementation writes fallback directly to `notification_log` (channel `SMS`) and does
not route fallback through an outbox queue.

## Storage

- `device_tokens` table: `user_id`, `token`, `platform`, `created_at`.
- `notification_log` table: records every notification attempt with `user_id`, `type`, `channel` (`PUSH|SMS`), `status`.

## Invariants & Guards

- A device token belongs to the authenticated user; cross-user registration is not allowed.
- Deleting a token that does not exist is a no-op (idempotent).
- Platform must be one of: `IOS`, `ANDROID`, `WEB`.
