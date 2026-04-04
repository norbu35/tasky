# Mobile NativeWind Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mobile app's mixed `StyleSheet`-driven styling architecture with a coherent NativeWind-first system backed by one canonical token contract, navigator-owned shells, and enforceable UI boundaries so the design system can be restyled by swapping tokens rather than rewriting screens.

**Architecture:** Keep the migration dependency-ordered: codify the architecture contract first, then collapse `@tasky/design-tokens` into one layered export surface, then bind web/mobile to that contract, then install NativeWind in `apps/mobile`, then move shell ownership into Expo Router layouts and shared templates, then migrate screens by archetype. Use a temporary compatibility bridge only where NativeWind cannot replace object styles yet. Do not run new parity implementation work during the refactor; parity becomes a validation pass at the end.

**Tech Stack:** Expo Router, React Native 0.76, Expo 52, NativeWind (latest stable non-preview major at execution time), Tailwind CSS, TypeScript, Jest, Vitest, `@tasky/design-tokens`, `@tasky/sdk`

**Execution Notes:**
- Use `@using-git-worktrees` before Task 1 and execute this plan in a dedicated worktree.
- Use `@requesting-code-review` after Tasks 5, 8, and 12.
- Use `@verification-before-completion` before Task 13.

---

### Task 1: Create the isolated worktree and capture a clean baseline

**Files:**
- Check: `.gitignore`
- Check: `package.json`
- Check: `apps/mobile/package.json`
- Check: `apps/mobile/jest.config.js`
- Check: `apps/web/package.json`

**Step 1: Verify the project-local worktree directory is ignored**

Run:

```bash
git check-ignore -v .worktrees/antigravity
```

Expected: output points at `.gitignore` with the `.worktrees/` rule.

**Step 2: Create the execution worktree**

Run:

```bash
git worktree add .worktrees/TASK-000-mobile-nativewind-foundation -b agent/TASK-000-mobile-nativewind-foundation
```

Expected: new worktree is created under `.worktrees/TASK-000-mobile-nativewind-foundation`.

**Step 3: Install workspace dependencies in the worktree**

Run:

```bash
cd .worktrees/TASK-000-mobile-nativewind-foundation
pnpm install
```

Expected: install completes without lockfile drift.

**Step 4: Record the baseline before changing architecture**

Run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/design/tokens.test.ts apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx
pnpm --filter @tasky/web test -- --runInBand apps/web/tests/unit/token-binding.test.tsx
```

Expected: either all commands pass, or any pre-existing failures are written down before implementation begins.

---

### Task 2: Codify the target architecture and supersede the parity-first sequence

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/plans/2026-04-03-figma-full-mobile-parity.md`
- Modify: `docs/plans/2026-04-04-mobile-nativewind-foundation-plan.md`

**Step 1: Update the architecture docs to match the actual target stack**

- Replace the stale mobile stack wording so it names Expo Router ownership, NativeWind-first styling, token layering, and shell ownership boundaries.
- Keep parity explicitly out of the implementation path until the new foundation lands.

**Step 2: Verify the docs say exactly what the implementation will enforce**

Run:

```bash
rg -n "Expo Router|NativeWind|token|shell|SafeAreaView|TextInput|TouchableOpacity|parity" docs/ARCHITECTURE.md docs/plans/2026-04-03-figma-full-mobile-parity.md docs/plans/2026-04-04-mobile-nativewind-foundation-plan.md
```

Expected: the target docs mention the new ownership model and the older parity-first plan is clearly marked superseded.

**Step 3: Commit the contract update**

Run:

```bash
git add docs/ARCHITECTURE.md docs/plans/2026-04-03-figma-full-mobile-parity.md docs/plans/2026-04-04-mobile-nativewind-foundation-plan.md
git commit -m "docs(mobile): codify nativewind foundation contract"
```

Expected: one docs-only commit defining the execution contract.

---

### Task 3: Replace the token package with one layered contract

**Files:**
- Create: `packages/design-tokens/src/primitives.ts`
- Create: `packages/design-tokens/src/semantic.ts`
- Create: `packages/design-tokens/src/platform/native.ts`
- Create: `packages/design-tokens/src/platform/web.ts`
- Modify: `packages/design-tokens/src/index.ts`
- Modify: `packages/design-tokens/src/motion.ts`
- Modify: `packages/design-tokens/package.json`
- Modify: `packages/design-tokens/README.md`
- Modify: `packages/design-tokens/tokens.css`
- Replace: `packages/design-tokens/src/colors.ts`
- Replace: `packages/design-tokens/src/layout.ts`
- Replace: `packages/design-tokens/src/tokens.ts`
- Replace: `packages/design-tokens/tokens.ts`
- Test: `apps/mobile/__tests__/design/tokens.test.ts`
- Test: `apps/web/tests/unit/token-binding.test.tsx`

**Step 1: Write the failing boundary tests first**

- Update `apps/mobile/__tests__/design/tokens.test.ts` so it expects mobile to import semantic/native token outputs instead of reaching into `designTokens.colors.primary.hex`.
- Update `apps/web/tests/unit/token-binding.test.tsx` so it expects web token bindings to be derived from the canonical semantic/web outputs.

**Step 2: Run the targeted tests to verify they fail on the old contract**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/design/tokens.test.ts
pnpm --filter @tasky/web test -- --runInBand apps/web/tests/unit/token-binding.test.tsx
```

Expected: failures point at the old split token shape.

**Step 3: Implement the layered token contract**

- `primitives.ts` owns raw palette values, spacing scale, radii, typography metrics, and motion values.
- `semantic.ts` maps product meaning to primitives.
- `platform/native.ts` exports the NativeWind/mobile-friendly token output.
- `platform/web.ts` exports CSS-variable/Tailwind-friendly values.
- `index.ts` re-exports the canonical public API and removes the current split-brain surface.

**Step 4: Verify the package and boundary tests**

Run:

```bash
pnpm --filter @tasky/design-tokens build
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/design/tokens.test.ts
pnpm --filter @tasky/web test -- --runInBand apps/web/tests/unit/token-binding.test.tsx
pnpm -r typecheck
```

Expected: token package builds, both boundary tests pass, and no consumer type drift remains.

**Step 5: Commit the token contract**

Run:

```bash
git add packages/design-tokens apps/mobile/__tests__/design/tokens.test.ts apps/web/tests/unit/token-binding.test.tsx
git commit -m "feat(tokens): unify mobile and web token contract"
```

Expected: one commit that makes `@tasky/design-tokens` the only source of truth.

---

### Task 4: Rebind web and mobile consumers to the canonical token outputs

**Files:**
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/mobile/src/design/tokenAdapter.ts`
- Modify: `apps/mobile/src/design/elevations.ts`
- Modify: `apps/mobile/src/design/animations.ts`
- Test: `apps/mobile/__tests__/design/tokens.test.ts`
- Test: `apps/web/tests/unit/token-binding.test.tsx`

**Step 1: Update the failing tests to assert the new consumer shape**

- Web should derive its CSS variables and Tailwind bridge from the new web platform output.
- Mobile should read from the native platform output and stop depending on old `designTokens.*.hex` access patterns.

**Step 2: Replace the old bindings with the canonical platform outputs**

- Keep `tokenAdapter.ts` only as a narrow bridge during migration.
- Make `elevations.ts` and `animations.ts` consume the canonical token and motion outputs directly.

**Step 3: Run the consumer verification**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/design/tokens.test.ts
pnpm --filter @tasky/web test -- --runInBand apps/web/tests/unit/token-binding.test.tsx
pnpm -r typecheck
```

Expected: web and mobile both compile against the same token meaning.

**Step 4: Commit the bindings**

Run:

```bash
git add apps/web/src/styles.css apps/web/tailwind.config.ts apps/mobile/src/design/tokenAdapter.ts apps/mobile/src/design/elevations.ts apps/mobile/src/design/animations.ts apps/mobile/__tests__/design/tokens.test.ts apps/web/tests/unit/token-binding.test.tsx
git commit -m "refactor(ui): rebind web and mobile to canonical tokens"
```

Expected: one commit that removes consumer drift without yet changing screen architecture.

---

### Task 5: Install NativeWind in the mobile app and wire typography

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/babel.config.js`
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/tsconfig.json`
- Modify: `apps/mobile/src/app/_layout.tsx`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/postcss.config.mjs`
- Create: `apps/mobile/tailwind.config.ts`
- Create: `apps/mobile/global.css`
- Create: `apps/mobile/nativewind-env.d.ts`
- Create: `apps/mobile/assets/fonts/Manrope-SemiBold.otf`
- Create: `apps/mobile/assets/fonts/Manrope-Bold.otf`
- Create: `apps/mobile/assets/fonts/PlusJakartaSans-Regular.otf`
- Create: `apps/mobile/assets/fonts/PlusJakartaSans-Medium.otf`
- Create: `apps/mobile/assets/fonts/PlusJakartaSans-SemiBold.otf`
- Create: `apps/mobile/assets/fonts/PlusJakartaSans-Bold.otf`
- Test: `apps/mobile/__tests__/design/nativewind-config.test.ts`
- Test: `apps/mobile/__tests__/screens/auth/SplashScreen.test.tsx`

**Step 1: Write the failing configuration test**

- Create `apps/mobile/__tests__/design/nativewind-config.test.ts` that reads the NativeWind config files and root layout import.
- Assert that the mobile app imports its CSS entry at the app root and includes typed NativeWind declarations.

**Step 2: Pin the NativeWind installation path to the latest stable non-preview major**

- Verify the official NativeWind docs at execution time and do **not** adopt the v5 pre-release path while it is still marked pre-release.
- Install the stable NativeWind package and the required peer dependencies in `apps/mobile/package.json`.

**Step 3: Add the app-level config files**

- Create the Tailwind/PostCSS/CSS/Metro/TS env files required by the chosen stable NativeWind setup.
- Keep `react-native-reanimated/plugin` last in `babel.config.js` if the stable NativeWind major still requires Babel integration alongside Reanimated.
- Import the CSS entry from `apps/mobile/src/app/_layout.tsx`.

**Step 4: Wire the planned font families into Expo**

- Add the static font files listed above to `apps/mobile/assets/fonts/`.
- Configure `expo-font` in `apps/mobile/app.json` so the token typography contract maps to real mobile font names instead of optimistic string literals.

**Step 5: Verify the foundation**

Run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/design/nativewind-config.test.ts apps/mobile/__tests__/screens/auth/SplashScreen.test.tsx
```

Expected: NativeWind config is present, typed, and the app still boots at the root layout level.

**Step 6: Commit the platform foundation**

Run:

```bash
git add apps/mobile/package.json apps/mobile/babel.config.js apps/mobile/app.json apps/mobile/tsconfig.json apps/mobile/src/app/_layout.tsx apps/mobile/metro.config.js apps/mobile/postcss.config.mjs apps/mobile/tailwind.config.ts apps/mobile/global.css apps/mobile/nativewind-env.d.ts apps/mobile/assets/fonts apps/mobile/__tests__/design/nativewind-config.test.ts apps/mobile/__tests__/screens/auth/SplashScreen.test.tsx
git commit -m "feat(mobile): install nativewind foundation"
```

Expected: one commit that adds the stable NativeWind runtime/config surface.

---

### Task 6: Move shell ownership into Expo Router layouts and shared shell components

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`
- Modify: `apps/mobile/src/app/(auth)/_layout.tsx`
- Modify: `apps/mobile/src/app/(customer)/_layout.tsx`
- Modify: `apps/mobile/src/app/(shared)/_layout.tsx`
- Modify: `apps/mobile/src/app/(tabs)/_layout.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/_layout.tsx`
- Modify: `apps/mobile/src/app/(tasker)/_layout.tsx`
- Modify: `apps/mobile/src/app/task/_layout.tsx`
- Modify: `apps/mobile/src/design/navigationOptions.ts`
- Modify: `apps/mobile/src/components/ui/FAB.tsx`
- Create: `apps/mobile/src/components/shells/ScreenContainer.tsx`
- Create: `apps/mobile/src/components/shells/InsetScrollView.tsx`
- Create: `apps/mobile/src/components/shells/StickyActionBar.tsx`
- Create: `apps/mobile/src/components/shells/index.ts`
- Test: `apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx`

**Step 1: Write the failing shell-ownership tests**

- Assert that representative screens get tab bars/FABs/headers/safe areas from layouts or shell components, not local screen-owned chrome.
- Extend `DetailTemplate.test.tsx` or add a focused shell test file if needed.

**Step 2: Implement the shared shell layer**

- `ScreenContainer.tsx` should own safe-area policy.
- `InsetScrollView.tsx` should own scroll + inset handling.
- `StickyActionBar.tsx` should own sticky CTA spacing without hard-coded device padding.

**Step 3: Move navigation chrome ownership into layouts**

- Keep Expo Router layouts responsible for tabs, modal presentation, default headers, and FAB ownership.
- Remove duplicated shell behavior from route-level code as the foundation lands.

**Step 4: Verify the shell contract**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: representative tasker/customer shells pass without hard-coded inset regressions.

**Step 5: Commit the shell migration**

Run:

```bash
git add apps/mobile/src/app/_layout.tsx apps/mobile/src/app/(auth)/_layout.tsx apps/mobile/src/app/(customer)/_layout.tsx apps/mobile/src/app/(shared)/_layout.tsx apps/mobile/src/app/(tabs)/_layout.tsx apps/mobile/src/app/(tabs)/inbox/_layout.tsx apps/mobile/src/app/(tasker)/_layout.tsx apps/mobile/src/app/task/_layout.tsx apps/mobile/src/design/navigationOptions.ts apps/mobile/src/components/ui/FAB.tsx apps/mobile/src/components/shells apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx
git commit -m "refactor(mobile): move shell ownership into router layouts"
```

Expected: one commit that makes navigation chrome ownership explicit.

---

### Task 7: Rebuild the form and action primitives on the new foundation

**Files:**
- Modify: `apps/mobile/src/components/ui/Button.tsx`
- Modify: `apps/mobile/src/components/ui/Input.tsx`
- Modify: `apps/mobile/src/components/ui/FormField.tsx`
- Modify: `apps/mobile/src/components/ui/Card.tsx`
- Modify: `apps/mobile/src/components/ui/PressableCard.tsx`
- Modify: `apps/mobile/src/components/ui/LanguageSwitcher.tsx`
- Modify: `apps/mobile/src/components/ui/LoginRequiredCTA.tsx`
- Modify: `apps/mobile/src/components/ui/PermissionPrimer.tsx`
- Modify: `apps/mobile/src/components/ui/index.ts`
- Test: `apps/mobile/__tests__/components/ui/KeyComponents.test.tsx`
- Create: `apps/mobile/__tests__/components/ui/Input.test.tsx`
- Create: `apps/mobile/__tests__/components/ui/Button.test.tsx`

**Step 1: Write the failing primitive-state tests**

- Cover pressed, disabled, loading, invalid, and read-only states in the new `Input` and `Button` tests.
- Update `KeyComponents.test.tsx` so it verifies the shared primitives expose NativeWind-compatible `className` or wrapped styling surfaces instead of bespoke style-only APIs.

**Step 2: Implement the primitive migration**

- Use NativeWind classes for layout, spacing, color, border, radius, and typography.
- Keep `StyleSheet.create` only where object styles are still required for animation or platform-specific behavior.
- Replace residual `TouchableOpacity` usage in shared primitives with `Pressable` or wrapped components.

**Step 3: Verify the primitives**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/components/ui/Button.test.tsx apps/mobile/__tests__/components/ui/Input.test.tsx apps/mobile/__tests__/components/ui/KeyComponents.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: shared interaction primitives are consistent and typed.

**Step 4: Commit the primitive migration**

Run:

```bash
git add apps/mobile/src/components/ui/Button.tsx apps/mobile/src/components/ui/Input.tsx apps/mobile/src/components/ui/FormField.tsx apps/mobile/src/components/ui/Card.tsx apps/mobile/src/components/ui/PressableCard.tsx apps/mobile/src/components/ui/LanguageSwitcher.tsx apps/mobile/src/components/ui/LoginRequiredCTA.tsx apps/mobile/src/components/ui/PermissionPrimer.tsx apps/mobile/src/components/ui/index.ts apps/mobile/__tests__/components/ui/Button.test.tsx apps/mobile/__tests__/components/ui/Input.test.tsx apps/mobile/__tests__/components/ui/KeyComponents.test.tsx
git commit -m "refactor(mobile): migrate form and action primitives"
```

Expected: one commit that makes the shared primitive layer NativeWind-first.

---

### Task 8: Rebuild the shared templates and sheet surfaces

**Files:**
- Modify: `apps/mobile/src/components/templates/AuthTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/DetailTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/EmptyStateTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/ErrorStateTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/FeedListTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/FormWizardTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/ModalSheetTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/SettingsTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/SuccessCelebrationTemplate.tsx`
- Modify: `apps/mobile/src/components/templates/index.ts`
- Modify: `apps/mobile/src/components/ui/ModalSheet.tsx`
- Modify: `apps/mobile/src/components/ui/ActionSheet.tsx`
- Modify: `apps/mobile/src/components/ui/ConfirmSheet.tsx`
- Test: `apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx`
- Test: `apps/mobile/__tests__/components/templates/FeedListTemplate.test.tsx`
- Test: `apps/mobile/__tests__/components/templates/SuccessCelebrationTemplate.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/bookings/ConfirmCompletionSheet.test.tsx`

**Step 1: Write the failing template tests**

- Extend the existing template tests so they fail on hard-coded bottom padding, local safe-area ownership, and missing sticky action handling.
- Use the confirm-completion screen test to cover sheet CTA behavior.

**Step 2: Implement the template migration**

- Compose templates from the new shell and primitive layers.
- Keep blur and bottom-sheet object styles only where third-party APIs require them.
- Remove device-specific hard-coded padding values from templates.

**Step 3: Verify the template layer**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx apps/mobile/__tests__/components/templates/FeedListTemplate.test.tsx apps/mobile/__tests__/components/templates/SuccessCelebrationTemplate.test.tsx apps/mobile/__tests__/screens/customer/bookings/ConfirmCompletionSheet.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: list/detail/wizard/sheet templates are stable on the new foundation.

**Step 4: Commit the template migration**

Run:

```bash
git add apps/mobile/src/components/templates apps/mobile/src/components/ui/ModalSheet.tsx apps/mobile/src/components/ui/ActionSheet.tsx apps/mobile/src/components/ui/ConfirmSheet.tsx apps/mobile/__tests__/components/templates/DetailTemplate.test.tsx apps/mobile/__tests__/components/templates/FeedListTemplate.test.tsx apps/mobile/__tests__/components/templates/SuccessCelebrationTemplate.test.tsx apps/mobile/__tests__/screens/customer/bookings/ConfirmCompletionSheet.test.tsx
git commit -m "refactor(mobile): migrate shared templates and sheets"
```

Expected: one commit that gives screens a consistent shell/template path.

---

### Task 9: Migrate auth, onboarding, and wizard-style flows

**Files:**
- Modify: `apps/mobile/src/app/index.tsx`
- Modify: `apps/mobile/src/app/onboarding.tsx`
- Modify: `apps/mobile/src/app/(auth)/index.tsx`
- Modify: `apps/mobile/src/app/(auth)/otp.tsx`
- Modify: `apps/mobile/src/app/(auth)/otp-migration.tsx`
- Modify: `apps/mobile/src/app/(auth)/role-select.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-camera.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-location.tsx`
- Modify: `apps/mobile/src/app/(auth)/permission-notifications.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/category.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/intake.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/photos.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/location.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/schedule.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/success.tsx`
- Test: `apps/mobile/__tests__/screens/auth/LoginScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/auth/OtpScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/auth/OnboardingScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/ScheduleBudgetScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/TaskPostedSuccessScreen.test.tsx`

**Step 1: Write or extend failing screen tests for shell and primitive composition**

- Assert these screens use the new template/shell path rather than local shell reinvention.
- Cover at least one auth screen and one task-posting step per migrated shell pattern.

**Step 2: Implement the auth/wizard migration**

- Replace bespoke `StyleSheet` layout code with NativeWind + shared shells.
- Remove local safe-area and CTA ownership where the shared shell now owns it.

**Step 3: Verify the migrated flows**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/screens/auth/LoginScreen.test.tsx apps/mobile/__tests__/screens/auth/OtpScreen.test.tsx apps/mobile/__tests__/screens/auth/OnboardingScreen.test.tsx apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx apps/mobile/__tests__/screens/customer/ScheduleBudgetScreen.test.tsx apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx apps/mobile/__tests__/screens/customer/TaskPostedSuccessScreen.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: the auth and wizard route family composes only from approved shells and primitives.

**Step 4: Commit the migration**

Run:

```bash
git add apps/mobile/src/app/index.tsx apps/mobile/src/app/onboarding.tsx apps/mobile/src/app/(auth) apps/mobile/src/app/(customer)/tasks/new apps/mobile/__tests__/screens/auth/LoginScreen.test.tsx apps/mobile/__tests__/screens/auth/OtpScreen.test.tsx apps/mobile/__tests__/screens/auth/OnboardingScreen.test.tsx apps/mobile/__tests__/screens/customer/CategorySelectionScreen.test.tsx apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx apps/mobile/__tests__/screens/customer/PhotoUploadScreen.test.tsx apps/mobile/__tests__/screens/customer/LocationScreen.test.tsx apps/mobile/__tests__/screens/customer/ScheduleBudgetScreen.test.tsx apps/mobile/__tests__/screens/customer/ReviewSubmitScreen.test.tsx apps/mobile/__tests__/screens/customer/TaskPostedSuccessScreen.test.tsx
git commit -m "refactor(mobile): migrate auth and wizard flows"
```

Expected: one commit covering the auth/onboarding/post-task archetype.

---

### Task 10: Migrate list and detail route families

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/profile.tsx`
- Modify: `apps/mobile/src/app/(tabs)/bookings.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx`
- Modify: `apps/mobile/src/app/(customer)/taskers/[taskerId].tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirm.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/confirmed.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx`
- Modify: `apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx`
- Modify: `apps/mobile/src/app/(tasker)/jobs/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/stats.tsx`
- Modify: `apps/mobile/src/app/(tasker)/referrals.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/index.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/history.tsx`
- Modify: `apps/mobile/src/app/(tasker)/credits/pay.tsx`
- Modify: `apps/mobile/src/app/(tasker)/profile/polish.tsx`
- Modify: `apps/mobile/src/features/tasks/components/TaskFeed.tsx`
- Modify: `apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx`
- Test: `apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/TaskDetailCustomerScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/ApplicantsListScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/bookings/BookingDetailScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/bookings/BookingTimelineScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/jobs/MyJobsScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/jobs/BookingDetailTasker.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/ReferralsScreen.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/ProfilePolishScreen.test.tsx`

**Step 1: Extend the screen tests so they fail on local shell duplication**

- Cover customer list/detail and tasker list/detail representatives.
- Assert the screens no longer own bottom nav, FAB, or hard-coded safe-area padding locally.

**Step 2: Implement the list/detail migration**

- Prefer shared templates and NativeWind-driven composition.
- Remove the duplicated `CustomerBottomNav`/screen-owned FAB patterns from route files.
- Use object styles only for the remaining animated or third-party edge cases.

**Step 3: Verify the migrated route families**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx apps/mobile/__tests__/screens/customer/TaskDetailCustomerScreen.test.tsx apps/mobile/__tests__/screens/customer/ApplicantsListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingDetailScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingTimelineScreen.test.tsx apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx apps/mobile/__tests__/screens/tasker/jobs/MyJobsScreen.test.tsx apps/mobile/__tests__/screens/tasker/jobs/BookingDetailTasker.test.tsx apps/mobile/__tests__/screens/tasker/ReferralsScreen.test.tsx apps/mobile/__tests__/screens/tasker/ProfilePolishScreen.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: list/detail screens render on the shared foundation with no local shell ownership leaks.

**Step 4: Commit the migration**

Run:

```bash
git add apps/mobile/src/app/(tabs)/index.tsx apps/mobile/src/app/(tabs)/profile.tsx apps/mobile/src/app/(tabs)/bookings.tsx apps/mobile/src/app/(customer)/tasks/index.tsx apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx apps/mobile/src/app/(customer)/tasks/[taskId]/applicants.tsx apps/mobile/src/app/(customer)/taskers/[taskerId].tsx apps/mobile/src/app/(customer)/bookings/index.tsx apps/mobile/src/app/(customer)/bookings/confirm.tsx apps/mobile/src/app/(customer)/bookings/confirmed.tsx apps/mobile/src/app/(customer)/bookings/[bookingId]/index.tsx apps/mobile/src/app/(customer)/bookings/[bookingId]/timeline.tsx apps/mobile/src/app/(tasker)/jobs/index.tsx apps/mobile/src/app/(tasker)/jobs/[bookingId]/index.tsx apps/mobile/src/app/(tasker)/stats.tsx apps/mobile/src/app/(tasker)/referrals.tsx apps/mobile/src/app/(tasker)/credits/index.tsx apps/mobile/src/app/(tasker)/credits/history.tsx apps/mobile/src/app/(tasker)/credits/pay.tsx apps/mobile/src/app/(tasker)/profile/polish.tsx apps/mobile/src/features/tasks/components/TaskFeed.tsx apps/mobile/src/features/profile/components/TaskerPublicProfile.tsx apps/mobile/__tests__/screens/customer/MyTasksListScreen.test.tsx apps/mobile/__tests__/screens/customer/TaskDetailCustomerScreen.test.tsx apps/mobile/__tests__/screens/customer/ApplicantsListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingsListScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingDetailScreen.test.tsx apps/mobile/__tests__/screens/customer/bookings/BookingTimelineScreen.test.tsx apps/mobile/__tests__/screens/tasker/TaskFeedScreen.test.tsx apps/mobile/__tests__/screens/tasker/jobs/MyJobsScreen.test.tsx apps/mobile/__tests__/screens/tasker/jobs/BookingDetailTasker.test.tsx apps/mobile/__tests__/screens/tasker/ReferralsScreen.test.tsx apps/mobile/__tests__/screens/tasker/ProfilePolishScreen.test.tsx
git commit -m "refactor(mobile): migrate list and detail screens"
```

Expected: one commit covering the most duplicated route families.

---

### Task 11: Migrate messaging and modal/sheet-heavy flows

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/inbox/index.tsx`
- Modify: `apps/mobile/src/app/(tabs)/inbox/[id].tsx`
- Modify: `apps/mobile/src/features/chat/components/InboxScreen.tsx`
- Modify: `apps/mobile/src/features/chat/components/ChatDetailScreen.tsx`
- Modify: `apps/mobile/src/features/bookings/components/CustomerCancelSheet.tsx`
- Modify: `apps/mobile/src/features/bookings/components/CustomerNoShowSheet.tsx`
- Modify: `apps/mobile/src/features/bookings/components/TaskerCancelSheet.tsx`
- Modify: `apps/mobile/src/features/bookings/components/TaskerNoShowSheet.tsx`
- Modify: `apps/mobile/src/features/bookings/components/LeadUnlockSheet.tsx`
- Modify: `apps/mobile/src/features/tasks/components/TaskCancelSheet.tsx`
- Modify: `apps/mobile/src/features/tasks/components/NoApplicantRescue.tsx`
- Test: `apps/mobile/__tests__/screens/shared/ConversationList.test.tsx`
- Test: `apps/mobile/__tests__/screens/shared/ChatDetail.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/tasker/jobs/LeadUnlockSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/TaskCancelSheet.test.tsx`
- Test: `apps/mobile/__tests__/screens/customer/NoApplicantRescue.test.tsx`

**Step 1: Write the failing screen tests for the remaining legacy touch/input boundaries**

- Cover `TouchableOpacity` removal in messaging screens.
- Cover sheet/layout ownership and bottom action consistency in the sheet-heavy flows.

**Step 2: Implement the migration**

- Replace remaining legacy touch primitives with the shared boundaries.
- Move the messaging screens onto the same shell and text/input contract as the rest of the app.
- Ensure sheet surfaces use the shared modal/sheet ownership model.

**Step 3: Verify the messaging and sheet flows**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand apps/mobile/__tests__/screens/shared/ConversationList.test.tsx apps/mobile/__tests__/screens/shared/ChatDetail.test.tsx apps/mobile/__tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx apps/mobile/__tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/LeadUnlockSheet.test.tsx apps/mobile/__tests__/screens/customer/TaskCancelSheet.test.tsx apps/mobile/__tests__/screens/customer/NoApplicantRescue.test.tsx
pnpm --filter @tasky/mobile typecheck
```

Expected: the last major pockets of styling drift are brought onto shared primitives and templates.

**Step 4: Commit the migration**

Run:

```bash
git add apps/mobile/src/app/(tabs)/inbox/index.tsx apps/mobile/src/app/(tabs)/inbox/[id].tsx apps/mobile/src/features/chat/components/InboxScreen.tsx apps/mobile/src/features/chat/components/ChatDetailScreen.tsx apps/mobile/src/features/bookings/components/CustomerCancelSheet.tsx apps/mobile/src/features/bookings/components/CustomerNoShowSheet.tsx apps/mobile/src/features/bookings/components/TaskerCancelSheet.tsx apps/mobile/src/features/bookings/components/TaskerNoShowSheet.tsx apps/mobile/src/features/bookings/components/LeadUnlockSheet.tsx apps/mobile/src/features/tasks/components/TaskCancelSheet.tsx apps/mobile/src/features/tasks/components/NoApplicantRescue.tsx apps/mobile/__tests__/screens/shared/ConversationList.test.tsx apps/mobile/__tests__/screens/shared/ChatDetail.test.tsx apps/mobile/__tests__/screens/customer/disputes/CustomerCancelSheet.test.tsx apps/mobile/__tests__/screens/customer/disputes/CustomerNoShowSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/TaskerCancelSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/TaskerNoShowSheet.test.tsx apps/mobile/__tests__/screens/tasker/jobs/LeadUnlockSheet.test.tsx apps/mobile/__tests__/screens/customer/TaskCancelSheet.test.tsx apps/mobile/__tests__/screens/customer/NoApplicantRescue.test.tsx
git commit -m "refactor(mobile): migrate messaging and sheet flows"
```

Expected: one commit covering the remaining high-drift route family.

---

### Task 12: Enforce the new boundaries and remove the migration crutches

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `package.json`
- Create: `tooling/scripts/validate-mobile-style-boundaries.mjs`
- Modify: `apps/mobile/__tests__/design/tokens.test.ts`
- Modify: `apps/mobile/src/design/tokenAdapter.ts`
- Modify: `apps/mobile/src/design/elevations.ts`
- Modify: `apps/mobile/src/design/navigationOptions.ts`

**Step 1: Write the failing enforcement checks**

- Extend `apps/mobile/__tests__/design/tokens.test.ts` so it fails if the old token adapter keeps the app on legacy deep access patterns.
- Create `tooling/scripts/validate-mobile-style-boundaries.mjs` that fails on:
  - core `SafeAreaView` imports from `react-native`
  - raw `TextInput` in route/component code outside approved wrappers
  - `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`
  - screen-owned `bottomNav`/local FAB shell patterns

**Step 2: Add the enforcement scripts to the workspace**

- Add a mobile style-boundary lint/check script to `apps/mobile/package.json`.
- Add a root script entry in `package.json` if needed so CI/local verification can run it directly.

**Step 3: Remove or freeze the compatibility bridge**

- If all imports can move off `tokenAdapter.ts`, delete it.
- If a small bridge is still needed, reduce it to a thin read-only compatibility shim and keep the enforcement test failing on any new legacy usage.

**Step 4: Verify the boundary enforcement**

Run:

```bash
node tooling/scripts/validate-mobile-style-boundaries.mjs
pnpm --filter @tasky/mobile lint
pnpm --filter @tasky/mobile typecheck
```

Expected: the codebase now fails fast if old styling patterns reappear.

**Step 5: Commit the cleanup**

Run:

```bash
git add apps/mobile/package.json package.json tooling/scripts/validate-mobile-style-boundaries.mjs apps/mobile/__tests__/design/tokens.test.ts apps/mobile/src/design/tokenAdapter.ts apps/mobile/src/design/elevations.ts apps/mobile/src/design/navigationOptions.ts
git commit -m "chore(mobile): enforce nativewind style boundaries"
```

Expected: one commit that makes the new architecture durable.

---

### Task 13: Re-audit parity and run full verification before handoff

**Files:**
- Create: `docs/plans/2026-04-04-mobile-nativewind-parity-checklist.md`
- Modify: `CHANGELOG.md`

**Step 1: Run the parity re-audit only after the architecture is stable**

- Audit representative screens from each family:
  - auth/onboarding
  - customer task-posting
  - customer list/detail/booking
  - tasker feed/jobs
  - messaging/sheets
- Record only the remaining visual drift and intentional deviations in `docs/plans/2026-04-04-mobile-nativewind-parity-checklist.md`.

**Step 2: Fix any residual drift that blocks the architecture handoff**

- Only fix parity gaps that remain after the structural migration.
- Do not reopen token, shell, or NativeWind architecture decisions here.

**Step 3: Update the changelog**

- Add a one-line summary to `CHANGELOG.md` describing the NativeWind/token/shell migration and parity validation.

**Step 4: Run the full required verification**

Run:

```bash
./gradlew test
./gradlew openApiValidate
pnpm -r typecheck
pnpm -r test
pnpm workspace:boundaries
node tooling/scripts/validate-mobile-style-boundaries.mjs
```

Expected: all required repo-level checks pass.

**Step 5: Final commit and handoff**

Run:

```bash
git add CHANGELOG.md docs/plans/2026-04-04-mobile-nativewind-parity-checklist.md
git commit -m "feat(mobile): complete nativewind foundation migration"
```

Expected: final implementation commit is ready for `@requesting-code-review`, then PR preparation under the repo’s submission checklist.
