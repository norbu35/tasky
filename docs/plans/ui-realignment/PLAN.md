# UI Realignment — Execution Plan

**Status:** Canonical execution plan
**Source:** `STRATEGY.md` + `handoff/` design bundle
**Target branch prefix:** `agent/TASK-UI-`
**Token naming:** `--tenger-*` primitives, `--color-*` semantic aliases

---

## Record of Decisions

| Decision           | Choice                                                                                       | Rationale                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Font delivery      | External (Google Fonts `@expo-google-fonts/*`)                                               | Avoid committing ~2 MB TTFs; mobile already loads via expo-google-fonts        |
| Token naming       | `--tenger-*` primitives + `--color-*` semantic                                               | Clean two-layer system; "tenger" reflects the Тэнгэр palette identity          |
| Token value format | HSL channels in CSS vars (for Tailwind `<alpha-value>` support), hex in primitives.ts source | Preserves shadcn opacity modifier pattern (`bg-primary/50`)                    |
| Dark mode          | In scope                                                                                     | Handoff includes dark-theme HSL overrides; single-pass cheaper than revisiting |
| Admin UI           | Matches consumer design language                                                             | Consistent brand experience across all surfaces                                |

---

## Guardrails (every tranche must respect)

- **Web UI kit:** Radix + Tailwind only. No MUI/Chakra/Ant. No shadcn CLI.
- **Mobile UI kit:** NativeWind utility classes backed by `@tasky/design-tokens`. `StyleSheet.create` / inline object styles only for Reanimated, platform shadow/elevation, safe-area math, and third-party APIs requiring object styles.
- **Forbidden on mobile:** core `SafeAreaView` (use `ScreenContainer`), raw `TextInput` outside wrappers, `TouchableOpacity` where a shared pressable exists, ad-hoc token lookups outside `@tasky/design-tokens`.
- **Never touch:** `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenService.java`, `TokenBlacklistService.java`, `StompRateLimitInterceptor.java`, `ChannelInterceptorConfig.java`, `Caddyfile.production` (see `AGENTS.md` → Security Compliance); `tests/scenarios/*`; `docs/API.yaml`; migrations under `services/api/**/db/migration/`.
- **Token layering:** edits to `packages/design-tokens/src/primitives.ts` propagate through `semantic.ts` → `platform/*`. Never shortcut by editing `platform/*` directly.
- **Parity contract:** every shared primitive must keep web/mobile parity states. Mismatched states fail the tranche.
- **No API/SDK changes.** `docs/API.yaml`, `services/api/**`, `packages/sdk/` are frozen.
- **No new features, refactors, route restructuring, or navigation graph changes.** Visual realignment only.

---

## Token Mapping Table

### Color Primitives

All values stored as HSL channels (`H S% L%`) in CSS for Tailwind alpha support. Hex shown for reference.

| New Primitive `--tenger-*` | HSL Channels  | Hex       | Old `--tasky-color-*` | Status                |
| -------------------------- | ------------- | --------- | --------------------- | --------------------- |
| `canvas`                   | `40 22% 96%`  | `#F9F8F5` | `canvas`              | rename only           |
| `ink`                      | `212 43% 23%` | `#1B3A5C` | `ink`                 | rename only           |
| `ink-deep`                 | `210 55% 14%` | `#102638` | `primary-deep`        | **rename + simplify** |
| `surface`                  | `0 0% 100%`   | `#FFFFFF` | `surface`             | rename only           |
| `sun`                      | `40 72% 31%`  | `#8B6914` | `sun`                 | rename only           |
| `sun-light`                | `38 52% 50%`  | `#C49A3C` | —                     | **NEW**               |
| `sun-wash`                 | `42 97% 71%`  | `#FDCE6A` | —                     | **NEW**               |
| `sky`                      | `200 34% 58%` | `#6BA3BE` | `sky`                 | rename only           |
| `sky-soft`                 | `205 51% 80%` | `#ABD1E8` | —                     | **NEW**               |
| `line`                     | `210 16% 80%` | `#C7D0D9` | `line`                | rename only           |
| `field`                    | `210 13% 88%` | `#DBE0E5` | `field`               | rename only           |
| `subtle`                   | `36 20% 94%`  | `#F3F1EC` | `subtle-surface`      | **rename**            |
| `muted-text`               | `210 13% 39%` | `#576473` | `muted-text`          | rename only           |
| `text-secondary`           | `208 13% 40%` | `#5E6B78` | `text-secondary`      | rename only           |
| `text-tertiary`            | `208 12% 55%` | `#808D99` | `text-tertiary`       | rename only           |
| `verified`                 | `160 34% 42%` | `#469178` | `verified`            | rename only           |
| `trust`                    | `212 49% 42%` | `#3568A1` | `trust`               | rename only           |
| `trust-muted`              | `212 27% 77%` | `#B3C4D6` | `trust-muted`         | rename only           |
| `danger`                   | `0 84% 60%`   | `#EF4444` | `danger`              | rename only           |
| `nav-inactive`             | `207 12% 48%` | `#6C7B89` | `nav-inactive`        | rename only           |
| `chip-inactive`            | `210 12% 86%` | `#D8DDE2` | `chip-inactive`       | rename only           |
| `status-open`              | `35 15% 90%`  | `#EDE9E2` | `status-open`         | rename only           |
| `status-open-fg`           | `210 12% 45%` | `#657381` | `status-open-fg`      | rename only           |
| `status-assigned`          | `212 43% 23%` | `#1B3A5C` | `status-assigned`     | rename only           |
| `status-assigned-fg`       | `0 0% 100%`   | `#FFFFFF` | `status-assigned-fg`  | rename only           |
| `status-completed`         | `160 34% 42%` | `#469178` | —                     | **NEW**               |
| `status-completed-fg`      | `0 0% 100%`   | `#FFFFFF` | —                     | **NEW**               |
| `status-cancelled`         | `36 20% 94%`  | `#F3F1EC` | —                     | **NEW**               |
| `status-cancelled-fg`      | `210 13% 39%` | `#576473` | —                     | **NEW**               |

### Semantic Aliases (`--color-*`)

| Semantic Token    | CSS Variable              | Resolves To                    |
| ----------------- | ------------------------- | ------------------------------ |
| `background`      | `--color-background`      | `var(--tenger-canvas)`         |
| `foreground`      | `--color-foreground`      | `var(--tenger-ink)`            |
| `foreground-deep` | `--color-foreground-deep` | `var(--tenger-ink-deep)`       |
| `card`            | `--color-card`            | `var(--tenger-surface)`        |
| `card-fg`         | `--color-card-fg`         | `var(--tenger-ink)`            |
| `primary`         | `--color-primary`         | `var(--tenger-ink)`            |
| `primary-fg`      | `--color-primary-fg`      | `var(--tenger-surface)`        |
| `primary-deep`    | `--color-primary-deep`    | `var(--tenger-ink-deep)`       |
| `secondary`       | `--color-secondary`       | `var(--tenger-sun)`            |
| `secondary-fg`    | `--color-secondary-fg`    | `var(--tenger-surface)`        |
| `accent`          | `--color-accent`          | `var(--tenger-sky)`            |
| `accent-fg`       | `--color-accent-fg`       | `var(--tenger-surface)`        |
| `muted`           | `--color-muted`           | `var(--tenger-subtle)`         |
| `muted-fg`        | `--color-muted-fg`        | `var(--tenger-muted-text)`     |
| `border`          | `--color-border`          | `var(--tenger-line)`           |
| `input`           | `--color-input`           | `var(--tenger-field)`          |
| `verified`        | `--color-verified`        | `var(--tenger-verified)`       |
| `verified-fg`     | `--color-verified-fg`     | `var(--tenger-surface)`        |
| `trust`           | `--color-trust`           | `var(--tenger-trust)`          |
| `trust-fg`        | `--color-trust-fg`        | `var(--tenger-surface)`        |
| `danger`          | `--color-danger`          | `var(--tenger-danger)`         |
| `danger-fg`       | `--color-danger-fg`       | `var(--tenger-surface)`        |
| `text-secondary`  | `--color-text-secondary`  | `var(--tenger-text-secondary)` |
| `text-tertiary`   | `--color-text-tertiary`   | `var(--tenger-text-tertiary)`  |
| `nav-inactive`    | `--color-nav-inactive`    | `var(--tenger-nav-inactive)`   |

### Motion Tokens (add to `tokens.css`)

```css
--tenger-duration-instant: 80ms;
--tenger-duration-fast: 150ms;
--tenger-duration-normal: 250ms;
--tenger-duration-slow: 400ms;
--tenger-duration-skeleton: 1500ms;
--tenger-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--tenger-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
--tenger-easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
--tenger-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Shadow Tokens

| Token                      | CSS Value                                                          | Notes                      |
| -------------------------- | ------------------------------------------------------------------ | -------------------------- |
| `--tenger-shadow-card`     | `0 1px 2px rgba(0,0,0,0.05)`                                       | Default card               |
| `--tenger-shadow-elevated` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.05)`  | Modals, FABs               |
| `--tenger-shadow-fab`      | `0 4px 6px -4px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)` | Floating action buttons    |
| `--tenger-shadow-nav`      | `0 -4px 24px rgba(26,28,26,0.04)`                                  | Bottom nav (upward shadow) |
| `--tenger-shadow-deep`     | `0 25px 50px -12px rgba(0,0,0,0.25)`                               | Deep elevation             |

### Typography Additions

| Token                          | Value                                                               | Notes                                                              |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--tenger-font-display`        | `'Manrope', Roboto, system-ui, -apple-system, sans-serif`           | Headlines                                                          |
| `--tenger-font-sans`           | `'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif` | Body/UI                                                            |
| `--tenger-letter-spacing-caps` | `0.075em`                                                           | ALL-CAPS badge microcopy only                                      |
| `--tenger-font-size-nav`       | `11px`                                                              | Nav label (exists in primitives.ts, missing from some CSS outputs) |

### Dark Theme Overrides (`.dark`)

Apply in `.dark` block of `tokens.css` per handoff spec:

```css
.dark {
  --color-background: hsl(212 35% 6%);
  --color-foreground: hsl(40 30% 88%);
  --color-card: hsl(212 28% 10%);
  --color-card-fg: hsl(40 30% 88%);
  --color-primary: hsl(200 35% 58%);
  --color-primary-fg: hsl(212 35% 6%);
  --color-secondary: hsl(42 48% 55%);
  --color-secondary-fg: #ffffff;
  --color-accent: hsl(200 32% 55%);
  --color-accent-fg: #ffffff;
  --color-muted: hsl(212 15% 13%);
  --color-muted-fg: hsl(210 12% 55%);
  --color-border: hsl(212 12% 18%);
  --color-input: hsl(212 12% 18%);
  --color-verified: hsl(160 32% 55%);
  --color-verified-fg: #ffffff;
  --color-trust: hsl(211 45% 58%);
  --color-trust-fg: #ffffff;
  --color-danger: hsl(0 72% 55%);
  --color-danger-fg: #ffffff;
  --color-text-secondary: hsl(210 12% 62%);
  --color-text-tertiary: hsl(210 10% 50%);
  --color-nav-inactive: hsl(210 10% 50%);
}
```

---

## Primitive Parity Matrix

### Shared Primitives (web + mobile)

| Primitive        | Web File                                       | Mobile File                                        | Required States                                                               | Handoff Reference                   |
| ---------------- | ---------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| **Button**       | `apps/web/src/components/ui/button.tsx`        | `apps/mobile/src/components/ui/Button.tsx`         | default, outline, ghost, danger, secondary, disabled, loading, sm/md/lg sizes | `preview/components-buttons.html`   |
| **Input**        | `apps/web/src/components/ui/input.tsx`         | `apps/mobile/src/components/ui/Input.tsx`          | default, focus, invalid, with-icon, disabled                                  | `preview/components-inputs.html`    |
| **FormField**    | `apps/web/src/components/ui/label.tsx` + input | `apps/mobile/src/components/ui/FormField.tsx`      | label + input + helper/error                                                  | `preview/components-inputs.html`    |
| **Card**         | `apps/web/src/components/ui/card.tsx`          | `apps/mobile/src/components/ui/Card.tsx`           | default, pressable                                                            | `preview/components-cards.html`     |
| **Badge**        | `apps/web/src/components/ui/badge.tsx`         | `apps/mobile/src/components/ui/StatusBadge.tsx`    | open, assigned, completed, cancelled, no_show                                 | `preview/components-badges.html`    |
| **Avatar**       | `apps/web/src/components/ui/avatar.tsx`        | `apps/mobile/src/components/ui/ProfileAvatar.tsx`  | initials, image, with-verified-overlay, sizes                                 | `preview/components-avatar.html`    |
| **Dialog/Sheet** | `apps/web/src/components/ui/dialog.tsx`        | `apps/mobile/src/components/ui/ModalSheet.tsx`     | open, close, title, body, actions                                             | handoff components.jsx `ModalSheet` |
| **Skeleton**     | `apps/web/src/components/ui/skeleton.tsx`      | `apps/mobile/src/components/ui/SkeletonLoader.tsx` | card, line, circle                                                            | handoff `skeleton: 1500ms` shimmer  |
| **Tabs**         | `apps/web/src/components/ui/tabs.tsx`          | —                                                  | active, inactive                                                              | handoff `BottomNav`                 |
| **Separator**    | `apps/web/src/components/ui/separator.tsx`     | —                                                  | default                                                                       | handoff card dividers               |
| **Toast**        | `apps/web/src/components/ui/sonner.tsx`        | `apps/mobile/src/components/ui/Toast.tsx`          | success, error, info                                                          | handoff motion tokens               |

### Mobile-Only Primitives

| Primitive            | File                   | Required States                                       | Handoff Reference                                |
| -------------------- | ---------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| **PressableCard**    | `PressableCard.tsx`    | default, pressed (scale 0.98 spring)                  | `preview/components-cards.html`                  |
| **SplitCard**        | `SplitCard.tsx`        | default                                               | —                                                |
| **ListItemCard**     | `ListItemCard.tsx`     | default, pressed                                      | —                                                |
| **StatCard**         | `StatCard.tsx`         | default (value + label)                               | `ui_kits/mobile/index.html` Tasker Profile stats |
| **ActionRow**        | `ActionRow.tsx`        | default, with-value, with-trailing                    | handoff `ProfileScreen` settings rows            |
| **InfoRow**          | `InfoRow.tsx`          | key-value                                             | handoff `TaskDetailScreen` detail rows           |
| **SearchBar**        | `SearchBar.tsx`        | default, focused                                      | `preview/components-inputs.html`                 |
| **FilterBar**        | `FilterBar.tsx`        | active, inactive chip states                          | `ui_kits/mobile/index.html` BrowseScreen         |
| **CategoryChip**     | `CategoryChip.tsx`     | default                                               | handoff `cat-chip` class                         |
| **VerifiedBadge**    | `VerifiedBadge.tsx`    | verified, pending, unverified (hidden)                | `preview/components-badges.html`                 |
| **StatusBadge**      | `StatusBadge.tsx`      | open, assigned, completed, cancelled, no_show         | `preview/components-badges.html`                 |
| **RatingStars**      | `RatingStars.tsx`      | filled (sun-light gold), empty (chip-inactive stroke) | handoff `RatingStars` component                  |
| **ReviewCard**       | `ReviewCard.tsx`       | default                                               | handoff reviews section                          |
| **PriceTag**         | `PriceTag.tsx`         | default (₮ prefix, comma-separated)                   | handoff `.price` class                           |
| **LocationPin**      | `LocationPin.tsx`      | default                                               | —                                                |
| **StepIndicator**    | `StepIndicator.tsx`    | active, completed, pending                            | —                                                |
| **TimelineStepper**  | `TimelineStepper.tsx`  | dot + label + tone                                    | —                                                |
| **ScreenHeader**     | `ScreenHeader.tsx`     | title, title + greeting                               | handoff `BrowseScreen` header                    |
| **TabBarButton**     | `TabBarButton.tsx`     | active, inactive                                      | handoff `BottomNav`                              |
| **FAB**              | `FAB.tsx`              | default, pressed                                      | handoff FAB button                               |
| **Reveal**           | `Reveal.tsx`           | enter animation                                       | handoff motion tokens                            |
| **OfflineBanner**    | `OfflineBanner.tsx`    | visible, hidden                                       | —                                                |
| **TrustBanner**      | `TrustBanner.tsx`      | default                                               | `preview/components-cards.html` trust banner     |
| **LoginRequiredCTA** | `LoginRequiredCTA.tsx` | default                                               | —                                                |
| **PermissionPrimer** | `PermissionPrimer.tsx` | default                                               | —                                                |
| **LanguageSwitcher** | `LanguageSwitcher.tsx` | EN/MN toggle                                          | handoff LoginScreen MN/EN                        |
| **HandDrawnCheck**   | `HandDrawnCheck.tsx`   | animated (spring scale-in)                            | handoff `ApplySuccessScreen` checkmark           |
| **Touchable**        | `Touchable.tsx`        | default, pressed                                      | handoff press states                             |
| **PhotoGrid**        | `PhotoGrid.tsx`        | grid of photos                                        | —                                                |

---

## Route Inventory

**75 mobile files · 53 web route pages · 9 mobile layouts · 12 web test files (excluded)**

### Mobile Layouts (Phase 1 — T-1.2)

| File                                                   | Description       |
| ------------------------------------------------------ | ----------------- |
| `apps/mobile/src/app/_layout.tsx`                      | Root stack        |
| `apps/mobile/src/app/(auth)/_layout.tsx`               | Auth flow         |
| `apps/mobile/src/app/(tabs)/_layout.tsx`               | Tab navigator     |
| `apps/mobile/src/app/(tabs)/inbox/_layout.tsx`         | Inbox stack       |
| `apps/mobile/src/app/(customer)/_layout.tsx`           | Customer stack    |
| `apps/mobile/src/app/(customer)/tasks/new/_layout.tsx` | Task wizard stack |
| `apps/mobile/src/app/(tasker)/_layout.tsx`             | Tasker stack      |
| `apps/mobile/src/app/(shared)/_layout.tsx`             | Shared stack      |
| `apps/mobile/src/app/task/_layout.tsx`                 | Shared task stack |

### Mobile Route Screens

#### T-4.1: Auth (8 files)

| File                                                      | Description             |
| --------------------------------------------------------- | ----------------------- |
| `apps/mobile/src/app/index.tsx`                           | Entry/splash redirect   |
| `apps/mobile/src/app/onboarding.tsx`                      | Onboarding              |
| `apps/mobile/src/app/create.tsx`                          | Deep-link helper        |
| `apps/mobile/src/app/(auth)/index.tsx`                    | Login/phone             |
| `apps/mobile/src/app/(auth)/role-select.tsx`              | Role selection          |
| `apps/mobile/src/app/(auth)/permission-notifications.tsx` | Notification permission |
| `apps/mobile/src/app/(auth)/permission-location.tsx`      | Location permission     |
| `apps/mobile/src/app/(auth)/permission-camera.tsx`        | Camera permission       |

#### T-4.2: Tabs (6 files)

| File                                         | Description                 |
| -------------------------------------------- | --------------------------- |
| `apps/mobile/src/app/(tabs)/index.tsx`       | Home/feed                   |
| `apps/mobile/src/app/(tabs)/bookings.tsx`    | Bookings tab                |
| `apps/mobile/src/app/(tabs)/profile.tsx`     | Profile tab                 |
| `apps/mobile/src/app/(tabs)/inbox/index.tsx` | Inbox list                  |
| `apps/mobile/src/app/(tabs)/inbox/[id].tsx`  | Chat detail                 |
| `apps/mobile/src/app/profile/[id].tsx`       | Public profile (standalone) |

#### T-4.3: Task Creation Wizard (9 files)

| File                                                    | Description      |
| ------------------------------------------------------- | ---------------- |
| `apps/mobile/src/app/(customer)/tasks/new/index.tsx`    | Wizard start     |
| `apps/mobile/src/app/(customer)/tasks/new/category.tsx` | Category step    |
| `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`   | Intake/form step |
| `apps/mobile/src/app/(customer)/tasks/new/location.tsx` | Location step    |
| `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx` | Schedule step    |
| `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`   | Photos step      |
| `apps/mobile/src/app/(customer)/tasks/new/review.tsx`   | Review step      |
| `apps/mobile/src/app/(customer)/tasks/new/success.tsx`  | Success          |
| `apps/mobile/src/app/(customer)/rebook.tsx`             | Rebook flow      |

#### T-4.4: Detail & Booking Flows (22 files)

| File                                                                 | Description         |
| -------------------------------------------------------------------- | ------------------- |
| `apps/mobile/src/app/(customer)/tasks/index.tsx`                     | Customer task list  |
| `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`            | Task detail         |
| `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`       | Applicant list      |
| `apps/mobile/src/app/(customer)/tasks/[taskId]/rescue.tsx`           | No-applicant rescue |
| `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`              | Tasker profile      |
| `apps/mobile/src/app/(customer)/bookings/index.tsx`                  | Bookings list       |
| `apps/mobile/src/app/(customer)/bookings/confirm.tsx`                | Booking confirm     |
| `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`              | Booking confirmed   |
| `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`      | Booking detail      |
| `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`   | Timeline            |
| `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx` | Reschedule          |
| `apps/mobile/src/app/(customer)/bookings/[bookingId]/cancel.tsx`     | Cancel              |
| `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`    | Dispute             |
| `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`      | Dispute status      |
| `apps/mobile/src/app/(tasker)/tasks/applied.tsx`                     | Application sent    |
| `apps/mobile/src/app/(tasker)/tasks/[taskId].tsx`                    | Task detail         |
| `apps/mobile/src/app/(tasker)/jobs/index.tsx`                        | Jobs list           |
| `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`            | Job detail          |
| `apps/mobile/src/app/(tasker)/jobs/[bookingId]/cancel.tsx`           | Cancel              |
| `apps/mobile/src/app/(tasker)/stats.tsx`                             | Tasker stats        |
| `apps/mobile/src/app/task/[id].tsx`                                  | Shared task detail  |
| `apps/mobile/src/app/task/[id]/applicants.tsx`                       | Shared applicants   |

#### T-4.5: Verification (7 files)

| File                                                      | Description       |
| --------------------------------------------------------- | ----------------- |
| `apps/mobile/src/app/(tasker)/verification/index.tsx`     | Verification gate |
| `apps/mobile/src/app/(tasker)/verification/consent.tsx`   | Consent           |
| `apps/mobile/src/app/(tasker)/verification/upload.tsx`    | Document upload   |
| `apps/mobile/src/app/(tasker)/verification/pending.tsx`   | Pending review    |
| `apps/mobile/src/app/(tasker)/verification/approved.tsx`  | Approved          |
| `apps/mobile/src/app/(tasker)/verification/rejected.tsx`  | Rejected          |
| `apps/mobile/src/app/(tasker)/verification/submitted.tsx` | Submitted         |

#### T-4.6: Shared Screens (14 files)

| File                                                  | Description         |
| ----------------------------------------------------- | ------------------- |
| `apps/mobile/src/app/(shared)/notifications.tsx`      | Notification center |
| `apps/mobile/src/app/(shared)/network-error.tsx`      | Network error       |
| `apps/mobile/src/app/(shared)/session-expired.tsx`    | Session expired     |
| `apps/mobile/src/app/(shared)/app-update.tsx`         | App update          |
| `apps/mobile/src/app/(shared)/help.tsx`               | Help                |
| `apps/mobile/src/app/(shared)/legal/terms.tsx`        | Terms               |
| `apps/mobile/src/app/(shared)/legal/privacy.tsx`      | Privacy             |
| `apps/mobile/src/app/(shared)/profile/edit.tsx`       | Edit profile        |
| `apps/mobile/src/app/(shared)/profile/settings.tsx`   | Settings            |
| `apps/mobile/src/app/(shared)/profile/delete.tsx`     | Delete account      |
| `apps/mobile/src/app/(shared)/account/suspended.tsx`  | Suspended           |
| `apps/mobile/src/app/(shared)/account/banned.tsx`     | Banned              |
| `apps/mobile/src/app/(shared)/review/[bookingId].tsx` | Review form         |
| `apps/mobile/src/app/(shared)/review/hard-lock.tsx`   | Review hard lock    |

### Web Pages

#### T-4.1: Auth & Landing (3 files)

| File                                           | Route     |
| ---------------------------------------------- | --------- |
| `apps/web/src/pages/LandingPage.tsx`           | `/`       |
| `apps/web/src/pages/AuthPage.tsx`              | `/auth`   |
| `apps/web/src/pages/RestrictedAccountPage.tsx` | `/banned` |

#### T-4.2: Feed, Dashboard, Inbox, Profile (8 files)

| File                                                    | Route                           |
| ------------------------------------------------------- | ------------------------------- |
| `apps/web/src/pages/CustomerDashboardPage.tsx`          | `/customer/dashboard`           |
| `apps/web/src/pages/TaskerFeedPage.tsx`                 | `/tasker/feed`, `/tasker/tasks` |
| `apps/web/src/pages/TaskerTasksPage.tsx`                | `/tasker/my-tasks`              |
| `apps/web/src/pages/customer/CustomerTasksListPage.tsx` | `/customer/tasks`               |
| `apps/web/src/pages/shared/InboxPage.tsx`               | `/inbox`                        |
| `apps/web/src/pages/shared/ChatDetailPage.tsx`          | `/inbox/:conversationId`        |
| `apps/web/src/pages/ProfilePage.tsx`                    | `/profile`                      |
| `apps/web/src/pages/MessagingNotificationsPage.tsx`     | `/communication`                |

#### T-4.3: Task Creation (4 files)

| File                                                            | Route                                   |
| --------------------------------------------------------------- | --------------------------------------- |
| `apps/web/src/pages/customer/CustomerTaskWizardPage.tsx`        | `/customer/tasks/new`                   |
| `apps/web/src/pages/customer/CustomerTaskSuccessPage.tsx`       | `/customer/tasks/success`               |
| `apps/web/src/pages/CustomerTaskDetailsPage.tsx`                | `/customer/tasks/:taskId`               |
| `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx` | `/customer/tasks/:taskId/no-applicants` |

#### T-4.4: Detail & Booking Flows (21 files)

| File                                                           | Route                                      |
| -------------------------------------------------------------- | ------------------------------------------ |
| `apps/web/src/pages/customer/CustomerApplicantsPage.tsx`       | `/customer/tasks/:taskId/applicants`       |
| `apps/web/src/pages/customer/CustomerTaskerProfilePage.tsx`    | `/customer/taskers/:taskerId`              |
| `apps/web/src/pages/BookingConfirmationPage.tsx`               | `/customer/booking-confirmation`           |
| `apps/web/src/pages/BookingSafetyPage.tsx`                     | `/booking/safety`                          |
| `apps/web/src/pages/customer/CustomerBookingsPage.tsx`         | `/customer/bookings`                       |
| `apps/web/src/pages/customer/CustomerBookingDetailPage.tsx`    | `/customer/bookings/:bookingId`            |
| `apps/web/src/pages/customer/CustomerBookingConfirmedPage.tsx` | `/customer/bookings/:bookingId/confirmed`  |
| `apps/web/src/pages/customer/CustomerTimelinePage.tsx`         | `/customer/bookings/:bookingId/timeline`   |
| `apps/web/src/pages/customer/CustomerReschedulePage.tsx`       | `/customer/bookings/:bookingId/reschedule` |
| `apps/web/src/pages/customer/CustomerDisputeRaisePage.tsx`     | `/customer/bookings/:bookingId/dispute`    |
| `apps/web/src/pages/customer/CustomerDisputeStatusPage.tsx`    | `/customer/disputes/:disputeId`            |
| `apps/web/src/pages/customer/CustomerNoShowReminderDialog.tsx` | dialog component                           |
| `apps/web/src/pages/customer/CustomerRebookPage.tsx`           | `/customer/rebook`                         |
| `apps/web/src/pages/customer/CustomerTaskCancelDialog.tsx`     | embedded dialog                            |
| `apps/web/src/pages/tasker/TaskerTaskDetailPage.tsx`           | `/tasker/tasks/:taskId`                    |
| `apps/web/src/pages/tasker/TaskerApplicationSentPage.tsx`      | `/tasker/tasks/:taskId/applied`            |
| `apps/web/src/pages/tasker/TaskerJobsPage.tsx`                 | `/tasker/jobs`                             |
| `apps/web/src/pages/tasker/TaskerBookingDetailPage.tsx`        | `/tasker/bookings/:bookingId`              |
| `apps/web/src/pages/tasker/TaskerStatsPage.tsx`                | `/tasker/stats`                            |
| `apps/web/src/pages/tasker/TaskerNoShowDialog.tsx`             | embedded dialog                            |
| `apps/web/src/pages/tasker/TaskerCancelDialog.tsx`             | embedded dialog                            |

#### T-4.5: Verification (7 files)

| File                                                      | Route                            |
| --------------------------------------------------------- | -------------------------------- |
| `apps/web/src/pages/tasker/VerificationGatePage.tsx`      | `/tasker/verification`           |
| `apps/web/src/pages/tasker/VerificationConsentPage.tsx`   | `/tasker/verification/consent`   |
| `apps/web/src/pages/tasker/VerificationUploadPage.tsx`    | `/tasker/verification/upload`    |
| `apps/web/src/pages/tasker/VerificationPendingPage.tsx`   | `/tasker/verification/pending`   |
| `apps/web/src/pages/tasker/VerificationApprovedPage.tsx`  | `/tasker/verification/approved`  |
| `apps/web/src/pages/tasker/VerificationRejectedPage.tsx`  | `/tasker/verification/rejected`  |
| `apps/web/src/pages/tasker/VerificationSubmittedPage.tsx` | `/tasker/verification/submitted` |

#### T-4.6: Shared Pages (16 files)

| File                                                 | Route                        |
| ---------------------------------------------------- | ---------------------------- |
| `apps/web/src/pages/shared/NotificationsPage.tsx`    | `/notifications`             |
| `apps/web/src/pages/shared/EditProfilePage.tsx`      | `/profile/edit`              |
| `apps/web/src/pages/shared/SettingsPage.tsx`         | `/profile/settings`          |
| `apps/web/src/pages/shared/DeleteAccountPage.tsx`    | `/profile/delete`            |
| `apps/web/src/pages/shared/ReviewPage.tsx`           | ⚠️ not in AppRoutes — verify |
| `apps/web/src/pages/shared/ReviewReminderDialog.tsx` | embedded dialog              |
| `apps/web/src/pages/shared/ReviewHardLockPage.tsx`   | `/review/locked`             |
| `apps/web/src/pages/shared/SuspendedPage.tsx`        | `/suspended`                 |
| `apps/web/src/pages/shared/BannedPage.tsx`           | ⚠️ not in AppRoutes — verify |
| `apps/web/src/pages/shared/NetworkErrorPage.tsx`     | `/network-error`             |
| `apps/web/src/pages/shared/SessionExpiredPage.tsx`   | `/session-expired`           |
| `apps/web/src/pages/shared/AppUpdatePage.tsx`        | `/app-update`                |
| `apps/web/src/pages/shared/HelpPage.tsx`             | `/help`                      |
| `apps/web/src/pages/shared/TermsPage.tsx`            | `/terms`                     |
| `apps/web/src/pages/shared/PrivacyPage.tsx`          | `/privacy`                   |
| `apps/web/src/pages/tasker/TaskerPrivacyPage.tsx`    | `/tasker/privacy`            |

#### T-4.7: Admin (8 files)

| File                                                  | Route                        |
| ----------------------------------------------------- | ---------------------------- |
| `apps/web/src/pages/admin/AdminVerificationsPage.tsx` | `/admin/verifications`       |
| `apps/web/src/pages/admin/AdminDisputesPage.tsx`      | `/admin/disputes`            |
| `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx` | `/admin/disputes/:disputeId` |
| `apps/web/src/pages/admin/AdminUsersPage.tsx`         | `/admin/users`               |
| `apps/web/src/pages/admin/AdminCategoriesPage.tsx`    | `/admin/categories`          |
| `apps/web/src/pages/admin/AdminFeaturesPage.tsx`      | `/admin/features`            |
| `apps/web/src/pages/admin/AdminConciergePage.tsx`     | `/admin/concierge`           |
| `apps/web/src/pages/admin/AdminModerationPage.tsx`    | `/admin/moderation`          |

### Anomalies (verify before realigning)

- **`CustomerTaskPage.tsx`** at web root — NOT in AppRoutes; legacy alias. Confirm deletion or wiring.
- **`ReviewPage.tsx`** in web shared/ — NOT in AppRoutes; may be dead code.
- **`BannedPage.tsx`** in web shared/ — NOT in AppRoutes; `/banned` uses `RestrictedAccountPage.tsx` instead.

---

## Phase 0 — Token & Handoff Landing

**1 tranche · 13 files · Gate: `pnpm -r typecheck` + `pnpm -r test` + `pnpm workspace:boundaries`**

### Tranche T-0.1: Token rename + additions

#### Scope

Exact files:

1. `packages/design-tokens/src/primitives.ts` — rename keys to kebab-case, add `sunLight`, `sunWash`, `skySoft`, `statusCompleted`, `statusCompletedForeground`, `statusCancelled`, `statusCancelledForeground`
2. `packages/design-tokens/src/semantic.ts` — re-map semantic roles to new primitive key names
3. `packages/design-tokens/src/platform/web.ts` — emit `--tenger-*` CSS vars (HSL channels) instead of `--tasky-color-*`
4. `packages/design-tokens/src/platform/native.ts` — update hex color key names to match new primitives
5. `packages/design-tokens/tokens.css` — full rewrite: `:root` with `--tenger-*` primitives + `--color-*` semantic aliases; `.dark` block with handoff dark values; add motion tokens, shadow tokens, letter-spacing-caps, font-size-nav
6. `packages/design-tokens/src/motion.ts` — no structural change; verify values match handoff (already correct)
7. `packages/design-tokens/src/colors.ts` — legacy compat: update to new key names
8. `packages/design-tokens/src/tokens.ts` — legacy compat: update to new key names
9. `packages/design-tokens/src/layout.ts` — legacy compat: update to new key names
10. `apps/web/tailwind.config.ts` — consume `--tenger-*` vars via `hsl(var(--tenger-*) / <alpha-value>)` pattern; add semantic color mappings; add motion/shadow utilities
11. `apps/mobile/tailwind.config.ts` — consume new native token key names; add missing semantic mappings
12. `apps/mobile/src/design/tokenAdapter.ts` — update all token lookups to new primitive names
13. `apps/mobile/src/design/theme.ts` — update theme to consume new token names

#### Token/class mapping

**In `primitives.ts`:**

- `canvas` → `canvas` (key stays, CSS var renames)
- `primaryDeep` → `inkDeep` (key rename)
- `subtleSurface` → `subtle` (key rename)
- Add: `sunLight` (`#C49A3C`), `sunWash` (`#FDCE6A`), `skySoft` (`#ABD1E8`)
- Add: `statusCompleted` (`#469178`), `statusCompletedForeground` (`#FFFFFF`)
- Add: `statusCancelled` (`#F3F1EC`), `statusCancelledForeground` (`#576473`)

**In `tokens.css`:**

- Every `--tasky-color-*` → `--tenger-*` (e.g. `--tasky-color-ink` → `--tenger-ink`)
- Add semantic `--color-*` aliases layer
- Add `.dark` block with complete dark-theme overrides from handoff
- Add motion tokens (`--tenger-duration-*`, `--tenger-easing-*`)
- Add shadow tokens (`--tenger-shadow-*`)
- Add `--tenger-letter-spacing-caps: 0.075em`

**In `web/tailwind.config.ts`:**

- `hsl(var(--tasky-color-ink) / <alpha-value>)` → `hsl(var(--tenger-ink) / <alpha-value>)`
- Add: `sunLight`, `sunWash`, `skySoft`, `statusCompleted`, `statusCancelled` colors
- Add: motion utilities (`duration-instant`, `duration-fast`, etc.)
- Add: shadow utilities

**In `mobile/tailwind.config.ts`:**

- Update all color key references from old primitive names to new
- Add missing semantic color mappings

#### Visual acceptance

No visual change. This tranche is a rename + addition. All existing consumers must render identically.

#### Non-goals

- Do NOT change any component styling
- Do NOT add dark-mode toggle UI
- Do NOT change font loading
- Do NOT touch `apps/mobile/src/app/` or `apps/web/src/pages/` or `apps/web/src/components/`

#### Verification

```bash
pnpm -r typecheck                          # must pass
pnpm -r test                               # must pass (no behavioral change)
pnpm workspace:boundaries                  # must pass
./gradlew openApiValidate                  # must pass (SDK untouched)
```

Additionally: visual spot-check on `pnpm --filter @tasky/web dev` — login page, browse feed, and profile page must render identically to before the rename.

#### Commit shape

```
feat(design-tokens): rename to --tenger-* primitives, add missing tokens

Reconcile design tokens with Тэнгэр handoff spec:
- Rename --tasky-color-* to --tenger-* primitives
- Add sun-light, sun-wash, sky-soft primitives
- Add status-completed, status-cancelled status colors
- Add motion, shadow, and letter-spacing tokens to CSS
- Add dark theme overrides from handoff spec
- Update both Tailwind configs and mobile token adapter

No visual change. All existing consumers remapped.
```

#### Rollback signal

If `pnpm -r typecheck` fails after the rename: **STOP. Do NOT expand scope to fix consumers.** The rename is incomplete — list the failing files and escalate for a wider rename pass.

---

## Phase 1 — Shared Chrome: Shells, Layouts, Templates

**6 tranches · 3–8 files each · Must complete before Phase 2**

### Tranche T-1.1: Mobile shells

#### Scope

1. `apps/mobile/src/components/shells/ScreenContainer.tsx`
2. `apps/mobile/src/components/shells/InsetScrollView.tsx`
3. `apps/mobile/src/components/shells/StickyActionBar.tsx`
4. `apps/mobile/src/design/screenLayout.ts`

#### Token/class mapping

- `bg-background` → `bg-background` (already semantic, should work through new tokens)
- Verify `screenLayout.chrome.tabBarHeight` aligns with handoff bottom nav height (~81px)
- `StickyActionBar` background: add frosted-glass pattern → `bg-background/80 backdrop-blur-xl`
- Verify safe-area padding uses correct token values

#### Visual acceptance

- `StickyActionBar`: handoff "Sticky Footer Actions" — `rgba(250,249,246,0.8)` bg, `backdrop-filter: blur(24px)`, full-width CTA area
- Bottom nav clearance in `screenLayout.ts`: 81px height, 12px top radius

#### Non-goals

- Do NOT change route files
- Do NOT change template or primitive components
- Do NOT add new shells

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-1.2: Mobile root layouts

#### Scope

1. `apps/mobile/src/app/_layout.tsx`
2. `apps/mobile/src/app/(tabs)/_layout.tsx`
3. `apps/mobile/src/app/(auth)/_layout.tsx`
4. `apps/mobile/src/app/(customer)/_layout.tsx`
5. `apps/mobile/src/app/(tasker)/_layout.tsx`
6. `apps/mobile/src/app/(shared)/_layout.tsx`
7. `apps/mobile/src/design/navigationOptions.ts`

#### Token/class mapping

- Tab bar background: `BlurView` tint → `--tenger-canvas` at 60% opacity with 16px blur
- Tab bar height: verify against `screenLayout.chrome.tabBarHeight` (81px target)
- Tab bar top corners: `12px` radius
- Active tab: `--tenger-ink` icon + label color
- Inactive tab: `--tenger-nav-inactive` (`#6C7B89`)
- FAB: `--tenger-sun-light` background, 52×52px, `--tenger-radius-md` (12px), `--tenger-shadow-fab`
- Header chrome: remove or restyle per handoff (handoff screens use inline headers, not stack headers)

#### Visual acceptance

- Tab bar: handoff `BottomNav` component — 80px height, frosted glass, 12px top corners
- Active tab: ink blue icon + Manrope 700 10px label
- Inactive tab: `#6C7B89` icon + Manrope 500 10px label
- FAB: gold 52×52 floating button with `+` icon, shadow-elevated

#### Non-goals

- Do NOT change individual screen/tab route files
- Do NOT change navigation graph or route structure

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-1.3: Mobile templates

#### Scope

1. `apps/mobile/src/components/templates/FeedListTemplate.tsx`
2. `apps/mobile/src/components/templates/DetailTemplate.tsx`
3. `apps/mobile/src/components/templates/AuthTemplate.tsx`
4. `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
5. `apps/mobile/src/components/templates/SettingsTemplate.tsx`
6. `apps/mobile/src/components/templates/EmptyStateTemplate.tsx`
7. `apps/mobile/src/components/templates/ErrorStateTemplate.tsx`
8. `apps/mobile/src/components/templates/ModalSheetTemplate.tsx`
9. `apps/mobile/src/components/templates/SuccessCelebrationTemplate.tsx`

#### Token/class mapping

- `DetailTemplate` CTA bar: `BlurView` → `bg-background/92 backdrop-blur-xl`, `--tenger-shadow-nav`
- `AuthTemplate`: verify centered layout matches handoff LoginScreen — brand logo area, auth button stacking, `px-screen-x` padding
- `FormWizardTemplate`: progress bar uses `--tenger-ink` for completed steps, `--tenger-line` for remaining
- `SuccessCelebrationTemplate`: checkmark uses `--tenger-verified` stroke, spring easing
- Card padding in templates: verify `14px 16px` matches handoff `.card-body`
- Typography: heading text uses `--tenger-font-display` (Manrope), body uses `--tenger-font-sans` (Plus Jakarta Sans)
- Min body text: 16px non-negotiable

#### Visual acceptance

- Auth template: handoff `LoginScreen` — logo icon (navy square + white checkmark + gold halo), heading, subtext, Facebook dark button, "or" divider, outline email button
- Detail template: handoff `TaskDetailScreen` — TopBar + scrollable content + sticky footer CTA bar
- Success: handoff `ApplySuccessScreen` — centered check circle, heading, body, outline button

#### Non-goals

- Do NOT change props APIs
- Do NOT change template logic (loading states, error handling, pagination)
- Do NOT add new templates

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-1.4: Web layouts

#### Scope

1. `apps/web/src/layout/ScreenFrame.tsx`
2. `apps/web/src/layout/Header.tsx`
3. `apps/web/src/layout/BottomNavBar.tsx`
4. `apps/web/src/layout/DesktopSidebar.tsx`
5. `apps/web/src/layout/AdminLayout.tsx`
6. `apps/web/src/AppShell.tsx`
7. `apps/web/src/styles.css` (or global CSS entry point)

#### Token/class mapping

- `ScreenFrame`: verify background uses `var(--color-background)` (`--tenger-canvas` / `#F9F8F5`)
- `Header`: backdrop-blur, verify uses `--tenger-ink` for logo text, `--tenger-line` for border
- `BottomNavBar`: frosted glass → `bg-background/60 backdrop-blur-lg`, shadow `--tenger-shadow-nav`, active tab `--tenger-ink`, inactive `--tenger-nav-inactive`
- `DesktopSidebar`: `w-56`, active link `bg-primary/10 text-primary`, separator `--tenger-line`
- `AdminLayout`: apply same design tokens as consumer layouts (user decision: admin matches consumer)
- `AppShell`: verify metallic gradient overlay or remove if handoff doesn't specify it

#### Visual acceptance

- Bottom nav: mobile equivalent of handoff `BottomNav` — frosted glass, active/inactive colors
- Desktop sidebar: clean nav links, active state highlighting
- Admin layout: same card/surface/spacing system as consumer pages

#### Non-goals

- Do NOT change page files under `apps/web/src/pages/`
- Do NOT change route structure

#### Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
```

### Tranche T-1.5: Web parity shells

#### Scope

1. `apps/web/src/layout/parity/ResponsiveFeedShell.tsx`
2. `apps/web/src/layout/parity/ResponsiveDetailShell.tsx`
3. `apps/web/src/layout/parity/ResponsiveWizardShell.tsx`
4. `apps/web/src/layout/parity/ActionRail.tsx`
5. `apps/web/src/layout/parity/StatePanel.tsx`
6. `apps/web/src/layout/parity/TimelineList.tsx`

#### Inputs

- `handoff/project/ui_kits/mobile/index.html` → `BrowseScreen`, `TaskDetailScreen` (feed + detail layout patterns)
- `handoff/project/preview/components-cards.html` — card surfaces, trust banner

#### Token/class mapping

- All layout tokens: verify spacing uses `--tenger-*` derived Tailwind utilities
- Card surfaces: `bg-card` (`--tenger-surface`), shadow `shadow-card`
- Typography: headings `font-display` (Manrope), body `font-sans` (Plus Jakarta Sans)
- Spacing: `p-4 px-5` for content, `gap-3` for card stacks

#### Visual acceptance

- `ResponsiveFeedShell`: matches `BrowseScreen` — feed list with card gaps, header area
- `ResponsiveDetailShell`: matches `TaskDetailScreen` — detail content + sticky action sidebar
- `ResponsiveWizardShell`: matches task creation wizard — narrow centered form, step indicator

#### Non-goals

- Do NOT add new parity shells
- Do NOT change feature components

#### Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
```

### Tranche T-1.6: Web styles + font loading

#### Scope

1. `apps/web/src/styles.css` — verify font stack imports, CSS variable consumption
2. `apps/web/index.html` — verify Google Fonts loading for Manrope + Plus Jakarta Sans
3. `apps/mobile/src/design/theme.ts` — verify `@expo-google-fonts/manrope` + `@expo-google-fonts/plus-jakarta-sans` loading

#### Token/class mapping

- Font stack: `'Manrope' → Manrope 600/700, 'Plus Jakarta Sans' → Plus Jakarta Sans 400/500/600/700`
- CSS: `@import` Google Fonts or `@font-face` with external URLs
- Mobile: verify `useFonts` loads both families with correct weights
- Body text minimum: 16px everywhere
- Line heights: 1.6 body, 1.3 tight

#### Non-goals

- Do NOT commit TTF files to the repo
- Do NOT change component files

#### Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/mobile typecheck
pnpm -r typecheck
```

---

## Phase 2 — Primitive Components

**5 tranches · 6–12 files each · Web + mobile paired per tranche**

### Tranche T-2.1: Inputs & forms

#### Scope

**Web:**

1. `apps/web/src/components/ui/input.tsx`
2. `apps/web/src/components/ui/label.tsx`
3. `apps/web/src/components/ui/textarea.tsx`
4. `apps/web/src/components/ui/checkbox.tsx`
5. `apps/web/src/components/ui/switch.tsx`

**Mobile:** 6. `apps/mobile/src/components/ui/Input.tsx` 7. `apps/mobile/src/components/ui/FormField.tsx` 8. `apps/mobile/src/components/ui/SearchBar.tsx` 9. `apps/mobile/src/components/ui/FilterBar.tsx` 10. `apps/mobile/src/components/ui/LanguageSwitcher.tsx`

#### Inputs

- `handoff/project/preview/components-inputs.html`
- `handoff/project/ui_kits/mobile/components.jsx` — Input, FilterChip

#### Token/class mapping

- Input border: `--tenger-line` default, `--tenger-ink` focus, `--tenger-danger` invalid
- Input height: 48px
- Input radius: `--tenger-radius-sm` (8px)
- Input font: `--tenger-font-sans`, 16px, `--tenger-ink` text color
- Placeholder: `--tenger-text-tertiary`
- Label: 13px, `--tenger-font-sans`, weight 600, `--tenger-ink`
- Helper/error: 12px, `--tenger-text-tertiary` / `--tenger-danger`
- Search bar: `--tenger-subtle` bg, no border, 52px height
- Filter chip active: `--tenger-ink` bg, white text, `--tenger-radius-full`
- Filter chip inactive: `--tenger-subtle` bg, `--tenger-ink` text, `--tenger-line` border

#### Visual acceptance

- `preview/components-inputs.html` — default input, focused, invalid, search bar

#### Non-goals

- Do NOT change form logic (validation, submission, field state management)
- Do NOT change component props API

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-2.2: Actions (buttons, pressables, FAB)

#### Scope

**Web:**

1. `apps/web/src/components/ui/button.tsx`

**Mobile:** 2. `apps/mobile/src/components/ui/Button.tsx` 3. `apps/mobile/src/components/ui/Touchable.tsx` 4. `apps/mobile/src/components/ui/FAB.tsx` 5. `apps/mobile/src/components/ui/ActionRow.tsx` 6. `apps/mobile/src/components/ui/TabBarButton.tsx` 7. `apps/mobile/src/components/ui/PressableCard.tsx`

#### Token/class mapping

- Primary button: `--tenger-ink` bg, white text, `--tenger-shadow-fab`, height 48px, radius 8px
- Secondary button: `--tenger-sun-light` bg, white text
- Outline button: transparent bg, `--tenger-ink` text, `1.5px solid --tenger-line`
- Ghost button: transparent, `--tenger-ink` text
- Danger button: `--tenger-danger` bg, white text
- Press state: `opacity 0.92` + `scale(0.98)` spring easing
- Disabled: `opacity 0.4`, no shadow
- Sizes: sm 40px, md 48px, lg 56px
- FAB: `--tenger-sun-light` bg, white `+` icon, 52×52, `--tenger-radius-md`, `--tenger-shadow-fab`

#### Visual acceptance

- `preview/components-buttons.html` — all variants, sizes, disabled state

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-2.3: Surfaces (cards, sheets, dialogs)

#### Scope

**Web:**

1. `apps/web/src/components/ui/card.tsx`
2. `apps/web/src/components/ui/dialog.tsx`
3. `apps/web/src/components/ui/alert.tsx`

**Mobile:** 4. `apps/mobile/src/components/ui/Card.tsx` 5. `apps/mobile/src/components/ui/ListItemCard.tsx` 6. `apps/mobile/src/components/ui/SplitCard.tsx` 7. `apps/mobile/src/components/ui/StatCard.tsx` 8. `apps/mobile/src/components/ui/ModalSheet.tsx` 9. `apps/mobile/src/components/ui/ActionSheet.tsx` 10. `apps/mobile/src/components/ui/ConfirmSheet.tsx`

#### Token/class mapping

- Card: `--tenger-surface` bg, `--tenger-radius-md` (12px), `--tenger-shadow-card`
- Card body padding: `14px 16px`
- Sheet/dialog: `--tenger-shadow-elevated`, `--tenger-radius-lg` top corners (16px)
- PressableCard: scale(0.98) spring on press

#### Visual acceptance

- `preview/components-cards.html` — task card, trust banner

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-2.4: Signals (badges, ratings, trust, skeletons)

#### Scope

**Web:**

1. `apps/web/src/components/ui/badge.tsx`
2. `apps/web/src/components/ui/skeleton.tsx`
3. `apps/web/src/components/ui/separator.tsx`
4. `apps/web/src/components/ui/tabs.tsx`

**Mobile:** 5. `apps/mobile/src/components/ui/StatusBadge.tsx` 6. `apps/mobile/src/components/ui/VerifiedBadge.tsx` 7. `apps/mobile/src/components/ui/RatingStars.tsx` 8. `apps/mobile/src/components/ui/TrustBanner.tsx` 9. `apps/mobile/src/components/ui/PriceTag.tsx` 10. `apps/mobile/src/components/ui/SkeletonLoader.tsx` 11. `apps/mobile/src/components/ui/Reveal.tsx` 12. `apps/mobile/src/components/ui/HandDrawnCheck.tsx`

#### Token/class mapping

- **StatusBadge:** ALL-CAPS, `--tenger-font-sans` bold, 10px, `--tenger-letter-spacing-caps` (0.075em), `--tenger-radius-full`
  - open: `--tenger-status-open` bg, `--tenger-status-open-fg` text
  - assigned: `--tenger-status-assigned` bg, `--tenger-status-assigned-fg` text
  - completed: `--tenger-status-completed` bg, `--tenger-status-completed-fg` text (**NEW**)
  - cancelled: `--tenger-status-cancelled` bg, `--tenger-status-cancelled-fg` text (**NEW**)
- **VerifiedBadge:** `--tenger-radius-full`, `--tenger-font-sans` bold
  - verified: `--tenger-verified` bg, white text, ShieldCheck icon
  - pending: `--tenger-sky` bg, white text, Shield icon
  - unverified: hidden (return null)
- **RatingStars:** filled star `--tenger-sun-light`, empty stroke `--tenger-chipInactive`
- **TrustBanner:** `--tenger-sky-soft` tint bg (`rgba(171,201,242,0.25)`), `--tenger-trust` icon bg, `--tenger-trust-muted` text
- **PriceTag:** `--tenger-font-display` bold, `--tenger-sun-light` color, `₮` prefix
- **SkeletonLoader:** 1500ms shimmer, `--tenger-duration-skeleton`
- **HandDrawnCheck:** `--tenger-verified` stroke, 3-4px weight, spring scale-in animation

#### Visual acceptance

- `preview/components-badges.html` — verified badge, status badges
- `preview/components-cards.html` — trust banner
- Handoff `components.jsx` — VerifiedBadge, StatusBadge, RatingStars, TrustBanner

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile test:unit
```

### Tranche T-2.5: Identity (avatars, chips, misc)

#### Scope

**Web:**

1. `apps/web/src/components/ui/avatar.tsx`

**Mobile:** 2. `apps/mobile/src/components/ui/ProfileAvatar.tsx` 3. `apps/mobile/src/components/ui/CategoryChip.tsx` 4. `apps/mobile/src/components/ui/LocationPin.tsx` 5. `apps/mobile/src/components/ui/InfoRow.tsx` 6. `apps/mobile/src/components/ui/TimelineStepper.tsx` 7. `apps/mobile/src/components/ui/StepIndicator.tsx` 8. `apps/mobile/src/components/ui/PhotoGrid.tsx` 9. `apps/mobile/src/components/ui/ScreenHeader.tsx` 10. `apps/mobile/src/components/ui/ReviewCard.tsx` 11. `apps/mobile/src/components/ui/OfflineBanner.tsx` 12. `apps/mobile/src/components/ui/LoginRequiredCTA.tsx` 13. `apps/mobile/src/components/ui/PermissionPrimer.tsx` 14. `apps/mobile/src/components/ui/Toast.tsx`

#### Token/class mapping

- **ProfileAvatar:** `--tenger-subtle` bg for initials, `--tenger-radius-md` for small (12px), `--tenger-radius-full` for large (≥80px)
- Verified overlay: `--tenger-verified` circle, white checkmark
- **CategoryChip:** `--tenger-subtle` bg, `--tenger-ink` text, `--tenger-radius-full`, 11px weight 600
- **InfoRow:** `--tenger-text-tertiary` label, `--tenger-ink` value
- **ScreenHeader:** `--tenger-font-display` bold, `--tenger-ink-deep`, 22px heading

#### Visual acceptance

- `preview/components-avatar.html` — avatar variants
- Handoff `ProfileAvatar` component specs

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/mobile test:unit
```

---

## Phase 3 — Feature Domain Compositions

**12 tranches · 3–10 files each · Residual drift cleanup only**

Each domain tranche sweeps feature components that still hold hardcoded hex values, spacing math, or shadow styles not flowing through Phase 2 primitives. If a primitive change from Phase 2 already fixed the component, skip it and note "pass-through" in the commit.

**Common rubric for all Phase 3 tranches:**

- **Inputs:** `handoff/project/ui_kits/mobile/components.jsx` + relevant handoff screen from `handoff/project/ui_kits/mobile/index.html`
- **Commit shape:** `style(<domain>): align <component-name> to Тэнгэр design tokens`
- **Rollback signal:** If typecheck fails after changes, revert only the failing file. Do NOT expand scope to fix upstream consumers.

### T-3.1: Auth domain

#### Scope

1. `apps/mobile/src/features/auth/components/LoginForm.tsx`
2. `apps/web/src/pages/AuthPage.tsx`
3. `apps/web/src/pages/LandingPage.tsx`

#### Token/class mapping

- Facebook button: `variant="dark"` → gradient from `--tenger-ink-deep` to `--tenger-ink`, white text, `--tenger-shadow-fab`
- Email button: `variant="outline"` → transparent bg, `--tenger-ink` text, `1.5px solid --tenger-line`
- Logo icon: navy `#002444` square, `--tenger-radius-sm` (8px), white checkmark SVG, gold halo `rgba(253,206,106,0.2)`
- Divider "or" text: `--tenger-text-tertiary`, `--tenger-letter-spacing-caps`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `LoginScreen` — brand logo area, auth button stacking, legal footer
- `handoff/project/preview/components-buttons.html` — dark variant, outline variant

#### Non-goals

- Do NOT change auth logic (Facebook SDK, email flow, OTP)
- Do NOT change component props

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/web test:unit
```

### T-3.2: Verification domain

#### Scope

1. `apps/mobile/src/features/verification/components/VerificationModal.tsx`

#### Token/class mapping

- VerifiedBadge: `--tenger-verified` bg, ShieldCheck icon → see T-2.4 spec
- Pending state: `--tenger-sky` bg, Shield icon
- Success animation: `--tenger-verified` stroke checkmark, spring easing

#### Visual acceptance

- `handoff/project/ui_kits/mobile/components.jsx` → `VerifiedBadge` component

#### Non-goals

- Do NOT change verification submission/upload logic

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.3: Tasks domain

#### Scope

1. `apps/mobile/src/features/tasks/components/TaskDetailsModal.tsx`
2. `apps/mobile/src/features/tasks/components/TaskCardSkeleton.tsx`
3. `apps/mobile/src/features/tasks/components/ApplicationSentSuccess.tsx`
4. `apps/mobile/src/features/tasks/components/NoApplicantRescue.tsx`
5. `apps/mobile/src/features/tasks/components/TaskCancelSheet.tsx`
6. `apps/mobile/src/features/tasks/components/VerificationGate.tsx`

#### Token/class mapping

- TaskCard in lists: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`, padding `14px 16px`
- Price display: `--tenger-sun-light` color, `--tenger-font-display` bold 16px
- Skeleton: `--tenger-duration-skeleton` (1500ms) shimmer animation
- Success checkmark: `--tenger-verified` stroke, spring scale-in
- Cancel sheet: `--tenger-danger` destructive button

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskCard` component, `ApplySuccessScreen`
- `handoff/project/preview/components-cards.html` → task card structure

#### Non-goals

- Do NOT change task state management, API calls, or navigation

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.4: Matching domain

#### Scope

1. `apps/mobile/src/features/matching/components/InstantMatchTaskerSheet.tsx`

#### Token/class mapping

- Sheet: `--tenger-shadow-elevated`, `--tenger-radius-lg` top corners
- Tasker card: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`
- Accept button: primary variant spec from T-2.2

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskDetailScreen` (sticky footer pattern)

#### Non-goals

- Do NOT change matching algorithm or real-time subscription logic

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.5: Bookings domain

#### Scope

1. `apps/mobile/src/features/bookings/components/BookingConfirmation.tsx`
2. `apps/mobile/src/features/bookings/components/BookingList.tsx`
3. `apps/mobile/src/features/bookings/components/ConfirmCompletionSheet.tsx`
4. `apps/mobile/src/features/bookings/components/CustomerCancelSheet.tsx`
5. `apps/mobile/src/features/bookings/components/TaskerCancelSheet.tsx`
6. `apps/mobile/src/features/bookings/components/TaskerNoShowSheet.tsx`
7. `apps/mobile/src/features/bookings/components/CustomerNoShowSheet.tsx`
8. `apps/mobile/src/features/bookings/components/RescheduleModal.tsx`
9. `apps/mobile/src/features/bookings/components/LeadUnlockSheet.tsx`

#### Token/class mapping

- StatusBadge: ALL states must use `--tenger-status-*` tokens (open, assigned, completed, cancelled)
- Booking cards: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`
- Cancel/destructive CTAs: `--tenger-danger` bg, white text
- Confirmation: `--tenger-verified` success indicators

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `BookingsScreen` (booking card structure)
- `handoff/project/ui_kits/mobile/components.jsx` → `StatusBadge`

#### Non-goals

- Do NOT change booking state machine, cancel policy logic, or reschedule date handling

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.6: Chat domain

#### Scope

1. `apps/mobile/src/features/chat/components/ChatDetailScreen.tsx`
2. `apps/mobile/src/features/chat/components/InboxScreen.tsx`
3. `apps/web/src/pages/shared/InboxPage.tsx`
4. `apps/web/src/pages/shared/ChatDetailPage.tsx`

#### Token/class mapping

- Avatar sizing: 44px inbox, 24px inline → use `ProfileAvatar` with `size` prop
- Unread badge: `--tenger-ink` bg, white text, `--tenger-radius-full`
- Message bubbles: `--tenger-surface` (received), `--tenger-ink` (sent)
- Timestamps: `--tenger-text-tertiary`, 11px
- Dividers: `1px solid --tenger-subtle` (currently `--tenger-line` in some places)

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `InboxScreen` (conversation list items)

#### Non-goals

- Do NOT change WebSocket subscription, message sending, or attachment logic

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/web test:unit
```

### T-3.7: Review domain

#### Scope

1. `apps/mobile/src/features/review/components/ReviewForm.tsx`
2. `apps/mobile/src/features/review/components/ReviewReminder.tsx`
3. `apps/mobile/src/features/review/components/ReviewGateBanner.tsx`
4. `apps/mobile/src/features/review/components/ReviewHardLock.tsx`

#### Token/class mapping

- RatingStars: filled `--tenger-sun-light`, empty stroke `--tenger-chip-inactive`
- Review card: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`
- Form inputs: see T-2.1 spec (border, focus, invalid states)
- Review text: 13px, `--tenger-text-secondary`, `--tenger-font-sans`, line-height 1.5

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskerProfileScreen` reviews section
- `handoff/project/ui_kits/mobile/components.jsx` → `RatingStars`

#### Non-goals

- Do NOT change review gating logic, hard-lock timers, or review submission

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.8: Profile domain

#### Scope

1. `apps/mobile/src/features/profile/components/ProfileView.tsx`
2. `apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx`
3. `apps/web/src/pages/ProfilePage.tsx`
4. `apps/web/src/pages/customer/CustomerTaskerProfilePage.tsx`

#### Token/class mapping

- Stats grid: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`, 3-column grid
- Stat value: `--tenger-font-display` bold 20px, `--tenger-ink-deep`
- Stat label: 11px, `--tenger-text-tertiary`
- Service chips: `--tenger-subtle` bg, `--tenger-ink` text, `--tenger-radius-full`
- VerifiedBadge: see T-2.4 spec
- Edit icon: `--tenger-text-tertiary`, 18px

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskerProfileScreen` (hero, stats, services, reviews)
- `handoff/project/ui_kits/mobile/index.html` → `ProfileScreen` (settings rows)

#### Non-goals

- Do NOT change profile data fetching, edit flow, or navigation

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/web test:unit
```

### T-3.9: Notifications domain

#### Scope

1. `apps/mobile/src/features/notifications/components/NotificationCenter.tsx`
2. `apps/web/src/pages/shared/NotificationsPage.tsx`

#### Token/class mapping

- Notification rows: `--tenger-surface` bg, dividers `1px solid --tenger-subtle`
- Unread indicator: `--tenger-ink` dot
- Timestamp: `--tenger-text-tertiary`

#### Visual acceptance

- Consistent with `InboxScreen` list item pattern

#### Non-goals

- Do NOT change notification subscription, mark-as-read logic, or push handling

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.10: Help / Settings domain

#### Scope

1. `apps/mobile/src/app/(shared)/profile/settings.tsx` (consumes `SettingsTemplate`)
2. `apps/web/src/pages/shared/SettingsPage.tsx`
3. `apps/mobile/src/app/(shared)/help.tsx`
4. `apps/web/src/pages/shared/HelpPage.tsx`

#### Token/class mapping

- ActionRow: `--tenger-surface` bg, `--tenger-radius-md`, `--tenger-shadow-card`, icon gap 12px
- Trailing chevron: `--tenger-text-tertiary`, 16px
- Section titles: `--tenger-font-display` bold 13px, `--tenger-ink-deep`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `ProfileScreen` settings rows

#### Non-goals

- Do NOT change settings logic, toggles behavior, or data persistence

#### Verification

```bash
pnpm -r typecheck
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/web test:unit
```

### T-3.11: Credits domain (mobile-only)

#### Scope

1. `apps/mobile/src/features/credits/components/LowBalanceAlert.tsx`

#### Token/class mapping

- Alert banner: `--tenger-danger` or `--tenger-sun-light` depending on severity
- Text: `--tenger-font-sans`, 14px

#### Visual acceptance

- Consistent with `OfflineBanner` and `TrustBanner` surface patterns

#### Non-goals

- Do NOT change credit balance logic or purchase flow

#### Verification

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit
```

### T-3.12: Web feature components

#### Scope

1. `apps/web/src/components/feature/task-creation/IntakeFormRenderer.tsx`
2. `apps/web/src/components/feature/task-creation/PhotoUploadManager.tsx`
3. `apps/web/src/components/feature/task-creation/LocationPicker.tsx`
4. `apps/web/src/components/feature/landing/ComparisonVisuals.tsx`
5. `apps/web/src/components/feature/GlobalErrorFallback.tsx`

#### Token/class mapping

- Form inputs: see T-2.1 spec (border, focus, invalid states)
- Photo grid: `--tenger-radius-sm` thumbnails, `--tenger-shadow-card`
- Error fallback: `--tenger-danger` icon color, centered layout
- Landing: match handoff `LandingPage` brand colors

#### Visual acceptance

- `handoff/project/preview/components-inputs.html` — form input states
- `handoff/project/preview/components-cards.html` — card surfaces

#### Non-goals

- Do NOT change form validation, file upload, or location API logic

#### Verification

```bash
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/web test:unit
```

---

## Phase 4 — Screen Sweep

**10 tranches · 5–15 files each · Route-group ordered by user flow**

Each tranche passes through route files in order users reach them. Only fix visual drift — if a route already looks correct after Phase 1–3, note it as "pass-through" and do not edit.

**Common rubric for all Phase 4 tranches:**

- **Inputs:** All handoff screens from `handoff/project/ui_kits/mobile/index.html`, relevant preview cards from `handoff/project/preview/`
- **Token/class mapping:** Replace any remaining hardcoded hex values, ad-hoc spacing, or non-token shadows with `--tenger-*` / `--color-*` tokens. Verify all primitive components used (Button, Input, Card, Badge, etc.) conform to Phase 2 specs.
- **Non-goals:** Do NOT change route logic, navigation, data fetching, or screen behavior. Do NOT add new screens.
- **Verification:** `pnpm -r typecheck && pnpm --filter @tasky/<workspace> test:unit`
- **Commit shape:** `style(<route-group>): align <screen-name> to Тэнгэр tokens`
- **Rollback signal:** If typecheck fails after changes, revert only the failing file. Do NOT expand scope to fix upstream consumers.

### T-4.1: Auth screens

#### Scope (exact files — see Route Inventory §T-4.1)

**Mobile (8 files):**

- `apps/mobile/src/app/index.tsx`
- `apps/mobile/src/app/onboarding.tsx`
- `apps/mobile/src/app/create.tsx`
- `apps/mobile/src/app/(auth)/index.tsx`
- `apps/mobile/src/app/(auth)/role-select.tsx`
- `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- `apps/mobile/src/app/(auth)/permission-location.tsx`
- `apps/mobile/src/app/(auth)/permission-camera.tsx`

**Web (3 files):**

- `apps/web/src/pages/AuthPage.tsx`
- `apps/web/src/pages/LandingPage.tsx`
- `apps/web/src/pages/RestrictedAccountPage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `LoginScreen`

### T-4.2: Tab screens

#### Scope (exact files — see Route Inventory §T-4.2)

**Mobile (6 files):**

- `apps/mobile/src/app/(tabs)/index.tsx`
- `apps/mobile/src/app/(tabs)/bookings.tsx`
- `apps/mobile/src/app/(tabs)/profile.tsx`
- `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- `apps/mobile/src/app/profile/[id].tsx`

**Web (8 files):**

- `apps/web/src/pages/CustomerDashboardPage.tsx`
- `apps/web/src/pages/TaskerFeedPage.tsx`
- `apps/web/src/pages/TaskerTasksPage.tsx`
- `apps/web/src/pages/customer/CustomerTasksListPage.tsx`
- `apps/web/src/pages/shared/InboxPage.tsx`
- `apps/web/src/pages/shared/ChatDetailPage.tsx`
- `apps/web/src/pages/ProfilePage.tsx`
- `apps/web/src/pages/MessagingNotificationsPage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `BrowseScreen`, `BookingsScreen`, `InboxScreen`, `ProfileScreen`

### T-4.3: Task creation wizard

#### Scope (exact files — see Route Inventory §T-4.3)

**Mobile (9 files):**

- `apps/mobile/src/app/(customer)/tasks/new/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- `apps/mobile/src/app/(customer)/tasks/new/success.tsx`
- `apps/mobile/src/app/(customer)/rebook.tsx`

**Web (4 files):**

- `apps/web/src/pages/customer/CustomerTaskWizardPage.tsx`
- `apps/web/src/pages/customer/CustomerTaskSuccessPage.tsx`
- `apps/web/src/pages/CustomerTaskDetailsPage.tsx`
- `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `BrowseScreen` FAB placement
- `handoff/project/preview/components-inputs.html` — form input states

### T-4.4a: Customer task detail & applicants

#### Scope

**Mobile (5 files):**

- `apps/mobile/src/app/(customer)/tasks/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- `apps/mobile/src/app/(customer)/tasks/[taskId]/rescue.tsx`
- `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`

**Web (4 files):**

- `apps/web/src/pages/customer/CustomerApplicantsPage.tsx`
- `apps/web/src/pages/customer/CustomerTaskerProfilePage.tsx`
- `apps/web/src/pages/CustomerTaskDetailsPage.tsx` (if not touched in T-4.3)
- `apps/web/src/pages/customer/CustomerNoApplicantRescuePage.tsx` (if not touched in T-4.3)

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskDetailScreen`

### T-4.4b: Customer bookings & disputes

#### Scope

**Mobile (8 files):**

- `apps/mobile/src/app/(customer)/bookings/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/cancel.tsx`
- `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`

**Web (9 files):**

- `apps/web/src/pages/BookingConfirmationPage.tsx`
- `apps/web/src/pages/BookingSafetyPage.tsx`
- `apps/web/src/pages/customer/CustomerBookingsPage.tsx`
- `apps/web/src/pages/customer/CustomerBookingDetailPage.tsx`
- `apps/web/src/pages/customer/CustomerBookingConfirmedPage.tsx`
- `apps/web/src/pages/customer/CustomerTimelinePage.tsx`
- `apps/web/src/pages/customer/CustomerReschedulePage.tsx`
- `apps/web/src/pages/customer/CustomerDisputeRaisePage.tsx`
- `apps/web/src/pages/customer/CustomerDisputeStatusPage.tsx`
- `apps/web/src/pages/customer/CustomerRebookPage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `BookingsScreen` (booking card + StatusBadge states)

### T-4.4c: Tasker jobs & detail

#### Scope

**Mobile (5 files):**

- `apps/mobile/src/app/(tasker)/tasks/applied.tsx`
- `apps/mobile/src/app/(tasker)/tasks/[taskId].tsx`
- `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
- `apps/mobile/src/app/(tasker)/jobs/[bookingId]/cancel.tsx`
- `apps/mobile/src/app/(tasker)/stats.tsx`
- `apps/mobile/src/app/task/[id].tsx`
- `apps/mobile/src/app/task/[id]/applicants.tsx`

**Web (7 files):**

- `apps/web/src/pages/tasker/TaskerTaskDetailPage.tsx`
- `apps/web/src/pages/tasker/TaskerApplicationSentPage.tsx`
- `apps/web/src/pages/tasker/TaskerJobsPage.tsx`
- `apps/web/src/pages/tasker/TaskerBookingDetailPage.tsx`
- `apps/web/src/pages/tasker/TaskerStatsPage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/index.html` → `TaskDetailScreen` (sticky footer CTA pattern)

### T-4.5: Verification

#### Scope (exact files — see Route Inventory §T-4.5)

**Mobile (7 files):**

- `apps/mobile/src/app/(tasker)/verification/index.tsx`
- `apps/mobile/src/app/(tasker)/verification/consent.tsx`
- `apps/mobile/src/app/(tasker)/verification/upload.tsx`
- `apps/mobile/src/app/(tasker)/verification/pending.tsx`
- `apps/mobile/src/app/(tasker)/verification/approved.tsx`
- `apps/mobile/src/app/(tasker)/verification/rejected.tsx`
- `apps/mobile/src/app/(tasker)/verification/submitted.tsx`

**Web (7 files):**

- `apps/web/src/pages/tasker/VerificationGatePage.tsx`
- `apps/web/src/pages/tasker/VerificationConsentPage.tsx`
- `apps/web/src/pages/tasker/VerificationUploadPage.tsx`
- `apps/web/src/pages/tasker/VerificationPendingPage.tsx`
- `apps/web/src/pages/tasker/VerificationApprovedPage.tsx`
- `apps/web/src/pages/tasker/VerificationRejectedPage.tsx`
- `apps/web/src/pages/tasker/VerificationSubmittedPage.tsx`

#### Visual acceptance

- `handoff/project/ui_kits/mobile/components.jsx` → `VerifiedBadge` states

### T-4.6: Shared screens

#### Scope (exact files — see Route Inventory §T-4.6)

**Mobile (14 files):**

- `apps/mobile/src/app/(shared)/notifications.tsx`
- `apps/mobile/src/app/(shared)/network-error.tsx`
- `apps/mobile/src/app/(shared)/session-expired.tsx`
- `apps/mobile/src/app/(shared)/app-update.tsx`
- `apps/mobile/src/app/(shared)/help.tsx`
- `apps/mobile/src/app/(shared)/legal/terms.tsx`
- `apps/mobile/src/app/(shared)/legal/privacy.tsx`
- `apps/mobile/src/app/(shared)/profile/edit.tsx`
- `apps/mobile/src/app/(shared)/profile/settings.tsx`
- `apps/mobile/src/app/(shared)/profile/delete.tsx`
- `apps/mobile/src/app/(shared)/account/suspended.tsx`
- `apps/mobile/src/app/(shared)/account/banned.tsx`
- `apps/mobile/src/app/(shared)/review/[bookingId].tsx`
- `apps/mobile/src/app/(shared)/review/hard-lock.tsx`

**Web (16 files):**

- All files from Route Inventory §T-4.6

### T-4.7: Admin

#### Scope

**Web (8 files):**

- `apps/web/src/pages/admin/AdminVerificationsPage.tsx`
- `apps/web/src/pages/admin/AdminDisputesPage.tsx`
- `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx`
- `apps/web/src/pages/admin/AdminUsersPage.tsx`
- `apps/web/src/pages/admin/AdminCategoriesPage.tsx`
- `apps/web/src/pages/admin/AdminFeaturesPage.tsx`
- `apps/web/src/pages/admin/AdminConciergePage.tsx`
- `apps/web/src/pages/admin/AdminModerationPage.tsx`

#### Visual acceptance

- Apply same card/surface/button/typography system as consumer pages (user decision: admin matches consumer)

---

## Phase 5 — Content, Voice, Iconography Polish

**3 tranches · Wide + shallow · Text/icon sweep only**

**Common rubric for all Phase 5 tranches:**

- **Non-goals:** Do NOT change component structure, logic, or layout. Text/icon changes only.
- **Commit shape:** `style(content): <description-of-change>`
- **Rollback signal:** If any test fails after text changes, the casing rule was applied incorrectly to a string used programmatically (e.g. as an API key or comparison value). Revert the specific string and investigate.

### T-5.1: Casing & microcopy

#### Inputs

- `handoff/project/README.md` → **CONTENT FUNDAMENTALS** section
- `handoff/project/README.md` → **Tone examples**

#### Scope

All inline strings across both apps:

- Sentence-case everywhere except `StatusBadge` (ALL-CAPS Cyrillic with `0.075em` tracking)
- Price format: `₮` prefix, comma-separated (e.g. `₮120,000`)
- No emoji anywhere in UI
- Verify tone against handoff samples (verification, booking, dispute, empty state, payment held)
- Flush-left alignment: never `text-justify`
- Body text floor: 16px for Mongolian copy

#### Visual acceptance

- `handoff/project/README.md` → **CONTENT FUNDAMENTALS** — tone samples, casing rules, number format

#### Verification

```bash
pnpm -r typecheck
pnpm -r test
```

### T-5.2: Iconography

#### Inputs

- `handoff/project/README.md` → **ICONOGRAPHY** section

#### Scope

All icon usage across both apps.

- Library: `lucide-react` (web) / `lucide-react-native` (mobile) — outlined stroke style only
- Sizes: 16px (sm inline), 18px (nav), 20px (standard), 24px (feature)
- Active nav: `--tenger-ink` color
- Inactive nav: `--tenger-nav-inactive`
- Verified: `ShieldCheck` filled when verified, `Shield` stroke when pending
- Star ratings: fill with `--tenger-sun-light` when active, stroke `--tenger-chip-inactive` when inactive
- Remove any non-Lucide icon usage (emoji icons, custom SVG icons where Lucide equivalent exists)

#### Visual acceptance

- `handoff/project/README.md` → **ICONOGRAPHY** — size table, fill rules, forbidden patterns

#### Verification

```bash
pnpm -r typecheck
pnpm -r test
```

### T-5.3: Translation casing polish

#### Inputs

- `handoff/project/README.md` → **CONTENT FUNDAMENTALS** — casing, letter-spacing rules

#### Scope

Locale files (exact paths — discover via glob at execution time, expected pattern):

```
apps/mobile/src/i18n/locales/{mn,en}.json
apps/web/src/i18n/locales/{mn,en}.json
apps/mobile/src/i18n/locales/**/*.json
apps/web/src/i18n/locales/**/*.json
```

- No string additions or removals
- Only touch where casing/tracking rules mechanically alter rendered strings
- Verify ALL-CAPS strings only exist for StatusBadge labels: `"НЭЭЛТТЭЙ"`, `"ХУВААРИЛАГДСАН"`, `"ДУУССАН"`, `"ЦУЦЛАГДСАН"`, `"ИРЭЭГҮЙ"`
- Verify price formatting in all string templates uses `₮` prefix
- Verify `letterSpacing` style properties use `0.075em` for ALL-CAPS badges only

#### Visual acceptance

- `handoff/project/ui_kits/mobile/components.jsx` → `StatusBadge` labels and casing
- `handoff/project/README.md` → number format rules

#### Verification

```bash
pnpm -r typecheck
pnpm -r test
```

---

## Commit & Branch Convention

| Convention | Pattern                                                              |
| ---------- | -------------------------------------------------------------------- |
| Branch     | `agent/TASK-UI-<phase>-<slug>` (e.g. `agent/TASK-UI-0-token-rename`) |
| Commit     | One commit per tranche                                               |
| CHANGELOG  | Append entry under `## Unreleased` before PR                         |
| Co-author  | `Co-Authored-By: <agent> <noreply@tasky.mn>`                         |

## Rollback Protocol

If a tranche fails verification:

1. **STOP** — do not expand scope to fix regressions
2. **REVERT** — `git checkout HEAD -- .` to undo the tranche
3. **ESCALATE** — report the failing file(s), error message(s), and what was attempted
4. The planner will split the tranche or adjust the approach

## Full Verification Gate (run after every tranche)

```bash
# Minimum (every tranche)
pnpm -r typecheck
pnpm --filter @tasky/<workspace> test:unit

# Token package edits only
pnpm workspace:boundaries

# Full gate (before merge)
pnpm -r typecheck && pnpm -r test && pnpm -r lint && pnpm workspace:boundaries
```
