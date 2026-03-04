# Feature: notification

Device token registration and push notification dispatch abstraction.

## Implemented API

| Method   | Path                                    | Notes                       |
|----------|-----------------------------------------|-----------------------------|
| `POST`   | `/api/v1/notifications/devices`         | Register device token (`IOS |ANDROID|WEB`) |
| `DELETE` | `/api/v1/notifications/devices/{token}` | Unregister token            |

## Service Behavior

- `registerDevice` upserts token per user/platform.
- `unregisterDevice` removes token.
- `sendPush` currently logs delivery intent and writes notification logs.
- If user has no tokens and type is `HIRED` or `BOOKING_CONFIRMED`, SMS fallback log is written.

## Important Current-State Note

- There is no external FCM/APNs provider integration in this code path yet; delivery is application-log and DB-log
  based.
