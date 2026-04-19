# UI Realignment Strategy Spec

**Purpose.** This document defines the high-level strategy for applying the
Tasky "Тэнгэр" (Sky) design system across `apps/mobile` and `apps/web`. It is
written for the **[planning model** that will produce `PLAN.md` — a concrete,
tranche-by-tranche execution plan — which will then be handed to an
**execution model** that performs the edits.

This document does **not** list files to touch. It defines the rails: what the
source of truth is, what order to attack the codebase in, what must not be
changed, and how each tranche should be shaped so that a weaker model can
execute it without drifting.

---

## 1. Deliverable Chain

| Stage     | Owner         | Artifact                                                  |
| --------- | ------------- | --------------------------------------------------------- |
| Strategy  | strong model  | `STRATEGY.md` (this file)                                 |
| Plan      | mid model     | `PLAN.md` + per-phase tranche files                       |
| Execution | weakest model | Commits on `agent/TASK-UI-*` branches, one PR per tranche |

The plan must be **self-sufficient for the execution model** — it must name
exact files, exact token keys, exact before/after snippets where token names
change, and exact verification commands. The execution model should not need
to read this strategy doc.

---

## 2. Source of Truth

The design system arrived as a `claude.ai/design` HTML/JSX bundle, not a
machine-readable token set. It is staged at:

```
docs/plans/ui-realignment/handoff/
  project/README.md               ← canonical spec (COLORS, TYPE, SPACING, ICONOGRAPHY, CONTENT)
  project/colors_and_type.css     ← CSS custom properties (authoritative values)
  project/ui_kits/mobile/
    index.html                    ← mobile reference UI (screens assembled from primitives)
    components.jsx                ← reference primitive implementations (Button, Input, TaskCard, …)
  project/preview/                ← 13 component preview cards (buttons, cards, inputs, badges, avatars, typography, spacing, shadows, brand)
  project/assets/                 ← logo-icon.svg, facebook-icon.svg, email-icon.svg
```

**Precedence when sources disagree:**

1. `project/README.md` text (voice, casing, iconography rules, content prescriptions).
2. `project/colors_and_type.css` for numeric values (hex, px, ms, cubic-bezier).
3. `project/ui_kits/mobile/components.jsx` + `preview/*.html` for visual composition.
4. Existing `packages/design-tokens/` — retained where it already matches.

The plan **must not** copy HTML/JSX from the handoff verbatim. It is a
prototype medium; production uses Radix+Tailwind (web) and NativeWind (mobile)
per `docs/ARCHITECTURE.md` §7. Match the visual output, not the internal
structure.

---

## 3. Token Reconciliation (the one foundational change)

The existing codebase is already close to the new system — same palette, same
type families. Scope the token delta surgically; do not re-hash values that
are already correct.

**Known gaps the plan must address in Phase 0:**

- `packages/design-tokens/tokens.css` exposes HSL-component variables under
  the `--tasky-color-*` namespace; the handoff CSS publishes hex under
  `--tasky-*` and semantic aliases under `--color-*`. The plan must pick one
  naming scheme and introduce any missing tokens (below) without breaking
  current consumers.
- Missing/under-specified tokens to add:
  - `status-completed`, `status-completed-foreground`, `status-cancelled`,
    `status-cancelled-foreground` (currently only `open`/`assigned` exist)
  - Motion scale (`duration-instant|fast|normal|slow|skeleton`, four easings)
    — not present in `tokens.css` today
  - Shadow tokens (`shadow-card`, `shadow-elevated`, `shadow-fab`, `shadow-nav`,
    `shadow-deep`) — partially defined in `primitives.ts` only
  - ALL-CAPS letter-spacing token (`0.075em`) for StatusBadge microcopy
  - `sun-wash` / `sun-light` gold tints, `sky-soft` tint, `chip-inactive`,
    `nav-inactive` — reconcile names between `primitives.ts` and handoff
  - Typography step `nav: 11px` — missing from `webTokens.typography.scale`
- Dark-theme parity: handoff specifies HSL ranges for dark mode. Existing
  `.dark` block in `tokens.css` is close; reconcile only diverging tokens.
- `@tasky/design-tokens` must remain the **single source of truth**. Neither
  app may hard-code hex values; both Tailwind configs must consume the
  package exports. The plan should enumerate any offending hardcodes and
  include their removal in Phase 0.

**Out of scope for token work:** renaming the package, changing the
primitive→semantic→platform layering in `packages/design-tokens/src/`,
inventing new brand colors.

---

## 4. Scope and Non-Goals

**In scope.**

- Visual realignment of mobile and web surfaces to the handoff spec.
- Token additions and renames confined to `packages/design-tokens` +
  consumers.
- Content casing / microcopy polish per §6 below.
- Replacing raw `TouchableOpacity`, core `SafeAreaView`, ad-hoc hex values,
  and non-Lucide icons with the approved primitives/shells.

**Out of scope. The plan must explicitly forbid these.**

- API or SDK changes, backend edits, migrations (`docs/API.yaml` and
  `services/api/**` are frozen for this effort).
- Test-registry changes; `tests/scenarios/` and `TID-*` names remain
  untouched.
- New features, refactors beyond the facelift, route restructuring,
  navigation graph changes.
- Adding UI frameworks beyond Radix+Tailwind (web) and NativeWind (mobile).
- Security-critical files in `AGENTS.md` → Guard Rails.

---

## 5. Execution Order: Breadth-First, Then Depth

The plan must sequence work from **shared chrome outward to leaves** so that
every later tranche inherits correct token/shell behavior and does not need
to re-solve the same problem per screen.

### Phase 0 — Token & handoff landing (1 tranche)

- Reconcile `packages/design-tokens` (§3) and wire deltas into both Tailwind
  configs (`apps/web/tailwind.config.ts`, `apps/mobile/tailwind.config.ts`)
  and `apps/web/src/styles.css` / mobile theme adapter.
- Verify `apps/web/src/styles.css` pulls the font stack the handoff expects;
  mobile `design/theme.ts` loads matching `@expo-google-fonts/*` faces.
- Gate: `pnpm -r typecheck` + `pnpm -r test` + `pnpm workspace:boundaries`
  pass with no behavioral diff.

### Phase 1 — Shared chrome: shells, layouts, templates (4–6 tranches)

The breadth sweep. Nothing downstream should be touched until these are
aligned, because their tokens/paddings/heights propagate everywhere.

- **Mobile shells:** `apps/mobile/src/components/shells/*`
  (`ScreenContainer`, `InsetScrollView`, `StickyActionBar`).
- **Mobile root layouts:** `app/_layout.tsx`, `app/(tabs)/_layout.tsx`,
  `app/(auth)/_layout.tsx`, `app/(customer)/_layout.tsx`,
  `app/(tasker)/_layout.tsx`, `app/(shared)/_layout.tsx`,
  `app/task/_layout.tsx`, `app/(customer)/tasks/new/_layout.tsx`,
  `app/(tabs)/inbox/_layout.tsx`. Tab bar blur/height, FAB placement, and
  header chrome must come from these and only these.
- **Mobile templates:** `apps/mobile/src/components/templates/*`
  (Auth, Detail, EmptyState, ErrorState, FeedList, FormWizard, ModalSheet,
  Settings, SuccessCelebration). Anchor spacing, typography rhythm, and
  sticky-footer behavior against the handoff preview cards.
- **Web layout:** `apps/web/src/AppShell.tsx`, `layout/Header.tsx`,
  `layout/BottomNavBar.tsx`, `layout/DesktopSidebar.tsx`,
  `layout/ScreenFrame.tsx`, `layout/AdminLayout.tsx`,
  `layout/LoadingCard.tsx`, `layout/LanguageSwitcher.tsx`.

Guardrail: route files under `apps/mobile/src/app/**` and page files under
`apps/web/src/pages/**` are **not** edited in this phase. If a route breaks
because its shell changed, fix the shell — never patch the route.

### Phase 2 — Primitive components (1 tranche per primitive family)

Align the atoms against the handoff's component preview cards and parity
table in `docs/ARCHITECTURE.md` §7.2. Both platforms co-change per primitive
so that parity holds tranche-by-tranche.

Grouping suggestion (planner may refine):

- **Inputs & forms:** `Input`, `FormField`, `SearchBar`, `FilterBar`,
  `LanguageSwitcher`, `Toggle`/switch (web), `Checkbox`, `textarea`.
- **Actions:** `Button`, `Touchable`, `FAB`, `ActionRow`, `TabBarButton`,
  `PressableCard`.
- **Surfaces:** `Card`, `ListItemCard`, `SplitCard`, `StatCard`,
  `alert`, `dialog`, `ModalSheet`, `ActionSheet`, `ConfirmSheet`, `sonner`.
- **Signals:** `StatusBadge`, `VerifiedBadge`, `TrustBanner`, `RatingStars`,
  `HandDrawnCheck`, `PriceTag`, `OfflineBanner`, `SkeletonLoader`, `Reveal`,
  `badge`, `separator`, `tabs`.
- **Identity:** `ProfileAvatar`, `avatar`, `CategoryChip`, `LocationPin`,
  `InfoRow`, `TimelineStepper`, `StepIndicator`, `PhotoGrid`.

For each primitive the plan must spell out: which tokens it consumes
(before → after), which states the handoff requires (default, hover/press,
disabled, loading, invalid), and which tests / parity records need to be
re-read (not rewritten).

### Phase 3 — Domain/feature compositions (per-domain tranches)

Update the molecules in `apps/mobile/src/features/*` and
`apps/web/src/components/feature/*` that compose the Phase 2 primitives —
but only where they still hold their own hex values, spacing math, or shadow
styles. A primitive change should fan out naturally; this phase is for
residual drift.

Domains (one tranche each): `auth`, `verification`, `tasks`, `matching`,
`bookings`, `chat`, `disputes`, `review`, `profile`, `notifications`,
`help`, `credits` (mobile-only, phase-gated).

### Phase 4 — Screen sweep (per-route-group tranches)

Pass through routes in the order users reach them. Each tranche touches one
route group and is small enough for the execution model to commit + typecheck

- screenshot-diff in one sitting.

Suggested order (planner may adjust with evidence):

1. `apps/mobile/src/app/(auth)/*` + `apps/web/src/pages/AuthPage.tsx`,
   `LandingPage.tsx`, `RestrictedAccountPage.tsx`.
2. `apps/mobile/src/app/(tabs)/*` (browse feed, bookings, inbox, profile) +
   the web customer/tasker equivalents: `TaskerFeedPage`, `CustomerDashboardPage`,
   `CustomerTasksListPage`, `TaskerJobsPage`, `InboxPage`, `ProfilePage`.
3. Task creation wizard — `(customer)/tasks/new/*` + `CustomerTaskWizardPage`,
   `CustomerTaskSuccessPage`.
4. Task/booking detail & applicant flows — `(customer)/tasks/[taskId]/*`,
   `(customer)/bookings/**`, `(tasker)/jobs/**`, web counterparts.
5. Verification — `(tasker)/verification/*` + web Verification pages.
6. Shared — `(shared)/**` + web `pages/shared/**`.
7. Admin — `apps/web/src/pages/admin/**`, `AdminLayout.tsx`.

Each tranche must list the exact route files and call out any that should
stay untouched because they already pass Phase 1/2 style audits.

### Phase 5 — Content, voice, iconography polish (2–3 tranches)

After geometry/color are correct, sweep text and icons. Split by concern so
a weak model can focus:

- **Casing & microcopy:** sentence-case everywhere except `StatusBadge`
  (ALL-CAPS Cyrillic with `0.075em` tracking). Price format `₮120,000`.
  No emoji.
- **Iconography:** replace non-Lucide icons; standardize sizes (16/18/20/24);
  `ShieldCheck` filled when verified, `Shield` stroke when pending; stars
  fill with `sun` gold when active.
- **Translations:** no string additions/removals — only touch `locales/*.json`
  where casing/tracking rules mechanically alter rendered strings.

---

## 6. Content & Voice Rules the Plan Must Carry Verbatim

From `handoff/project/README.md` → **CONTENT FUNDAMENTALS**. These are
non-negotiable and the plan must quote them into every Phase 4/5 tranche so
the executor does not have to re-derive them:

- Sentence-case universally; ALL-CAPS reserved for `StatusBadge` microcopy
  with +0.6–1.2px tracking (use the `letter-spacing-caps = 0.075em` token).
- Flush-left alignment always (never justified — uneven gaps in Mongolian).
- Body text floor: 16px. Never smaller for Mongolian copy.
- No emoji. The only gestural mark is the hand-drawn checkmark
  (`HandDrawnCheck`, sage emerald `#469178`, stroke only, max one per viewport).
- Prices: `₮` prefix, comma-separated, e.g. `₮120,000`.
- Tone samples (verification, booking, dispute, empty state, payment held)
  — use as reference when a string is ambiguous.

---

## 7. Guardrails (must appear at the top of every tranche in `PLAN.md`)

- **Web UI kit:** Radix + Tailwind only. No MUI/Chakra/Ant. No shadcn CLI.
- **Mobile UI kit:** NativeWind utility classes backed by
  `@tasky/design-tokens` native outputs. `StyleSheet.create` and inline
  object styles are exceptions for Reanimated, platform shadow/elevation
  helpers, safe-area math, and third-party APIs that require object styles.
- **Forbidden on mobile:** core `SafeAreaView` (use `ScreenContainer`),
  raw `TextInput` outside wrappers, `TouchableOpacity` where a shared
  pressable exists, ad-hoc token lookups outside `@tasky/design-tokens`.
- **Never touch:** `SecurityConfig.java`,
  `JwtAuthenticationFilter.java`, other files listed in
  `AGENTS.md` → Security Compliance; any `tests/scenarios/*`;
  `docs/API.yaml`; migrations under `services/api/**/db/migration/`.
- **Token layering:** edits to `packages/design-tokens/src/primitives.ts`
  propagate through `semantic.ts` → `platform/*`. Never shortcut by editing
  `platform/*` directly.
- **Parity contract (`docs/ARCHITECTURE.md` §7.2):** every shared primitive
  must keep web/mobile parity states (Button, Input, FormField, Modal/Sheet,
  Toast). Mismatched states between platforms fail the tranche.

---

## 8. Per-Tranche Rubric the Plan Must Use

Every tranche in `PLAN.md` must contain:

1. **Scope** — exact file list (absolute repo paths), no globs.
2. **Inputs** — handoff files / token keys to read; previous tranche
   prerequisites.
3. **Token/class mapping** — before → after, concrete. Example:
   `bg-[#1B3A5C]` → `bg-primary`; `--tasky-color-verified` → `--color-verified`.
4. **Visual acceptance** — which handoff preview card or UI-kit screen is
   the reference for this tranche.
5. **Non-goals** — explicit list of things the executor must not change in
   this tranche (logic, props API, tests, copy unless Phase 5).
6. **Verification** — minimum:
   - `pnpm -r typecheck`
   - Workspace-scoped tests (`pnpm --filter @tasky/<workspace> test`)
   - `pnpm workspace:boundaries` for token-package edits
   - `./gradlew openApiValidate` only if the SDK is touched (it should not be)
7. **Commit shape** — one commit per tranche, branch `agent/TASK-UI-<phase>-<slug>`,
   `CHANGELOG.md` entry appended before PR.
8. **Rollback signal** — what to do if the tranche fails verification (the
   executor is not permitted to expand scope to fix regressions — it must
   stop and escalate).

---

## 9. Sizing and Tranche Budget

Rough budget the planner should size against. Deviations should be
justified inline.

| Phase | Tranches | Files / tranche | Notes                                  |
| ----- | -------- | --------------- | -------------------------------------- |
| 0     | 1        | 4–8             | Tokens + Tailwind configs              |
| 1     | 4–6      | 3–8             | Shells, layouts, templates, both sides |
| 2     | 5        | 6–12            | Primitive families; web+mobile paired  |
| 3     | ≈12      | 3–10            | One per feature domain                 |
| 4     | 7        | 5–15            | One per route group                    |
| 5     | 2–3      | wide, shallow   | Casing, icons, price format            |

Total target: **~30 tranches, ~30 PRs**. A tranche that grows past ~15 files
or requires touching two phases' concerns must be split.

---

## 10. What the Planning Model Should Produce

`docs/plans/ui-realignment/PLAN.md` containing:

- Phase 0 through 5 as above, filled in with exact tranche definitions per
  §8 (Per-Tranche Rubric).
- A **token mapping table** at the front: full before→after for every
  token/class name change, derived by diffing
  `packages/design-tokens/tokens.css` ↔ `handoff/project/colors_and_type.css`
  and comparing `webTokens` / `nativeTokens` exports to the handoff spec.
- A **primitive parity matrix** (web file ↔ mobile file ↔ required states
  ↔ handoff preview card reference) extending `docs/ARCHITECTURE.md` §7.2.
- A **route inventory** (all 75 mobile routes, all ~40 web pages) tagged
  with its Phase 4 tranche.
- No implementation code. The plan describes changes; the executor writes
  them.

Open questions the planner should surface (do not assume answers):

- Does the team want the handoff bundle committed (fonts ≈ a few MB of TTF)
  or referenced from an external location?
- Should web adopt the handoff's `--tasky-*` hex naming or keep the current
  `--tasky-color-*` HSL-component naming? Either is defensible; the decision
  cascades through every primitive.
- Is dark mode in-scope for this pass, or deferred (dark tokens exist but
  no theme toggle ships today)?
- Does the admin UI (`apps/web/src/pages/admin/**`) need to match the
  consumer visual language, or remain utilitarian?
