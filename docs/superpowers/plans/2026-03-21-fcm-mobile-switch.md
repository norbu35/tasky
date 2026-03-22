# FCM Mobile Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `expo-notifications` push token acquisition with `@react-native-firebase/messaging` so the mobile app sends FCM tokens (not `ExponentPushToken[...]`) to the backend, and wires Notifee for foreground notification display and Android channel management.

**Architecture:** `notifications.ts` is the sole token-acquisition module — its function signature (`registerForPushNotificationsAsync(): Promise<{token?, error?}>`) stays identical so `NotificationContext.tsx` requires no changes. The root `_layout.tsx` gains two handlers: a background FCM handler (registered outside the React component) and an `onMessage` foreground listener that triggers Notifee local display. Android channel setup moves from `expo-notifications` to Notifee.

**Tech Stack:** `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native`, Expo SDK 52, EAS Build (Expo Go is no longer usable after this change — a custom dev client is required)

---

## ⚠️ Critical Prerequisites (read before starting)

1. **Expo Go is dead after Task 1.** Once native Firebase packages are installed, you cannot run the app with `npx expo start`. You must build a development client with EAS: `eas build --profile development --platform android` (or `ios`). Factor this into your testing plan.

2. **Firebase project required.** You need a Firebase project with Android and iOS apps registered. Download:
   - `google-services.json` → place at `apps/mobile/google-services.json` (relative to `app.json`)
   - `GoogleService-Info.plist` → place at `apps/mobile/GoogleService-Info.plist`
   EAS Build copies these to the native layer (`android/app/` and `ios/`) automatically using the `googleServicesFile` paths in `app.json`. Do NOT commit these files — use EAS secrets for CI/production builds (see Task 2).

3. **Testing approach.** React Native native modules cannot be unit-tested with Jest without heavy mocking. Verification for each task is TypeScript compilation (`npx tsc --noEmit`) + ESLint. End-to-end verification requires a physical device with an EAS development build. Steps that say "verify" mean compile/lint only.

4. **Working directory.** All commands run from `apps/mobile/` unless otherwise stated.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/mobile/package.json` | Modify | Add `@react-native-firebase/app`, `/messaging`, `@notifee/react-native`; remove unused `firebase` web SDK |
| `apps/mobile/app.json` | Modify | Add plugin entries for Firebase and Notifee |
| `apps/mobile/eas.json` | Create | EAS build profiles with credential secret references |
| `apps/mobile/src/lib/notifications.ts` | Modify | Replace Expo push token with FCM token; replace channel setup with Notifee; remove `setNotificationHandler` |
| `apps/mobile/src/app/_layout.tsx` | Modify | Register FCM background handler; wire `onMessage` → Notifee foreground display |

**Not changing:** `src/store/NotificationContext.tsx`, `src/lib/mobileApiClient.ts`, `src/components/NotificationCenter.tsx` (if it exists).

---

## Task 1: Install native packages

**Files:**
- Modify: `apps/mobile/package.json`

The three packages all require native modules. After this task, Expo Go stops working — you need an EAS development build.

- [ ] **Step 1: Install Firebase and Notifee packages**

From `apps/mobile/`:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native
```

`expo install` picks compatible versions automatically. If it fails (peer conflict), try:

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native
```

- [ ] **Step 2: Remove unused packages**

The `firebase ^12.9.0` web SDK is not used for push notifications. Remove it along with `expo-notifications` which is fully replaced by `@react-native-firebase/messaging` + Notifee:

```bash
npm uninstall firebase expo-notifications
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: No errors (or only pre-existing errors unrelated to push notifications).

- [ ] **Step 4: Commit**

```bash
cd ../..  # project root
git add apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "chore(mobile/deps): add @react-native-firebase + notifee, remove firebase web SDK"
```

---

## Task 2: Configure EAS + app.json plugins

**Files:**
- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json`

EAS Build uses the `plugins` array in `app.json` to run the native setup for Firebase and Notifee during the build. Without these, the native modules won't initialize.

- [ ] **Step 1: Create `eas.json`**

Create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development",
        "GOOGLE_SERVICES_JSON": "@google-services-json",
        "GOOGLE_PLIST": "@google-service-info-plist"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "GOOGLE_SERVICES_JSON": "@google-services-json",
        "GOOGLE_PLIST": "@google-service-info-plist"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "GOOGLE_SERVICES_JSON": "@google-services-json",
        "GOOGLE_PLIST": "@google-service-info-plist"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**About EAS secrets:** The `@google-services-json` / `@google-service-info-plist` references point to EAS project secrets you create once with:

```bash
eas secret:create --scope project --name google-services-json \
  --type file --value ./google-services.json
eas secret:create --scope project --name google-service-info-plist \
  --type file --value ./GoogleService-Info.plist
```

EAS injects those files into the build at the path specified by `googleServicesFile` in `app.json`. Development builds can use the local credential files directly (placed at `apps/mobile/google-services.json` and `apps/mobile/GoogleService-Info.plist`) — EAS secrets are only required for CI/production builds.

- [ ] **Step 2: Add plugins to `app.json`**

Open `apps/mobile/app.json`. The current content has no `plugins` key. Add it inside the `"expo"` object, after `"extra"`:

```json
{
  "expo": {
    "name": "Tasky",
    "slug": "tasky",
    "version": "0.1.0",
    "orientation": "portrait",
    "scheme": "tasky",
    "ios": {
      "bundleIdentifier": "mn.tasky.mobile",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "mn.tasky.mobile",
      "googleServicesFile": "./google-services.json"
    },
    "userInterfaceStyle": "light",
    "assetBundlePatterns": [
      "**/*"
    ],
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "@notifee/react-native",
        {
          "android": {
            "defaultChannelId": "default"
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "REPLACE_WITH_EAS_PROJECT_ID"
      }
    }
  }
}
```

**Note:** The `googleServicesFile` paths are relative to the `app.json` location (`apps/mobile/`). The credential files are not committed — they are added to the build environment via EAS secrets or placed locally for development builds.

- [ ] **Step 3: Verify config is valid JSON**

```bash
node -e "require('./app.json')" && echo "Valid JSON"
```

Expected: `Valid JSON`

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/mobile/app.json apps/mobile/eas.json
git commit -m "chore(mobile): add EAS build config and Firebase/Notifee plugin entries"
```

---

## Task 3: Rewrite `src/lib/notifications.ts`

**Files:**
- Modify: `apps/mobile/src/lib/notifications.ts`

This is the core swap. The function signature (`registerForPushNotificationsAsync(): Promise<{token?, error?}>`) is preserved exactly — `NotificationContext.tsx` calls this function and must not change.

**What changes:**
- Token acquisition: `Notifications.getExpoPushTokenAsync()` → `messaging().getToken()`
- Android channel setup: `Notifications.setNotificationChannelAsync()` → `notifee.createChannel()`
- Permissions: `Notifications.requestPermissionsAsync()` → `messaging().requestPermission()` (iOS) / automatic on Android
- Foreground handler: `Notifications.setNotificationHandler()` is removed (Notifee takes over this in Task 4)

- [ ] **Step 1: Replace the full content of `notifications.ts`**

```typescript
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Android notification channel — mirrors the previous expo-notifications channel.
// Called once on app start before token acquisition.
async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    await notifee.createChannel({
        id: 'default',
        name: 'Default',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 250, 250, 250],
        lights: true,
        lightColor: '#FF231F7C',
    });
}

async function requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
    }
    // Android 13+ permission is handled automatically by the Firebase SDK
    // when the first notification arrives; no explicit request needed here.
    return true;
}

interface PushRegistrationResult {
    token?: string;
    error?: string;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
    try {
        await ensureAndroidChannel();

        const granted = await requestPermission();
        if (!granted) {
            return { error: 'Permission not granted to get push token for push notification!' };
        }

        const token = await messaging().getToken();
        return { token };
    } catch (e: unknown) {
        return { error: `${e}` };
    }
}
```

**Why `expo-device` check is removed:** `messaging().getToken()` throws on simulators/emulators automatically, so the `Device.isDevice` guard is redundant. The `try/catch` handles it.

**Why `expo-constants` / `projectId` is removed:** FCM tokens don't require a project ID in the client call — the Firebase config files (`google-services.json` / `GoogleService-Info.plist`) baked into the native build carry that information.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors in `src/lib/notifications.ts`. If `@react-native-firebase/messaging` or `@notifee/react-native` types are missing, run:

```bash
npm install --save-dev @react-native-firebase/messaging @notifee/react-native
```

(Types are bundled with the packages; this should not be needed.)

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/mobile/src/lib/notifications.ts
git commit -m "feat(mobile): replace Expo push token with FCM token via @react-native-firebase/messaging"
```

---

## Task 4: Wire background + foreground handlers in `_layout.tsx`

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`

FCM requires two handlers:

1. **Background handler** — registered *outside* the React component (at module scope, before any component renders). Handles messages when the app is backgrounded or quit.
2. **Foreground handler** — registered inside the component via `useEffect`. When the app is open and a push arrives, FCM does NOT show a system notification automatically; you must call `notifee.displayNotification()` manually.

- [ ] **Step 1: Replace the full content of `_layout.tsx`**

```typescript
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotificationProvider } from '../store/NotificationContext';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

import '../utils/i18n';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Background / quit-state FCM handler.
// MUST be registered at module scope (outside any component) and before any
// other code runs. FCM delivers data-only payloads here when the app is not
// in the foreground.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // For notification messages (title + body present), FCM shows a system
    // tray notification automatically on Android. For data-only payloads,
    // display a local notification via Notifee.
    if (!remoteMessage.notification) {
        await notifee.displayNotification({
            title: remoteMessage.data?.title as string | undefined,
            body: remoteMessage.data?.body as string | undefined,
            android: { channelId: 'default' },
        });
    }
});

export default function RootLayout() {
    useEffect(() => {
        // Foreground FCM handler: when the app is open, FCM does NOT auto-display
        // a system notification. We must display it manually via Notifee.
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            await notifee.displayNotification({
                title: remoteMessage.notification?.title ?? remoteMessage.data?.title as string | undefined,
                body: remoteMessage.notification?.body ?? remoteMessage.data?.body as string | undefined,
                android: { channelId: 'default' },
                ios: {},
            });
        });
        return unsubscribe;
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NotificationProvider>
                    <QueryClientProvider client={queryClient}>
                        <Stack screenOptions={{ headerShown: false }} />
                        <StatusBar style="auto" />
                    </QueryClientProvider>
                </NotificationProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint check**

```bash
npx eslint src/app/_layout.tsx --max-warnings 0
```

Expected: No errors (warnings are acceptable if pre-existing).

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): wire FCM background handler and Notifee foreground display in root layout"
```

---

## Task 5: Credential files + EAS development build (ops / smoke test)

This task is not committed code — it's the ops steps needed to actually run and verify the app.

- [ ] **Step 1: Obtain Firebase credential files**

From the Firebase Console:
- Android: Project Settings → Your apps → google-services.json → Download
- iOS: Project Settings → Your apps → GoogleService-Info.plist → Download

Place them (locally only, do NOT commit):
- `apps/mobile/google-services.json`
- `apps/mobile/GoogleService-Info.plist`

Both are listed in `.gitignore` if not already — add them:

```bash
echo "google-services.json" >> apps/mobile/.gitignore
echo "GoogleService-Info.plist" >> apps/mobile/.gitignore
```

- [ ] **Step 2: Trigger an EAS development build**

From `apps/mobile/`:

```bash
# Android (faster to test push on Android emulator with Google Play Services)
eas build --profile development --platform android

# iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

Install the resulting `.apk` / `.ipa` on a physical device or Google Play Services emulator.

- [ ] **Step 3: Smoke test token registration**

1. Launch the app on the device
2. Log in (OTP or dev login)
3. Check the backend `device_tokens` table — the token should be an FCM token (starts with a long alphanumeric string, NOT `ExponentPushToken[...]`)
4. Check `tasker_service_districts` — if the user is a TASKER with districts selected, rows should exist

- [ ] **Step 4: Smoke test foreground notification**

Using the Firebase Console → Cloud Messaging → Send test message:
1. Send a notification to the FCM token registered in Step 3
2. With the app **open** (foreground): Notifee should display a banner
3. With the app **backgrounded**: FCM native layer should show a system tray notification

- [ ] **Step 5: Commit `.gitignore` update**

```bash
cd ../..
git add apps/mobile/.gitignore
git commit -m "chore(mobile): gitignore Firebase credential files"
```

---

## Token migration note

Existing users have `ExponentPushToken[...]` in `device_tokens`. On next app open after the update:
- `NotificationContext` fires `registerDevice()` with the new FCM token
- The backend upserts by `(user_id, platform)` key — the FCM token replaces the Expo token for the same user + platform row
- Old `ExponentPushToken[...]` rows for the same platform are overwritten — no manual cleanup needed
- Any remaining stale Expo tokens for users who haven't yet updated will fail delivery; the backend's existing error-handling path (`unregisterDevice` on FCM rejection) handles eviction naturally

---

## What does NOT change

| File | Why untouched |
|---|---|
| `src/store/NotificationContext.tsx` | Calls `registerForPushNotificationsAsync()` — same signature, no change needed |
| `src/lib/mobileApiClient.ts` | `registerDevice()` just posts `{token, platform}` — token format is opaque |
| Any `NotificationCenter` component | Displays in-app notification list from backend API, unrelated to push token type |
