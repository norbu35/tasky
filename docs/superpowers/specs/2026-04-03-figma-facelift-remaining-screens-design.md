# Design Spec: Autonomous Figma Facelift — Remaining Mobile Screens

**Date:** 2026-04-03
**Status:** approved
**Figma file key:** `IljfnTQPkq7vpkmK1NN1NC`
**Screen specs directory:** `docs/design/screen-specs/`
**Implementation plan:** See `docs/plans/figma-facelift-remaining-screens-plan.md` (generated from this spec)

---

## 1. Goal

Apply visual polish to all remaining mobile screens in `apps/mobile/` so they align with the Figma designs in file `IljfnTQPkq7vpkmK1NN1NC`. This is a **style-only pass** — no changes to component APIs, prop names, navigation logic, test IDs, or business logic.

---

## 2. Established Design Language

### 2.1 Token Imports

Every screen must use tokens via these imports (never hardcode values that exist in the token system):

```tsx
import { mobileTheme } from '<relative-path>/design/tokenAdapter';
import { elevations } from '<relative-path>/design/elevations'; // only when the screen uses card shadows or elevated surfaces
// destructure at top of file:
const { colors, spacing, typography, radius } = mobileTheme;
```

### 2.2 Color Tokens (key values)

| Token | Value | Usage |
|---|---|---|
| `colors.primaryDeep` | `#002444` | Dark navy — headings, icon shells, budget cards |
| `colors.primary` | (blue) | Active states, CTA buttons |
| `colors.secondary` | `#795900` | Gold/amber — budget amounts, FAB bg, unread dots |
| `colors.muted` | `#f4f3f0` | Tonal card backgrounds, search bar bg |
| `colors.card` | `#ffffff` | White card surfaces |
| `colors.background` | `#faf9f6` | Screen background |
| `colors.primaryForeground` | white | Text/icons on dark navy |
| `colors.textSecondary` | (gray) | Secondary labels |
| `colors.textTertiary` | (light gray) | Timestamps, meta text |
| `colors.border` | (light) | **Not used** on cards — removed in favor of elevation |
| `colors.verified` | (green) | Verified badges, success icons |
| `colors.danger` | (red) | Error states |

### 2.3 Elevation Presets

```tsx
elevations.soft    // Cards, buttons: shadow 10px / opacity 0.04 — primary card treatment
elevations.card    // Slightly heavier — reserved for floating elements
elevations.elevated // Strongest — use sparingly (nav bars only)
```

### 2.4 Typography Scale

```
typography.micro    = 10  — chips, micro-labels
typography.caption  = 12  — timestamps, section headers, helper text
typography.label    = 14  — list item labels, form labels
typography.body     = 16  — body text, card descriptions
typography.subtitle = 18  — card section headings
typography.title    = 20  — screen section headings
typography.heading  = 24  — page titles (use fontSize: 24 directly, not token)
typography.heroTitle      — large display text
```

### 2.5 Radius Presets

```
radius.xs  = 4
radius.sm  = 8
radius.md  = 12
radius.lg  = 16 (or similar)
radius.full = 999 — pills/chips
```

---

## 3. Visual Patterns by Screen Archetype

These are the established cross-screen patterns. Every screen belongs to one primary archetype. Apply the pattern for its archetype before consulting Figma for screen-specific details.

### Archetype A — List Feed

Used by: task lists, booking lists, job lists, inbox

```
✅ Apply:
- screenTitle: fontSize 24, fontWeight '800', color colors.primaryDeep
- searchInput (if present): backgroundColor: colors.muted, borderWidth: 0
- Filter chips: active = colors.primaryDeep bg + white text, inactive = '#e3e2e0' bg + dark text
- Card outer wrapper (if Figma shows a tonal frame): colors.muted bg, radius.lg, 4px padding
- Card inner (or card directly if no outer wrapper): colors.card bg, elevations.soft, no borderWidth/borderColor
- Skeleton cards: elevations.soft (not borders)
- FAB: colors.secondary bg, radius.lg

❌ Remove:
- borderWidth / borderColor on any card
- Hardcoded shadowColor / shadowOpacity / shadowRadius / shadowOffset / elevation
  (replace with elevations.soft or elevations.card)
```

### Archetype B — Detail / Hero

Used by: task detail, booking detail, tasker profile, job detail

```
✅ Apply:
- title (main entity name): fontSize 24, fontWeight '700', color colors.primaryDeep
- detailsCard: backgroundColor colors.muted, radius.sm, padding spacing.lg, no border
- budgetCard (dark): backgroundColor colors.primaryDeep, radius.lg, elevations.soft
  - budgetAmount: fontSize 36, fontWeight '800', color colors.secondary
- sectionCard: backgroundColor colors.muted, radius.sm, no border
- locationCard: backgroundColor `${colors.primary}0F`, radius.lg
- taskerCard / profileCard: elevations.soft, no border
- Bottom CTA bar: BlurView intensity={40} tint="light" (matches DetailTemplate)

❌ Remove:
- borderWidth / borderColor on any card section
- paymentNote sections (already done on task detail)
- Hardcoded shadow values
```

### Archetype C — Form Wizard Step

Used by: category, intake, location, photos, schedule, review (task creation wizard steps)

```
✅ Apply:
- FormWizardTemplate wrapper (already present — verify currentStep/totalSteps are correct)
- stepLabel: fontSize typography.caption, fontWeight '700', textTransform 'uppercase',
  letterSpacing 0.8, color colors.textSecondary
- title: fontSize 24, fontWeight '800', color colors.primaryDeep
- subtitle: fontSize typography.body, color colors.textSecondary
- Content cards: backgroundColor colors.muted, radius.lg, elevations.soft
- Picker/selector fields in tonal cards: backgroundColor colors.muted, borderWidth: 0
  - Active/filled state: backgroundColor colors.primaryDeep, text colors.primaryForeground
- Leave `<Input>` component border handling untouched — the shared component owns its own focus/error states

❌ Remove:
- borderWidth on content cards
- Hardcoded shadow values
```

### Archetype D — Success / Confirmation

Used by: task posted success, booking confirmed, verification approved

```
✅ Apply:
- Container: SafeAreaView edges=['top','bottom'], justifyContent 'space-between'
- Icon wrapper: 96×96, radius.md, `${colors.verified}1A` bg (or relevant tint)
- Animated icon: useSharedValue + withSpring scale animation
- statusBadge: `${colors.verified}1A` bg, colors.verified text, radius.full
- headline: fontSize typography.title, fontWeight '900', color colors.primaryDeep, textAlign 'center'
- "Next steps" card: backgroundColor colors.card, radius.md, elevations.soft, padding 32
  - dark label: fontSize typography.caption, fontWeight '700', uppercase, color colors.primaryDeep
- Actions: primary Button (full-width) + secondary outlined button (borderWidth: 2, borderColor colors.border, backgroundColor colors.card)
```

### Archetype E — Auth / Onboarding

Used by: login, onboarding, permissions, role select (done)

```
✅ Apply:
- AuthTemplate wrapper
- heading: fontSize 24, fontWeight '800', color colors.primaryDeep, textAlign 'center'
- subtitle: fontSize typography.body, color colors.textSecondary, textAlign 'center'
- Unselected option cards: backgroundColor colors.muted, no border, radius.md
- Selected option cards: borderWidth 2, borderColor colors.primaryDeep,
  backgroundColor colors.card, elevations.soft
- Primary CTA: colors.primaryDeep bg, minHeight 56, radius.md
- brandIconCard / logo area: elevations.soft (not elevations.card)
- Permission screens: illustration area in tonal card, single primary CTA
```

### Archetype F — Edge / Error / Infra

Used by: network error, session expired, banned, suspended, app update, legal pages, help

```
✅ Apply:
- Container: flex:1, backgroundColor colors.background, centered content
- iconShell: 72×72 circle, colors.muted bg (or danger tint for error states)
- headline: fontSize typography.title, fontWeight '700', color colors.foreground, textAlign 'center'
- body: fontSize typography.body, color colors.textSecondary, textAlign 'center', lineHeight 24
- CTA button: alignSelf 'stretch', marginTop spacing.xl
- For legal/help: scroll container with padding spacing.lg, sectionTitle colors.primaryDeep

❌ Remove:
- borderWidth on any card wrapper
```

### Archetype G — Messaging / Inbox

Used by: inbox list, chat thread

**Inbox list:**
```
✅ Apply:
- Unread rows: backgroundColor '#e7f1fb', no border
- Read rows: backgroundColor colors.background, no border
- Avatar: radius.md (not circle) for non-person icons; circle for person avatars
- Row padding: paddingHorizontal spacing.lg, paddingVertical spacing.md
- Timestamp: inline with name/title row (space-between), fontSize typography.caption
- Unread indicator: colors.secondary dot
```

**Chat thread:** Figma is authoritative — apply general tokens (colors, typography, spacing) but defer layout decisions (message bubbles, input composer, typing indicators) to the Figma result. Do not invent chat-specific patterns from the inbox list rules.

---

## 4. Completed Screens — Skip These

The following screens have already received the facelift. Do NOT re-apply:

| File | Notes |
|---|---|
| `apps/mobile/src/components/templates/FormWizardTemplate.tsx` | BlurView bottom bar ✅ |
| `apps/mobile/src/components/templates/DetailTemplate.tsx` | BlurView bottom bar ✅ |
| `apps/mobile/src/app/(customer)/bookings/index.tsx` | elevations.soft on cards ✅ |
| `apps/mobile/src/app/(customer)/tasks/index.tsx` | Full horizontal card redesign ✅ |
| `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx` | Budget card, section cards ✅ |
| `apps/mobile/src/app/(tabs)/index.tsx` | Tonal search, 24px title ✅ |
| `apps/mobile/src/app/(shared)/notifications.tsx` | Full-width rows, colored shells, promo banner ✅ |
| `apps/mobile/src/app/(tabs)/profile.tsx` | Role badge, tonal info card ✅ |
| `apps/mobile/src/app/(auth)/role-select.tsx` | Border+shadow selected, no border unselected ✅ |

**Explicitly excluded (not visual screens):**

| File | Reason |
|---|---|
| `apps/mobile/src/app/index.tsx` | Root splash/redirect — no visual surface to polish |
| `apps/mobile/src/app/create.tsx` | Navigation shim — delegates to wizard screens |
| `apps/mobile/src/app/(customer)/tasks/new/index.tsx` | Wizard entry redirect — no visual surface |
| All `_layout.tsx` files | Expo Router layout wrappers — not screens |

---

## 5. Phase 1: Sequential Figma-Driven Pass

### 5.1 Execution Protocol

For each screen in the batches below:

1. **Discover node ID** (first screen of a new domain only): read the corresponding `docs/design/screen-specs/SCR-*.yaml` to get the canonical `figma_page` string, then call `get_metadata` on file `IljfnTQPkq7vpkmK1NN1NC` and find the frame matching that string. The `figma_page` values in the batch tables below are approximate references — the YAML is authoritative. Cache all discovered node IDs for the session. If `get_metadata` is slow, `search_design_system` with the screen name is an acceptable alternative for node discovery.
2. **Fetch design context**: call `get_design_context(fileKey, nodeId)` — note layout, colors, spacing, component states.
3. **Read current file**: understand existing structure before editing.
4. **Apply style changes**: use archetype pattern as base, override with any screen-specific details from Figma. Style-only — no logic, prop, or test ID changes.
5. **After every 5 screens**: run `pnpm --filter @tasky/mobile typecheck` and fix any errors before continuing.

**If Figma node is not found** for a screen: fall back to the archetype pattern alone and mark the screen with `[figma-fallback]` in comments for a human review pass.

**Constraint:** Prefer edits to `StyleSheet.create({...})` blocks and style props. Structural JSX additions (wrappers like `BlurView`, conditional style arrays, `ListFooterComponent` for banners) are allowed when needed for the visual pattern. Do not change data-flow JSX, navigation calls, component props unrelated to styling, or `testID` props.

---

### 5.2 Batch 1 — Customer Task Creation Wizard
**Files:** `apps/mobile/src/app/(customer)/tasks/new/`
**Screen specs:** SCR-CUST-002 through SCR-CUST-008
**Archetype:** C (Form Wizard) with SCR-CUST-008 as Archetype D (Success)

| # | File | Figma Page (from SCR-*.yaml) | SCR-ID | Notes |
|---|---|---|---|---|
| 1 | `category.tsx` | `Customer/Post Task Category Selection` | SCR-CUST-002 | 2-col category grid; selected = navy border + shadow |
| 2 | `intake.tsx` | `Customer/Post Task Intake Form` | SCR-CUST-003 | Dynamic form fields; tonal section cards |
| 3 | `photos.tsx` | `Customer/Post Task Photos` | SCR-CUST-004 | Photo upload grid; tonal add-photo tile |
| 4 | `location.tsx` | `Customer/Post Task Location` | SCR-CUST-005 | Map area + address input; tonal container |
| 5 | `schedule.tsx` | `Customer/Post Task Schedule Budget` | SCR-CUST-006 | Already improved; verify date card and budget input styling |
| 6 | `review.tsx` | `Customer/Post Task Review Submit` | SCR-CUST-007 | Section edit rows; submit CTA |
| 7 | `success.tsx` | `Customer/Post Task Success` | SCR-CUST-008 | Already improved; verify against latest Figma |

Typecheck after #7.

---

### 5.3 Batch 2 — Customer Task & Booking Flows
**Files:** `apps/mobile/src/app/(customer)/`
**Screen specs:** SCR-CUST-010 through SCR-CUST-027
**Archetype:** B (Detail) and A (List) depending on screen

| # | File | Figma Page | SCR-ID | Archetype |
|---|---|---|---|---|
| 8 | `tasks/[taskId]/applicants.tsx` | `Customer/Applicant List` | SCR-CUST-011 | A (List) |
| 9 | `taskers/[taskerId].tsx` | `Customer/Tasker Public Profile` | SCR-CUST-012 | B (Detail) |
| 10 | `bookings/[bookingId]/index.tsx` | `Customer/Booking Detail` | SCR-CUST-014 | B (Detail) |
| 11 | `bookings/[bookingId]/timeline.tsx` | `Customer/Booking Timeline` | SCR-CUST-015 | B (Detail) |
| 12 | `bookings/confirm.tsx` | `Customer/Booking Confirm` | SCR-CUST-016 | B (Detail) |
| 13 | `bookings/confirmed.tsx` | `Customer/Booking Confirmed` | SCR-CUST-017 | D (Success) |
| 14 | `rebook.tsx` | `Customer/Rebook` | SCR-CUST-023 | B (Detail) |
| 15 | `bookings/[bookingId]/reschedule.tsx` | `Customer/Reschedule` | SCR-CUST-019 | C (Form) |
| 16 | `bookings/[bookingId]/dispute.tsx` | `Customer/Dispute` | SCR-CUST-020 | C (Form) |
| 17 | `tasks/[taskId]/instant-match.tsx` | `Customer/Instant Match` | SCR-CUST-027 | B (Detail) |
| 18 | `bookings/[bookingId]/escrow.tsx` | `Customer/Escrow` | SCR-CUST-022 | B (Detail) |
| 19 | `disputes/[disputeId]/index.tsx` | `Customer/Dispute Detail` | SCR-CUST-021 | B (Detail) |

Typecheck after #14, then again after #19.

---

### 5.4 Batch 3 — Tasker Core Screens
**Files:** `apps/mobile/src/app/(tasker)/`
**Screen specs:** SCR-TASK-002 through SCR-TASK-018
**Archetype:** A (List), B (Detail), C (Form), D (Success) as noted

| # | File | Figma Page | SCR-ID | Archetype |
|---|---|---|---|---|
| 20 | `tasks/[taskId].tsx` | `Tasker/Task Detail Tasker` | SCR-TASK-002 | B (Detail) |
| 21 | `jobs/index.tsx` | `Tasker/Jobs List` | SCR-TASK-005 | A (List) |
| 22 | `jobs/[bookingId]/index.tsx` | `Tasker/Job Detail` | SCR-TASK-006 | B (Detail) |
| 23 | `stats.tsx` | `Tasker/Earnings Stats` | SCR-TASK-009 | B (Detail) |
| 24 | `wallet/index.tsx` | `Tasker/Wallet` | SCR-TASK-010 | B (Detail) |
| 25 | `wallet/payout.tsx` | `Tasker/Payout` | SCR-TASK-011 | C (Form) |
| 26 | `verification/index.tsx` | `Tasker/Verification Hub` | SCR-TASK-003 | B (Detail) |
| 27 | `verification/consent.tsx` | `Tasker/Verification Consent` | SCR-TASK-004 | E (Auth) |
| 28 | `verification/upload.tsx` | `Tasker/Verification Upload` | SCR-TASK-013 | C (Form) |
| 29 | `verification/pending.tsx` | `Tasker/Verification Pending` | SCR-TASK-014 | D (Success) |
| 30 | `verification/approved.tsx` | `Tasker/Verification Approved` | SCR-TASK-015 | D (Success) |
| 31 | `verification/rejected.tsx` | `Tasker/Verification Rejected` | SCR-TASK-016 | F (Edge) |
| 32 | `verification/submitted.tsx` | `Tasker/Verification Submitted` | — | D (Success) |
| 33 | `verification/dan.tsx` | `Tasker/Verification DAN` | SCR-TASK-018 | C (Form) |
| 34 | `subscription.tsx` | `Tasker/Subscription` | SCR-TASK-007 | B (Detail) |
| 35 | `referrals.tsx` | `Tasker/Referrals` | SCR-TASK-008 | B (Detail) |
| 36 | `credits/index.tsx` | `Tasker/Credits` | SCR-P2-001 | B (Detail) |
| 37 | `credits/history.tsx` | `Tasker/Credits History` | SCR-P2-002 | A (List) |
| 38 | `credits/pay.tsx` | `Tasker/Credits Pay` | SCR-P2-003 | C (Form) |
| 39 | `profile/polish.tsx` | `Tasker/Profile Polish` | SCR-TASK-012 | C (Form) |

Typecheck after #27, then again after #39.

---

### 5.5 Batch 4 — Shared, Auth, Inbox, Profile
**Files:** `apps/mobile/src/app/(auth)/`, `(shared)/`, `(tabs)/inbox/`, `profile/`, `task/`
**Archetype:** E (Auth), G (Inbox), B (Detail), F (Edge)

| # | File | Figma Page | SCR-ID | Archetype |
|---|---|---|---|---|
| 40 | `(auth)/index.tsx` | `Shared/Auth Login` | SCR-SHARED-002 | E (Auth) |
| 41 | `onboarding.tsx` | `Shared/Onboarding` | SCR-SHARED-005 | E (Auth) |
| 42 | `(auth)/permission-camera.tsx` | `Shared/Permission Camera` | SCR-SHARED-006 | E (Auth) |
| 43 | `(auth)/permission-location.tsx` | `Shared/Permission Location` | SCR-SHARED-007 | E (Auth) |
| 44 | `(auth)/permission-notifications.tsx` | `Shared/Permission Notifications` | SCR-SHARED-008 | E (Auth) |
| 45 | `(auth)/otp.tsx` | `Shared/OTP Verification` | SCR-SHARED-003 | E (Auth) |
| 46 | `(auth)/otp-migration.tsx` | `Shared/OTP Migration` | SCR-SHARED-004 | E (Auth) |
| 47 | `(tabs)/inbox/index.tsx` | `Shared/Inbox List` | SCR-SHARED-010 | G (Inbox) |
| 48 | `(tabs)/inbox/[id].tsx` | `Shared/Chat Thread` | SCR-SHARED-011 | G (Inbox) |
| 49 | `(shared)/review/[bookingId].tsx` | `Shared/Leave Review` | SCR-SHARED-012 | C (Form) |
| 50 | `(shared)/profile/edit.tsx` | `Shared/Edit Profile` | SCR-SHARED-013 | C (Form) |
| 51 | `(shared)/profile/settings.tsx` | `Shared/Settings` | SCR-SHARED-014 | F (Edge) |
| 52 | `(shared)/profile/delete.tsx` | `Shared/Delete Account` | SCR-SHARED-015 | F (Edge) |
| 53 | `profile/[id].tsx` | `Shared/Public Profile` | SCR-SHARED-009 | B (Detail) |
| 54 | `task/[id].tsx` | `Tasker/Task Detail Tasker` | SCR-TASK-002 | B (Detail) — same Figma ref as #20; this is a public view with fewer sections. Read the file first and apply matching styles to whatever sections exist. |
| 55 | `task/[id]/applicants.tsx` | `Customer/Applicant List` | — | A (List) — public applicant view; same visual treatment as #8 |
| 56 | `(tabs)/bookings.tsx` | `Customer/Bookings List` | SCR-CUST-013 | A (List) |
| 57 | `(tabs)/tasks.tsx` | `Tasker/Jobs List` | SCR-TASK-005 | A (List) — same Figma as #21 |

Typecheck after #44 (auth block), after #48 (inbox block), then again after #57.

---

### 5.6 Batch 5 — Edge / Utility Screens
**Archetype:** F (Edge) for all — apply pattern directly, Figma fetch optional

| # | File | Notes |
|---|---|---|
| 58 | `(shared)/account/banned.tsx` | Centered icon + headline + body; danger tint shell |
| 59 | `(shared)/account/suspended.tsx` | Same as banned with warning tint |
| 60 | `(shared)/app-update.tsx` | Centered illustration + headline + store CTA |
| 61 | `(shared)/network-error.tsx` | Error icon shell + retry CTA |
| 62 | `(shared)/session-expired.tsx` | Lock icon shell + re-login CTA |
| 63 | `(shared)/help.tsx` | Scroll view with tonal section cards |
| 64 | `(shared)/legal/terms.tsx` | Pure scroll — ensure padding and typography only |
| 65 | `(shared)/legal/privacy.tsx` | Same as terms |

For Batch 5, Figma fetch is optional — apply Archetype F pattern directly. Typecheck at end of batch.

---

## 6. Phase 2: Archetype Consistency Pass

### 6.1 When to Run

After Phase 1 is fully complete and typecheck is clean.

### 6.2 Protocol

For each archetype:
1. Read 2–3 representative screens from Phase 1 output
2. Compare against the archetype pattern table in Section 3
3. Identify any divergence (wrong bg color, leftover border, wrong font size, hardcoded shadow)
4. Patch the divergence — do not re-apply the full pass, only fix the delta
5. Run typecheck after patching each archetype group

### 6.3 Consistency Checks per Archetype

**A — List Feed:** All list screens must have the same `screenTitle` (24px / weight 800 / primaryDeep), tonal search bar, no card borders.

**B — Detail/Hero:** All detail screens must use `DetailTemplate`. Budget sections where present must use the dark navy card. All tonal info sections use `colors.muted` not hardcoded `#f4f3f0`.

**C — Form Wizard:** All wizard screens must be inside `FormWizardTemplate`. `stepLabel` must be uppercase 12px. Content area cards must use `colors.muted` bg.

**D — Success:** All success screens must have: animated check/icon, tonal status pill, dark "next steps" card, two-button action area.

**E — Auth:** All auth screens must be inside `AuthTemplate`. Headings 24px. Option cards follow selected/unselected pattern.

**F — Edge:** All edge screens must be centered. Icon shell 72×72. No borders.

**G — Inbox:** All inbox rows must be borderless. Unread rows `#e7f1fb`. Timestamp inline with title.

### 6.4 Global Scan

After archetype-by-archetype check, run one final scan across all modified files:

```bash
# Should return zero results after the pass is complete.
# Note: these target card/section wrappers only — legitimate uses in Input, FormField,
# Modal, Sheet, Divider components are expected and should be ignored.

# Card border remnants (exclude shared UI components that legitimately use borders):
grep -r "borderWidth: 1" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules" | grep -v "Input\|FormField\|Modal\|Sheet\|Divider"

# Hardcoded shadows (exclude the elevations definition file itself):
grep -r "shadowColor.*rgba" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"
grep -r "shadowColor.*rgba" apps/mobile/src/design --include="*.ts" | grep -v "elevations.ts"

# Hardcoded muted color (should use colors.muted token):
grep -r "'#f4f3f0'" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"
grep -r '"#f4f3f0"' apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"
```

- `borderWidth: 1` on card/section wrappers → replace with `elevations.soft` (leave Input/FormField borders alone)
- `shadowColor.*rgba` → replace with `elevations.*` spread
- `'#f4f3f0'` / `"#f4f3f0"` hardcoded → replace with `colors.muted`

---

## 7. Done Criteria

- [ ] `pnpm --filter @tasky/mobile typecheck` passes with zero errors (the pre-existing TS2741 error in `schedule.tsx` line 265 — Property 'label' missing in FormField — is acceptable; it predates this pass)
- [ ] `pnpm --filter @tasky/mobile test` passes (pre-existing test failures acceptable if they predate this pass)
- [ ] All 65 screens in the Phase 1 tables are marked complete
- [ ] The global scan in Section 6.4 returns zero results (excluding legitimate component-level uses)
- [ ] Phase 2 archetype check is complete for all 7 archetypes
- [ ] No test IDs, prop names, or navigation calls were modified

---

## 8. Out of Scope

- Adding new features or interactions
- Changing navigation flows or routing
- Modifying component APIs or exported types
- Updating tests (unless a test breaks due to a style prop change, in which case only fix the breaking assertion)
- Any backend or SDK changes
