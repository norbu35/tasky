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
| `FirebasePushProvider` | *(Phase 1 — to implement)* | `tasky.push.provider=firebase` |
| `ExpoPushProvider` | transitional placeholder (Phase 0-1 only) | `tasky.push.provider=expo` |
| `LoggingPushProvider` | local dev / default | `tasky.push.provider=logging` (default) |

**Phase 0-1 current state**: `ExpoPushProvider` is active in production (`tasky.push.provider=expo` in
`application-prod.yml`). This is a transitional placeholder. The Phase 1 migration task replaces it with
`FirebasePushProvider` using the Firebase Admin SDK.

**Phase 1 migration checklist** (do not implement partially):
1. Add Firebase Admin SDK to `build.gradle.kts`
2. Implement `FirebasePushProvider` — individual sends via `FirebaseMessaging.send()`, batch via `sendMulticast()`
3. Implement server-side topic subscription in `NotificationService.registerDevice()` using the topic taxonomy in `docs/ARCHITECTURE.md §3.3`
4. Set `FIREBASE_SERVICE_ACCOUNT_JSON` env var in prod
5. Change `tasky.push.provider=firebase` in `application-prod.yml`
6. Remove `ExpoPushProvider`

## Topic Fan-out (Phase 1+)

When a Tasker registers a device token, subscribe them server-side to:
- `taskers.district.{districtSlug}`
- `taskers.category.{categorySlug}`
- `taskers.district.{districtSlug}.{categorySlug}` (primary supply activation topic)

See full taxonomy in `docs/ARCHITECTURE.md §3.3`.

## Token Format

FCM registration tokens are opaque strings obtained via `@react-native-firebase/messaging` `getToken()` on the
mobile client. Expo push tokens (`ExponentPushToken[...]`) are not valid FCM tokens and must not be stored.
