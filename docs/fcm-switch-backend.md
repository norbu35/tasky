# FCM Switch — Backend Context

## What exists now

The backend push provider abstraction is already well-structured. `PushNotificationProvider` is a single-method interface (`sendPush`). `NotificationService` delegates to it and handles idempotent logging via `notification_log.event_key`.

**Active provider:** `ExpoPushProvider`
- Activated by `tasky.push.provider=expo` (current config)
- Sends single-ticket HTTP requests to `https://exp.host/--/api/v2/push/send`
- Accepts `ExponentPushToken[...]` format tokens only
- No topic fan-out capability

**Logging provider:** `LoggingPushProvider`
- Available for local dev / test environments
- Activated when `tasky.push.provider` is not `expo`

**Device token storage:** `device_tokens` table, accessed via `DeviceTokenDao`
- Upserted per user/platform on `NotificationService.registerDevice()`
- Platform constrained to `IOS | ANDROID | WEB` (V14 migration)
- No topic subscription side-effect today

**Notification log:** `notification_log` table with `event_key` for idempotency

---

## What needs to be built

### 1. `FirebasePushProvider` (new class)

Implements `PushNotificationProvider`. Activated by `tasky.push.provider=firebase`.

- Uses Firebase Admin SDK (`com.google.firebase:firebase-admin`)
- Reads `FIREBASE_SERVICE_ACCOUNT_JSON` env var to initialize `FirebaseApp`
- Calls `FirebaseMessaging.getInstance().send(Message)` for individual delivery
- Must map the existing `platform` field to FCM-appropriate message builder (Android vs. APNS config)
- Returns `NotificationResult` (success/failure + message ID) same as `ExpoPushProvider`

### 2. Topic subscription on device registration

`NotificationService.registerDevice()` currently just upserts the token.
When `FirebasePushProvider` is active, it must also call `FirebaseMessaging.subscribeToTopic()` for:

| User role | Topics |
|---|---|
| TASKER | `taskers.district.{slug}`, `taskers.category.{slug}`, `taskers.district.{slug}.{category}` |
| Both | `platform.all` |
| Future (Phase 2+) | `customers.churned.{category}` (reactivation campaigns) |

District and category slugs must be resolved from the user's profile / registration data at token registration time. The user's role is available from the JWT / `device_tokens` join.

### 3. Topic fan-out send method (new interface method or separate service)

The existing `PushNotificationProvider` interface only supports single-device sends.
A topic-based send path is needed for supply activation ("new task posted → all nearby taskers"):

```
void sendToTopic(String topic, String title, String body, Map<String, String> data)
```

Either extend the interface or add a `TopicNotificationService` alongside `NotificationService`.

### 4. Config and credentials

- Add `firebase-admin` dependency to `build.gradle`
- Add `tasky.push.provider` property documentation in `application.yml`
- `FIREBASE_SERVICE_ACCOUNT_JSON`: full JSON service account key, injected as env var
- No code change required in `NotificationController` or `NotificationService`'s call sites

### 5. Remove / retire

- `ExpoPushProvider` — delete after cutover confirmed in production
- `tasky.push.expo-access-token` config property — no longer needed

---

## What does NOT change

- `NotificationService` call sites throughout the codebase (booking, task, dispute events) — they call `sendPush()` via the interface; provider swap is transparent
- `NotificationController` (`POST /notifications/devices`, `DELETE /notifications/devices/{token}`) — API unchanged
- `notification_log` idempotency logic — unchanged
- `device_tokens` table schema — unchanged (token column stores whatever token the mobile layer provides)

---

## Switch mechanism

Flip `tasky.push.provider=firebase` + inject `FIREBASE_SERVICE_ACCOUNT_JSON` in the deployment environment. No redeploy of logic required beyond the new provider class.

Current provider value is set in `application.yml` (or environment override). Check `src/main/resources/` for the current value before cutover.

---

## Risk / notes

- Existing `device_tokens` rows contain `ExponentPushToken[...]` values. These are not usable with FCM. After mobile cutover, users will re-register with FCM tokens on next app open. Old Expo tokens in the table will start receiving 404/error responses from FCM and should be pruned via the existing `unregisterDevice` error-handling path (or a one-time cleanup migration).
- Topic subscription requires knowing district and category at registration time. If this data isn't available on the `registerDevice` call, a deferred subscription job or a lazy-subscription approach is needed.
- Firebase Admin SDK initialization is a process singleton — must be guarded against double-init if the app context restarts.

---

## What was built (completed 2026-03-21)

All items in "What needs to be built" are now implemented on branch `feat/fcm-backend-switch`:

- **Flyway V15**: `districts` table (seeded with 9 UB düüregs) + `tasker_service_districts` join table
- **`FirebasePushProvider`**: `@ConditionalOnProperty(tasky.push.provider=firebase)` — individual send (Android/APNS configs), topic subscription, topic fan-out
- **`PushNotificationProvider` interface**: extended with `subscribeToTopics` and `sendToTopic` default no-ops
- **`LoggingPushProvider`**: overrides both new methods with logging no-ops (dev unchanged)
- **`ServiceAreaController`**: `GET/PUT /api/v1/taskers/me/service-areas` — Tasker selects their service districts; drives FCM topic subscription slugs
- **`NotificationService.registerDevice()`**: after token upsert, subscribes Taskers to `platform.all`, `taskers.district.{slug}`, `taskers.category.{slug}`, and cross-product topics
- **Config**: `application.yml` dev default is `logging`; `application-prod.yml` default is `firebase`; `FIREBASE_SERVICE_ACCOUNT_JSON` env var required in production
- **`ExpoPushProvider`**: deleted

**Production activation still required (ops task):** Firebase project creation, APNs key config, `FIREBASE_SERVICE_ACCOUNT_JSON` secret injection.
**Category slugs note:** derived at runtime via `lower(replace(name, ' ', '-'))` — add a `slug` column to `categories` in a future migration for canonical slugs.
