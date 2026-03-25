# Tasky Mobile

React Native (Expo) mobile client for the Tasky domestic services marketplace.

## Tech Stack

| Component | Version / Library |
|-----------|------------------|
| Framework | Expo SDK 52, React Native 0.76.7 |
| Navigation | Expo Router 4 (file-based routing) |
| State Management | Zustand 5 |
| Server State | TanStack React Query 5 |
| Realtime | STOMP.js + SockJS (WebSocket chat) |
| Push Notifications | Firebase Messaging + Notifee |
| Maps | react-native-maps |
| Animations | React Native Reanimated 3 |
| UI | Bottom Sheet (gorhom), Expo Blur, Linear Gradient, Lucide icons |
| i18n | i18next + react-i18next |
| API Client | `@tasky/sdk` (workspace package) |

## Project Structure

```
src/
  app/               Expo Router file-based routes
    (auth)/           Auth screens (login, OTP)
    (customer)/       Customer-specific screens
    (tasker)/         Tasker-specific screens
    (tabs)/           Tab navigator layout
    (shared)/         Shared routes (both roles)
    profile/          Profile screens
    task/             Task detail screens
  components/
    ui/               Reusable UI primitives
    templates/        Screen-level layout templates
  design/             Design system (theme, typography)
  features/           Feature modules by domain
    auth/             Auth logic and components
    bookings/         Booking management
    chat/             In-app messaging
    disputes/         Dispute flows
    notifications/    Push notification handling
    profile/          Profile management
    review/           Rating and review UI
    tasks/            Task browsing, creation, details
    verification/     Identity verification
  hooks/              Shared React hooks
  lib/                API client setup, utilities
  locales/            i18n translations
    en/               English strings
    mn/               Mongolian strings
  providers/          React context providers
  store/              Zustand stores
    authStore.ts      Auth state (token, user, role)
    appStore.ts       App-wide state
  utils/              Helper functions
```

## Navigation

Expo Router with group-based layouts:

| Route Group | Description |
|-------------|-------------|
| `(auth)` | Login, OTP verification, onboarding |
| `(customer)` | Customer dashboard, task creation |
| `(tasker)` | Tasker feed, task acceptance |
| `(tabs)` | Main tab bar (shared) |
| `(shared)` | Profile, settings |

## Internationalization

Two locales: English (`en`) and Mongolian (`mn`). Translations live in `src/locales/{lang}/`.

## Testing

| Type | Tool | Command |
|------|------|---------|
| Unit / Component | Jest + React Native Testing Library | `pnpm test:unit` |
| E2E (device) | Maestro flows | `pnpm test:e2e` |
| E2E (smoke) | Maestro or component fallback | `pnpm test:e2e:smoke` |

Maestro flows are in `maestro/flows/`. E2E runs when `TASKY_RUN_MAESTRO=true`; otherwise a component-test fallback is used.

## Development

```bash
pnpm install                         # Install dependencies (from monorepo root)
pnpm --filter @tasky/mobile start    # Start Expo dev server
pnpm --filter @tasky/mobile ios      # Run on iOS simulator
pnpm --filter @tasky/mobile android  # Run on Android emulator
```

## Scripts

| Script | Purpose |
|--------|---------|
| `start` | Start Expo dev server |
| `ios` / `android` / `web` | Platform-specific dev |
| `typecheck` | TypeScript type checking |
| `lint` | ESLint |
| `format` | Prettier auto-format |
| `test:unit` | Run Jest unit tests |
| `test:e2e:smoke` | Run smoke E2E suite |
