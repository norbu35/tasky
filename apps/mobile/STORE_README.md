# App Store Packaging Checklist

> Reference for publishing Tasky to Google Play and Apple App Store.

## 1. Screenshot specifications

Screenshots are required for each device size in **English (en)** and **Mongolian (mn)**.

| Store           | Device size              | Resolution  | Count (min–max) |
| --------------- | ------------------------ | ----------- | --------------- |
| Google Play     | Phone                    | 1080 × 1920 | 2–8             |
| Google Play     | 7" Tablet                | 1200 × 1920 | 2–8 (optional)  |
| Apple App Store | 6.7" (iPhone 15 Pro Max) | 1290 × 2796 | 3–10            |
| Apple App Store | 6.5" (iPhone 14 Plus)    | 1284 × 2778 | 3–10            |
| Apple App Store | 5.5" (iPhone 8 Plus)     | 1242 × 2208 | 3–10            |

Required screenshots per locale (en + mn):

1. **Home / task feed** — shows nearby tasks with map visible
2. **Task detail** — shows task description, location, price
3. **Booking flow** — confirm booking screen
4. **Profile / verification** — user profile with verification badge
5. **Chat** — in-app messaging between tasker and client

### Generating screenshots

Use the script at `apps/mobile/scripts/generate-screenshots.ts` to automate screenshot capture via Maestro.

```bash
# Prerequisites: Maestro installed (https://maestro.mobile.dev/)
# Run against a running emulator/simulator
cd apps/mobile
npx ts-node scripts/generate-screenshots.ts
```

Screenshots are saved to `apps/mobile/screenshots/<locale>/<device>/`.

## 2. IARC rating questionnaire

| Question                                              | Answer                          |
| ----------------------------------------------------- | ------------------------------- |
| Does the app contain violence?                        | No                              |
| Does the app contain sexual content?                  | No                              |
| Does the app contain simulated gambling?              | No                              |
| Does the app allow user-to-user communication?        | Yes                             |
| Does the app allow users to share location?           | Yes                             |
| Does the app contain profanity or crude humor?        | No                              |
| Does the app contain alcohol/tobacco/drug references? | No                              |
| Does the app share user data with third parties?      | Yes (Facebook login, analytics) |
| Does the app allow digital purchases?                 | No (Phase 1)                    |
| Does the app show ads?                                | No                              |

Expected rating: **Everyone** (Google Play) / **4+** (App Store).

## 3. Demo account credentials

Demo accounts are managed via environment variables. **Never commit credentials.**

```
# .env.local or CI secrets
TASKY_DEMO_PHONE=<phone-number>
TASKY_DEMO_CODE=<sms-otp-code>
```

For Apple review: provide demo account in App Store Connect "App Review Information" section.
For Google review: provide demo account in Play Console "App content → App access" section.

## 4. Version policy

Tasky uses **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`.

- `MAJOR`: breaking API changes, major feature releases
- `MINOR`: new features, backward-compatible
- `PATCH`: bug fixes, minor improvements

Version is set in `apps/mobile/app.config.ts` (`version` field) and `android/app/build.gradle` (`versionCode` / `versionName`).

**Rules:**

- Bump `versionCode` (Android) on every upload — must be strictly increasing.
- Bump `version` (app.config.ts) for each release.
- Build numbers are managed by EAS Build automatically.

## 5. Target SDK

| Platform | Requirement              | Current                                        |
| -------- | ------------------------ | ---------------------------------------------- |
| Android  | targetSdkVersion ≥ 35    | Set by Expo (rootProject.ext.targetSdkVersion) |
| iOS      | Deployment target ≥ 15.1 | Set by Expo                                    |

Expo SDK 52+ sets `targetSdkVersion = 35` automatically. No manual change needed.

Verify:

```bash
cd apps/mobile && npx expo config --type public | jq '.android'
```

## 6. Submission checklist

### Google Play

- [ ] Signed AAB uploaded (`eas build --platform android --profile production`)
- [ ] Store listing: title, short description, full description (en + mn)
- [ ] Screenshots uploaded for all required device sizes (en + mn)
- [ ] Feature graphic (1024 × 500)
- [ ] Content rating questionnaire completed (IARC)
- [ ] Data safety section filled (matches PII_INVENTORY.md)
- [ ] App signing by Google Play enabled
- [ ] Demo account provided in review information

### Apple App Store

- [ ] Signed IPA uploaded via EAS or Xcode (`eas build --platform ios --profile production`)
- [ ] App Store Connect: name, subtitle, description (en + mn)
- [ ] Screenshots uploaded for 6.7", 6.5", 5.5" (en + mn)
- [ ] App Review Information: demo account, contact info
- [ ] App Privacy nutrition label completed (matches APP_PRIVACY_QUESTIONNAIRE.md)
- [ ] Sign in with Apple capability enabled in Apple Developer portal
- [ ] ATT usage description present in Info.plist
