# Feature: notification

Device token registration and push notification dispatch abstraction.

## Implemented API

| Method   | Path                                    | Notes                                     |
|----------|-----------------------------------------|-------------------------------------------|
| `POST`   | `/api/v1/notifications/devices`         | Register FCM registration token (IOS\|ANDROID\|WEB) |
| `DELETE` | `/api/v1/notifications/devices/{token}` | Unregister token (call on logout)         |

## Service Behavior

- `registerDevice` upserts FCM registration token per user/platform in `device_tokens`.
- `unregisterDevice` removes token.
- `sendPush` dispatches via the active `PushNotificationProvider` and writes a `notification_log` entry.
- If user has no tokens and type is `HIRED` or `BOOKING_CONFIRMED`, SMS fallback log is written.

## Push Provider Architecture

**Chosen provider: Firebase Cloud Messaging (FCM).** See ADR-0002.

| Provider | Class | Activation |
|---|---|---|
| `FirebasePushProvider` | active production provider | `tasky.push.provider=firebase` |
| `LoggingPushProvider` | local dev / default | `tasky.push.provider=logging` (default) |

**Current state**: `FirebasePushProvider` is active in production and topic subscription is performed during device registration. `ExpoPushProvider` is no longer part of the active runtime path.

## Topic Fan-out (Phase 1+)

When a Tasker registers a device token, subscribe them server-side to:
- `taskers.district.{districtSlug}`
- `taskers.category.{categorySlug}`
- `taskers.district.{districtSlug}.{categorySlug}` (primary supply activation topic)

See full taxonomy in `docs/ARCHITECTURE.md §3.3`.

## Token Format

FCM registration tokens are opaque strings obtained via `@react-native-firebase/messaging` `getToken()` on the
mobile client. Expo push tokens (`ExponentPushToken[...]`) are not valid FCM tokens and must not be stored.
