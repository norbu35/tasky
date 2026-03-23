# FCM Switch — Frontend (Mobile) Context

## What exists now

**Package:** `expo-notifications ~0.29.14` handles everything — permissions, token acquisition, foreground display, and Android channel setup.

**Token acquisition** (`apps/mobile/src/lib/notifications.ts`):
- `registerForPushNotificationsAsync()` calls `Notifications.getExpoPushTokenAsync({ projectId })`
- Returns `ExponentPushToken[...]` format string
- Sets up Android notification channel via `expo-notifications`
- Handles permission request flow

**Token lifecycle** (`apps/mobile/src/store/NotificationContext.tsx`):
- `NotificationProvider` wraps the app and fires on `session.accessToken` change
- Calls `registerForPushNotificationsAsync()` then posts the token to the backend via `apiClient.registerDevice()`
- Token stored in local state (`pushToken`) but not persisted; re-registered on each session

**Package already present but unused for push:** `firebase ^12.9.0` is in `package.json` but is not wired to messaging.

**No `@react-native-firebase/messaging` installed.** No `@notifee/react-native` installed.

---

## What needs to change

### 1. Add native Firebase packages

```
@react-native-firebase/app
@react-native-firebase/messaging
@notifee/react-native
```

These require native modules — **Expo Go will not work after this change**. A custom dev client (EAS Build) is required for local development.

### 2. Add Firebase credential files

- `google-services.json` → Android (placed at `apps/mobile/android/app/`)
- `GoogleService-Info.plist` → iOS (placed at `apps/mobile/ios/`)

Both should be managed as EAS secrets, not committed to the repo.

### 3. Rewrite `lib/notifications.ts`

Current: calls `Notifications.getExpoPushTokenAsync()` from `expo-notifications`.

Target:
- Use `messaging().getToken()` from `@react-native-firebase/messaging` for token acquisition
- Keep `expo-notifications` (or switch to `@notifee`) for permission request UI
- Keep Android channel setup — move to `@notifee/react-native` (Notifee replaces `expo-notifications` for channel management and foreground display)
- Return the raw FCM registration token (not `ExponentPushToken[...]`)

### 4. Foreground notification display

`expo-notifications` currently handles foreground presentation via `setNotificationHandler`.

Target: `@notifee/react-native` handles local notification display. Wire `messaging().onMessage()` (background-safe FCM listener) to `notifee.displayNotification()` for foreground delivery.

### 5. Background / quit state message handling

FCM handles background and quit-state messages automatically via the native layer when `@react-native-firebase/messaging` is installed. A headless JS task or `messaging().setBackgroundMessageHandler()` may be needed for data-only payloads.

### 6. `NotificationContext.tsx` — no structural change needed

The context just calls `registerForPushNotificationsAsync()` and posts the token. The token format changes (FCM vs. Expo) but the flow is identical. No change to the context itself unless topic subscription state needs to be exposed.

---

## What does NOT change

- `apiClient.registerDevice()` call and the `POST /notifications/devices` API — unchanged; just sends a different token string
- `NotificationCenter` UI component — displays in-app notification list from backend, unrelated to push token type
- Auth flow, session handling, and all other app logic

---

## EAS / build config changes

- `app.json` / `app.config.js`: add `@react-native-firebase/app` and `@notifee/react-native` to the plugins array
- `eas.json`: add `GOOGLE_SERVICES_JSON` and `GOOGLE_PLIST` secret references
- One EAS build per developer platform after this change (replaces ability to use Expo Go)

---

## Token migration note

Existing users have `ExponentPushToken[...]` registered with the backend. On app update, `NotificationContext` will call `registerDevice` with the new FCM token, which the backend stores. Old Expo tokens in `device_tokens` will eventually be invalidated by the backend when FCM rejects them — no explicit client-side cleanup needed.

---

## Files to touch (summary)

| File | Change |
|---|---|
| `apps/mobile/src/lib/notifications.ts` | Replace `getExpoPushTokenAsync` with `messaging().getToken()`; swap channel setup to Notifee |
| `apps/mobile/src/app/_layout.tsx` | Register FCM background handler; set up Notifee foreground display |
| `apps/mobile/package.json` | Add `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native` |
| `apps/mobile/app.json` | Add plugin entries for Firebase and Notifee |
| `apps/mobile/eas.json` | Add credential secret references |
| `apps/mobile/android/app/google-services.json` | Add (via EAS secret, not committed) |
| `apps/mobile/ios/GoogleService-Info.plist` | Add (via EAS secret, not committed) |

`NotificationContext.tsx`, `mobileApiClient.ts`, `NotificationCenter.tsx` — no changes.
