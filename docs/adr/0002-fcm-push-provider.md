# ADR 0002: Firebase Cloud Messaging as Exclusive Push Provider

## Status

accepted

## Date

2026-03-21

## Context

Tasky's mobile app requires push notifications for supply activation (new task alerts to nearby Taskers),
booking lifecycle events (hired, completed, review reminders), and future geo-district fan-out.

Two candidate approaches were evaluated:

**Expo Push Notifications** — uses Expo's relay service (`exp.host`) as an intermediary to FCM/APNs.
Tokens are of the form `ExponentPushToken[xxx]` and are Expo-specific identifiers.

**Firebase Cloud Messaging (FCM) direct** — uses the Firebase Admin SDK on the backend and
`@react-native-firebase/messaging` on mobile. Tokens are raw FCM registration tokens usable for both
individual delivery and topic-based fan-out.

The initial implementation used Expo Push (`ExpoPushProvider`) as a transitional placeholder because
`expo-notifications` was already installed. However, Expo Push tokens are incompatible with FCM topics,
and topic-based fan-out is a required capability for Phase 1 supply activation.

## Decision

Use Firebase Cloud Messaging (FCM) as the exclusive push notification provider for the lifetime of the
platform. Expo Push relay is explicitly not used.

**Mobile stack:**
- `@react-native-firebase/messaging` — FCM token acquisition, topic subscriptions, background message handling
- `@notifee/react-native` — local notification display, Android notification channels, foreground presentation
- `expo-notifications` — retained only for permission request UI; token acquisition removed

**Backend stack:**
- Firebase Admin SDK — individual sends (`FirebaseMessaging.send()`), multicast, topic fan-out
- `FirebasePushProvider` implements `PushNotificationProvider`; activated via `tasky.push.provider=firebase`
- Firebase service account credentials via `FIREBASE_SERVICE_ACCOUNT_JSON` env var

**Topic taxonomy** (server-side subscription on device registration):

| Topic | Purpose |
|---|---|
| `taskers.district.{slug}` | All Taskers in a geo district |
| `taskers.category.{slug}` | All Taskers in a skill category |
| `taskers.district.{slug}.{category}` | Primary supply activation (new task posted) |
| `taskers.concierge-pool` | Founder-operated concierge dispatch |
| `customers.churned.{category}` | Inactive Customer reactivation campaigns |
| `platform.all` | System-wide announcements |

## Consequences

Positive:
1. Topic fan-out enables single-call supply activation ("new task in Zaisan → cleaning Taskers") without
   iterating device tokens, directly supporting the PRD KPI of post-to-confirmed-booking ≤ 2h.
2. No dependency on Expo's relay infrastructure or rate limits.
3. FCM is free at all volumes; no operational cost.
4. Full access to FCM delivery receipts, analytics, and silent (data-only) background pushes.
5. Clean migration path: no Expo ecosystem lock-in.

Negative:
1. Custom dev client required for local development (cannot use Expo Go with native Firebase modules).
   One-time EAS build per developer; ~30 minutes setup.
2. Requires `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) managed as EAS secrets.
3. APNs auth key must be configured in Firebase Console (one-time; requires Apple Developer account).

## Migration from ExpoPushProvider (Phase 1 task)

The Phase 0-1 production deployment runs `ExpoPushProvider` as a transitional placeholder.
The Phase 1 migration is a single focused task (estimated 3 days):

1. Firebase project setup: download credentials, configure APNs auth key
2. Add `@react-native-firebase/app` + `@react-native-firebase/messaging` + `@notifee/react-native` to mobile
3. Rewrite `apps/mobile/src/lib/notifications.ts`: replace `getExpoPushTokenAsync` with `messaging().getToken()`
4. Configure EAS to include Firebase credential files
5. Implement `FirebasePushProvider` in backend with Firebase Admin SDK
6. Add server-side topic subscription to `NotificationService.registerDevice()`
7. Set `FIREBASE_SERVICE_ACCOUNT_JSON` in prod env; flip `tasky.push.provider=firebase`
8. Remove `ExpoPushProvider`

## Alternatives Considered

1. **Stay with Expo Push permanently.**
   Rejected: Expo push tokens cannot be used with FCM topics. Topic fan-out is required for
   district-scoped supply activation (Phase 1 KPI). Switching later under pressure is higher risk.

2. **Expo Push for individual delivery + FCM direct for topics (hybrid).**
   Rejected: Requires managing two token types per device (Expo token + FCM token), two backend providers,
   and two mobile SDKs. Complexity without benefit.

3. **Implement FCM topics server-side using Expo tokens as a proxy.**
   Not possible: FCM topic subscription requires raw FCM registration tokens. Expo tokens are opaque
   to FCM's topic subscription API.
