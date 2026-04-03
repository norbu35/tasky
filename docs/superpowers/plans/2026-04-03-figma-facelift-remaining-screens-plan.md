# Figma Facelift — Remaining Mobile Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply visual polish to all 65 remaining mobile screens so they align with the Figma designs in file `IljfnTQPkq7vpkmK1NN1NC`, using established archetype patterns and Figma-driven details.

**Architecture:** Two-phase approach — Phase 1 is a sequential Figma-driven pass through 5 domain batches (65 screens). Phase 2 is an archetype consistency pass across all 7 visual archetypes. Each screen edit follows a fixed procedure: fetch Figma context, read file, apply archetype pattern + Figma overrides to StyleSheet and style props only.

**Tech Stack:** React Native (Expo), expo-blur (BlurView), react-native-reanimated, design tokens via `mobileTheme` from `tokenAdapter.ts`, shadow presets via `elevations.ts`. Figma MCP tools for design context.

**Spec:** `docs/superpowers/specs/2026-04-03-figma-facelift-remaining-screens-design.md`

---

## Task 0: Figma Node Discovery

**Files:**
- Read: `docs/design/screen-specs/SCR-CUST-002.yaml` (and all other SCR-*.yaml files as needed)

This is a one-time setup step that builds a mapping of screen names to Figma node IDs. All subsequent tasks reference this mapping.

- [ ] **Step 1: Fetch Figma file metadata**

Call the Figma MCP tool to get all top-level frames:

```
Tool: mcp__claude_ai_Figma__get_metadata
Params: { fileKey: "IljfnTQPkq7vpkmK1NN1NC" }
```

Save the returned frame list. Each frame has a `name` and `nodeId`.

- [ ] **Step 2: Build the node ID lookup**

For each batch in this plan, read the corresponding `docs/design/screen-specs/SCR-*.yaml` files and extract the `figma_page` field. Match each `figma_page` string against the metadata frame names to get the `nodeId`.

If a screen's `figma_page` has no match in metadata, mark it with `[figma-fallback]` — the archetype pattern alone will be used for that screen.

Cache the full mapping for the rest of the session. Do not re-fetch metadata for every screen.

---

## Task 1: Batch 1 — Customer Task Creation Wizard (7 screens)

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/success.tsx`

**Archetype:** C (Form Wizard) for #1–6, D (Success) for #7.

- [ ] **Step 1: Process `category.tsx` (#1)**

1. Fetch Figma: `get_design_context(fileKey: "IljfnTQPkq7vpkmK1NN1NC", nodeId: <from lookup for "Customer/Post Task Category Selection">)`
2. Read `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
3. Apply Archetype C pattern from spec Section 3:
   - `stepLabel`: fontSize `typography.caption`, fontWeight `'700'`, textTransform `'uppercase'`, letterSpacing `0.8`, color `colors.textSecondary`
   - `title`: fontSize `24`, fontWeight `'800'`, color `colors.primaryDeep`
   - Content cards / category grid tiles: backgroundColor `colors.muted`, remove `borderWidth`/`borderColor`, add `elevations.soft` if cards have shadows
   - Selected category: borderWidth `2`, borderColor `colors.primaryDeep`, backgroundColor `colors.card`, `...elevations.soft`
   - Unselected category: backgroundColor `colors.muted`, no border
4. Override with any Figma-specific details (spacing, icon sizes, etc.)
5. Import `elevations` if needed: `import { elevations } from '../../../../design/elevations';`

- [ ] **Step 2: Process `intake.tsx` (#2)**

Same procedure as Step 1 but for intake form:
1. Fetch Figma for `Customer/Post Task Intake Form`
2. Read the file
3. Apply Archetype C: tonal section cards (`colors.muted` bg, no border), 24px/800 title, caption step label
4. Leave `<Input>` component borders untouched — the shared component owns its states
5. Import `elevations` if content cards need `elevations.soft`

- [ ] **Step 3: Process `photos.tsx` (#3)**

1. Fetch Figma for `Customer/Post Task Photos`
2. Read the file
3. Apply Archetype C: tonal add-photo tiles (`colors.muted` bg), grid layout spacing from Figma
4. Photo placeholder tiles: `colors.muted` bg, `radius.md`, no border

- [ ] **Step 4: Process `location.tsx` (#4)**

1. Fetch Figma for `Customer/Post Task Location`
2. Read the file
3. Apply Archetype C: map container in tonal card, address input untouched (shared Input component)

- [ ] **Step 5: Verify `schedule.tsx` (#5)**

This file was already partially improved. Read it and verify:
1. Fetch Figma for `Customer/Post Task Schedule Budget`
2. Read `schedule.tsx`
3. Verify: `dateCard` has `colors.muted` bg + `elevations.soft`, picker fields use `colors.primaryDeep` when active
4. Verify: `budgetSection` heading is `colors.primaryDeep`, hint text is `colors.secondary`
5. Fix any remaining `borderWidth: 1` on content cards or hardcoded `#f4f3f0`

- [ ] **Step 6: Process `review.tsx` (#6)**

1. Fetch Figma for `Customer/Post Task Review Submit`
2. Read the file
3. Apply Archetype C: section review cards with `colors.muted` bg, edit affordances, no borders
4. Submit CTA section: follows `FormWizardTemplate` bottom bar (already handled by template)

- [ ] **Step 7: Verify `success.tsx` (#7)**

This file was already improved. Read and verify against Archetype D:
1. Fetch Figma for `Customer/Post Task Success`
2. Read `success.tsx`
3. Verify: animated check icon (96×96, `${colors.verified}1A` bg), status badge, "next steps" card with `elevations.soft`, two-button action area (primary Button + secondary outlined)
4. Fix any remaining hardcoded colors or shadow values

- [ ] **Step 8: Typecheck**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

Expected: only the pre-existing TS2741 error in `schedule.tsx` line 265. Fix any new errors before continuing.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/tasks/new/
git commit -m "style(mobile): facelift customer task creation wizard screens

Apply Archetype C/D patterns: tonal cards, 24px titles, elevations.soft,
selected/unselected state styling per Figma.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Batch 2 — Customer Task & Booking Flows (12 screens)

**Files:**
- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- Modify: `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`
- Modify: `apps/mobile/src/app/(customer)/rebook.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/reschedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/dispute.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/instant-match.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/escrow.tsx`
- Modify: `apps/mobile/src/app/(customer)/disputes/[disputeId]/index.tsx`

**Archetypes:** A (List) for applicants, B (Detail) for most, C (Form) for reschedule/dispute, D (Success) for confirmed.

- [ ] **Step 1: Process screens #8–14**

For each of these 7 screens, apply the per-screen procedure:

| # | File | Archetype | Key changes |
|---|---|---|---|
| 8 | `tasks/[taskId]/applicants.tsx` | A (List) | 24px/800 title, card `elevations.soft`, no borders, tonal skeleton |
| 9 | `taskers/[taskerId].tsx` | B (Detail) | 24px/700 title `colors.primaryDeep`, tonal info cards, `elevations.soft` profile card |
| 10 | `bookings/[bookingId]/index.tsx` | B (Detail) | Tonal details card, dark navy budget card if present, no borders |
| 11 | `bookings/[bookingId]/timeline.tsx` | B (Detail) | Tonal section cards, timeline dots/lines per Figma |
| 12 | `bookings/confirm.tsx` | B (Detail) | Summary sections `colors.muted` bg, CTA via `DetailTemplate` |
| 13 | `bookings/confirmed.tsx` | D (Success) | Animated icon, status pill, "next steps" card, outlined secondary button |
| 14 | `rebook.tsx` | B (Detail) | Tonal cards, `elevations.soft`, `colors.primaryDeep` heading |

For each: fetch Figma with `get_design_context`, read file, apply archetype + Figma overrides.

- [ ] **Step 2: Typecheck after #14**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

Fix any new errors.

- [ ] **Step 3: Process screens #15–19**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 15 | `bookings/[bookingId]/reschedule.tsx` | C (Form) | `FormWizardTemplate`, tonal date card, picker styling |
| 16 | `bookings/[bookingId]/dispute.tsx` | C (Form) | `FormWizardTemplate`, tonal section cards, leave Input borders |
| 17 | `tasks/[taskId]/instant-match.tsx` | B (Detail) | Tonal cards, dark budget section if present |
| 18 | `bookings/[bookingId]/escrow.tsx` | B (Detail) | Payment info in tonal cards, no borders |
| 19 | `disputes/[disputeId]/index.tsx` | B (Detail) | Dispute status + details in tonal cards |

- [ ] **Step 4: Typecheck after #19**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(customer\)/
git commit -m "style(mobile): facelift customer task & booking flow screens

Apply Archetype A/B/C/D patterns to applicants, booking detail, timeline,
confirm, rebook, reschedule, dispute, instant-match, and escrow screens.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Batch 3 — Tasker Core Screens (20 screens)

**Files:**
- Modify: `apps/mobile/src/app/(tasker)/tasks/[taskId].tsx`
- Modify: `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/stats.tsx`
- Modify: `apps/mobile/src/app/(tasker)/wallet/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/wallet/payout.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/consent.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/upload.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/pending.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/approved.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/rejected.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/submitted.tsx`
- Modify: `apps/mobile/src/app/(tasker)/verification/dan.tsx`
- Modify: `apps/mobile/src/app/(tasker)/subscription.tsx`
- Modify: `apps/mobile/src/app/(tasker)/referrals.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/history.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/pay.tsx`
- Modify: `apps/mobile/src/app/(tasker)/profile/polish.tsx`

- [ ] **Step 1: Process screens #20–27**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 20 | `tasks/[taskId].tsx` | B (Detail) | 24px/700 title, tonal details, dark budget card, location card `${colors.primary}0F` |
| 21 | `jobs/index.tsx` | A (List) | 24px/800 title, card `elevations.soft`, no borders, tonal skeleton |
| 22 | `jobs/[bookingId]/index.tsx` | B (Detail) | Tonal section cards, `elevations.soft` profile card |
| 23 | `stats.tsx` | B (Detail) | Stat cards in tonal bg, earnings in `colors.secondary` |
| 24 | `wallet/index.tsx` | B (Detail) | Balance card dark navy, transaction list tonal rows |
| 25 | `wallet/payout.tsx` | C (Form) | Tonal content card, leave Input borders, picker styling |
| 26 | `verification/index.tsx` | B (Detail) | Verification status cards, tonal sections |
| 27 | `verification/consent.tsx` | E (Auth) | 24px heading, tonal content card, CTA `colors.primaryDeep` bg |

- [ ] **Step 2: Typecheck after #27**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 3: Process screens #28–39**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 28 | `verification/upload.tsx` | C (Form) | Tonal upload area, `colors.muted` bg, no border |
| 29 | `verification/pending.tsx` | D (Success) | Animated icon, status pill, "next steps" card |
| 30 | `verification/approved.tsx` | D (Success) | Same as #29 with `colors.verified` tint |
| 31 | `verification/rejected.tsx` | F (Edge) | Centered icon 72×72 danger tint, retry CTA |
| 32 | `verification/submitted.tsx` | D (Success) | Animated icon, status pill, confirmation card |
| 33 | `verification/dan.tsx` | C (Form) | DAN input form, tonal card, leave Input borders |
| 34 | `subscription.tsx` | B (Detail) | Plan cards tonal bg, active plan highlighted |
| 35 | `referrals.tsx` | B (Detail) | Referral code card dark navy, stats tonal |
| 36 | `credits/index.tsx` | B (Detail) | Credit balance card, tonal transaction rows |
| 37 | `credits/history.tsx` | A (List) | 24px title, no card borders, tonal skeleton |
| 38 | `credits/pay.tsx` | C (Form) | Payment form, tonal content card |
| 39 | `profile/polish.tsx` | C (Form) | Profile edit fields, tonal section cards |

- [ ] **Step 4: Typecheck after #39**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/app/\(tasker\)/
git commit -m "style(mobile): facelift all tasker screens

Apply archetype patterns to jobs, stats, wallet, verification flow,
subscription, referrals, credits, and profile polish screens.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Batch 4 — Shared, Auth, Inbox, Profile (18 screens)

**Files:**
- Modify: `apps/mobile/src/app/(auth)/index.tsx`
- Modify: `apps/mobile/src/app/onboarding.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-camera.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-location.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- Modify: `apps/mobile/src/app/(auth)/otp.tsx`
- Modify: `apps/mobile/src/app/(auth)/otp-migration.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- Modify: `apps/mobile/src/app/(shared)/review/[bookingId].tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/edit.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/settings.tsx`
- Modify: `apps/mobile/src/app/(shared)/profile/delete.tsx`
- Modify: `apps/mobile/src/app/profile/[id].tsx`
- Modify: `apps/mobile/src/app/task/[id].tsx`
- Modify: `apps/mobile/src/app/task/[id]/applicants.tsx`
- Modify: `apps/mobile/src/app/(tabs)/bookings.tsx`
- Modify: `apps/mobile/src/app/(tabs)/tasks.tsx`

- [ ] **Step 1: Process auth screens #40–46**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 40 | `(auth)/index.tsx` | E (Auth) | 24px/800 heading, `elevations.soft` on brandIconCard (not `elevations.card`), CTA `colors.primaryDeep` bg, minHeight 56 |
| 41 | `onboarding.tsx` | E (Auth) | 24px heading, tonal illustration card, CTA styling |
| 42 | `(auth)/permission-camera.tsx` | E (Auth) | Tonal illustration card, single primary CTA |
| 43 | `(auth)/permission-location.tsx` | E (Auth) | Same as #42 |
| 44 | `(auth)/permission-notifications.tsx` | E (Auth) | Same as #42 |
| 45 | `(auth)/otp.tsx` | E (Auth) | 24px heading, OTP input styling, leave Input borders |
| 46 | `(auth)/otp-migration.tsx` | E (Auth) | Same treatment as #45 |

- [ ] **Step 2: Typecheck after auth block**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 3: Process inbox screens #47–48**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 47 | `(tabs)/inbox/index.tsx` | G (Inbox list) | Borderless rows, unread `#e7f1fb` bg, read `colors.background`, timestamp inline, `colors.secondary` unread dot |
| 48 | `(tabs)/inbox/[id].tsx` | G (Chat) | Figma-driven — apply tokens (colors, typography, spacing) but defer layout to Figma result |

- [ ] **Step 4: Typecheck after inbox block**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 5: Process remaining screens #49–57**

| # | File | Archetype | Key changes |
|---|---|---|---|
| 49 | `(shared)/review/[bookingId].tsx` | C (Form) | Star rating area, tonal card, leave Input borders |
| 50 | `(shared)/profile/edit.tsx` | C (Form) | Avatar section, form fields in tonal cards |
| 51 | `(shared)/profile/settings.tsx` | F (Edge) | Settings rows, tonal section cards, `colors.primaryDeep` headings |
| 52 | `(shared)/profile/delete.tsx` | F (Edge) | Centered warning icon, danger tint, CTA stretch |
| 53 | `profile/[id].tsx` | B (Detail) | Public profile — tonal info card, `elevations.soft` |
| 54 | `task/[id].tsx` | B (Detail) | Public task view — read first; apply matching styles to sections that exist (fewer than authenticated view) |
| 55 | `task/[id]/applicants.tsx` | A (List) | Public applicant list — same treatment as #8 |
| 56 | `(tabs)/bookings.tsx` | A (List) | Tab-level bookings list wrapper — 24px title, card styling |
| 57 | `(tabs)/tasks.tsx` | A (List) | Tab-level tasks list wrapper — 24px title, card styling |

- [ ] **Step 6: Typecheck after #57**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/\(auth\)/ apps/mobile/src/app/\(shared\)/ apps/mobile/src/app/\(tabs\)/inbox/ apps/mobile/src/app/\(tabs\)/bookings.tsx apps/mobile/src/app/\(tabs\)/tasks.tsx apps/mobile/src/app/onboarding.tsx apps/mobile/src/app/profile/ apps/mobile/src/app/task/
git commit -m "style(mobile): facelift auth, inbox, shared, and public screens

Apply archetype patterns to login, onboarding, permissions, OTP, inbox,
review, profile edit/settings/delete, and public task/profile views.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Batch 5 — Edge / Utility Screens (8 screens)

**Files:**
- Modify: `apps/mobile/src/app/(shared)/account/banned.tsx`
- Modify: `apps/mobile/src/app/(shared)/account/suspended.tsx`
- Modify: `apps/mobile/src/app/(shared)/app-update.tsx`
- Modify: `apps/mobile/src/app/(shared)/network-error.tsx`
- Modify: `apps/mobile/src/app/(shared)/session-expired.tsx`
- Modify: `apps/mobile/src/app/(shared)/help.tsx`
- Modify: `apps/mobile/src/app/(shared)/legal/terms.tsx`
- Modify: `apps/mobile/src/app/(shared)/legal/privacy.tsx`

**Archetype:** F (Edge) for all. Figma fetch is optional — apply pattern directly.

- [ ] **Step 1: Process all 8 edge screens**

For each screen, read the file and apply Archetype F pattern:

```
Container: flex: 1, backgroundColor: colors.background, centered content
iconShell: width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.muted
  (use `${colors.danger}1A` bg for error states like banned/suspended/network-error)
headline: fontSize: typography.title, fontWeight: '700', color: colors.foreground, textAlign: 'center'
body: fontSize: typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24
CTA button: alignSelf: 'stretch', marginTop: spacing.xl
```

Special cases:
- `help.tsx` (#63): Scroll view with tonal section cards (`colors.muted` bg, `radius.md`, `padding: spacing.lg`), section titles in `colors.primaryDeep`
- `terms.tsx` / `privacy.tsx` (#64–65): Pure scroll — only ensure `paddingHorizontal: spacing.lg`, body text `typography.body`, heading colors `colors.primaryDeep`

Remove any `borderWidth`/`borderColor` on card wrappers. Remove hardcoded shadow values (replace with `elevations.soft` only if the screen actually uses cards).

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/\(shared\)/account/ apps/mobile/src/app/\(shared\)/app-update.tsx apps/mobile/src/app/\(shared\)/network-error.tsx apps/mobile/src/app/\(shared\)/session-expired.tsx apps/mobile/src/app/\(shared\)/help.tsx apps/mobile/src/app/\(shared\)/legal/
git commit -m "style(mobile): facelift edge and utility screens

Apply Archetype F pattern to banned, suspended, app-update, network-error,
session-expired, help, terms, and privacy screens.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Phase 2 — Archetype Consistency Pass

**Files:** All files modified in Tasks 1–5, plus completed screens from Section 4 of the spec.

This task reads representative screens per archetype and patches any cross-screen divergences.

- [ ] **Step 1: Archetype A consistency check (List Feed)**

Read 3 list screens (e.g., `jobs/index.tsx`, `credits/history.tsx`, `tasks/[taskId]/applicants.tsx`).

Verify all have:
- `screenTitle`: fontSize `24`, fontWeight `'800'`, color `colors.primaryDeep`
- No `borderWidth`/`borderColor` on cards
- `elevations.soft` on cards (not hardcoded shadows)
- Tonal search bar if present: `backgroundColor: colors.muted`, `borderWidth: 0`

Patch any divergences.

- [ ] **Step 2: Archetype B consistency check (Detail/Hero)**

Read 3 detail screens (e.g., `bookings/[bookingId]/index.tsx`, `taskers/[taskerId].tsx`, `wallet/index.tsx`).

Verify all have:
- Title: fontSize `24`, fontWeight `'700'`, color `colors.primaryDeep`
- Section cards: `backgroundColor: colors.muted` (not hardcoded `'#f4f3f0'`), no border
- Budget sections (where present): dark navy card (`colors.primaryDeep` bg)
- BlurView bottom bar (inherited from `DetailTemplate`)

Patch any divergences.

- [ ] **Step 3: Archetype C consistency check (Form Wizard)**

Read 3 wizard screens (e.g., `category.tsx`, `location.tsx`, `verification/upload.tsx`).

Verify all have:
- Inside `FormWizardTemplate`
- `stepLabel`: uppercase 12px, letterSpacing 0.8
- Content cards: `colors.muted` bg, no border
- `<Input>` component borders left untouched

Patch any divergences.

- [ ] **Step 4: Archetype D consistency check (Success)**

Read 3 success screens (e.g., `success.tsx`, `confirmed.tsx`, `verification/approved.tsx`).

Verify all have:
- Animated icon (96×96, tonal bg)
- Status pill (`radius.full`)
- "Next steps" card with `elevations.soft`
- Two-button action area (primary + outlined secondary)

Patch any divergences.

- [ ] **Step 5: Archetype E consistency check (Auth)**

Read 3 auth screens (e.g., `(auth)/index.tsx`, `permission-camera.tsx`, `otp.tsx`).

Verify all have:
- Inside `AuthTemplate`
- Heading: 24px, `colors.primaryDeep`
- CTA: `colors.primaryDeep` bg, minHeight 56, `radius.md`

Patch any divergences.

- [ ] **Step 6: Archetype F consistency check (Edge)**

Read 3 edge screens (e.g., `banned.tsx`, `network-error.tsx`, `help.tsx`).

Verify all have:
- Centered layout
- Icon shell: 72×72
- No borders on any wrappers

Patch any divergences.

- [ ] **Step 7: Archetype G consistency check (Inbox)**

Read both inbox screens (`inbox/index.tsx`, `inbox/[id].tsx`).

Verify list has:
- Borderless rows
- Unread: `#e7f1fb` bg
- `colors.secondary` unread dot
- Timestamp inline with title

Patch any divergences.

- [ ] **Step 8: Typecheck**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/app/
git commit -m "style(mobile): archetype consistency pass across all screens

Patch cross-screen divergences found during archetype-by-archetype review.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Global Scan & Final Verification

- [ ] **Step 1: Run global scan for anti-patterns**

```bash
# Card border remnants:
grep -r "borderWidth: 1" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules" | grep -v "Input\|FormField\|Modal\|Sheet\|Divider"

# Hardcoded shadows:
grep -r "shadowColor.*rgba" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"

# Hardcoded muted color:
grep -r "'#f4f3f0'" apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"
grep -r '"#f4f3f0"' apps/mobile/src/app --include="*.tsx" | grep -v "node_modules"
```

Each command should return zero results. For any hits:
- `borderWidth: 1` on card wrappers → remove border, add `...elevations.soft`
- `shadowColor.*rgba` → replace with `...elevations.soft` (or `.card`/`.elevated`)
- `'#f4f3f0'` / `"#f4f3f0"` → replace with `colors.muted`

- [ ] **Step 2: Fix any scan findings**

Apply fixes and re-run the scan to confirm zero results.

- [ ] **Step 3: Full typecheck**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep "error TS"
```

Expected: only the pre-existing TS2741 error in `schedule.tsx` line 265 (Property 'label' missing in FormField).

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @tasky/mobile test 2>&1 | tail -20
```

All tests should pass. If a test fails due to a style prop change from this pass (e.g., snapshot mismatch), update only the failing assertion — do not restructure the test.

- [ ] **Step 5: Commit scan fixes (if any)**

```bash
git add apps/mobile/src/app/
git commit -m "style(mobile): fix global scan findings from facelift pass

Replace remaining hardcoded borders, shadows, and color values with
design system tokens.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 6: Verify done criteria**

Check off each item:
- [ ] `pnpm --filter @tasky/mobile typecheck` passes (only pre-existing TS2741 acceptable)
- [ ] `pnpm --filter @tasky/mobile test` passes (pre-existing failures acceptable)
- [ ] All 65 screens processed
- [ ] Global scan returns zero results
- [ ] Phase 2 archetype check complete for all 7 archetypes
- [ ] No test IDs, prop names, or navigation calls were modified
