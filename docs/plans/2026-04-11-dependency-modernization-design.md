# Design: Full Dependency Modernization

**Date:** 2026-04-11
**Status:** approved
**Approach:** Snapshot & Diff (baseline capture, gate diff on postflight)
**Reference:** `docs/MAINTENANCE_AUDIT_2026-04-11.md`, `docs/DEPENDENCY_VERSION_MATRIX.md`

---

## Decisions

| Decision | Choice |
|----------|--------|
| Scope | All three tracks (backend, frontend-safe, frontend-cascade) |
| Branching | One feature branch per track |
| Verification bar | CI-green (gateSmoke, typecheck, lint, tests, E2E smoke) |
| Cascade strategy | Atomic (React+RN+Expo co-dependents move together) |
| Methodology | Snapshot & Diff — capture baseline, diff postflight against it |
| Merge order | B (safe) first, A (backend) second, C (cascade) last |

---

## Preflight (Shared — Run Once on main)

**Purpose:** Establish a machine-verifiable green baseline before any upgrades begin.

### Steps

1. Verify clean working tree (`git status` shows nothing).

2. Run all gates on `main`, capture outputs:
   ```bash
   ./gradlew gateSmoke
   ./gradlew gateRegression
   ./gradlew gateFull
   pnpm -r typecheck
   pnpm -r lint
   pnpm -r test
   pnpm --filter @tasky/web test:e2e:smoke
   pnpm workspace:boundaries
   ```

3. Capture results into `baseline.json` (committed to each upgrade branch, not to main):
   ```json
   {
     "timestamp": "2026-04-11T...",
     "commit": "<main HEAD sha>",
     "backend": {
       "testCount": "<N>",
       "jacocoLineCoverage": "<N%>",
       "mutationKillRates": { "<domain>": "<N%>", "..." : "..." },
       "openApiValid": true
     },
     "web": {
       "testCount": "<N>",
       "typeErrors": 0,
       "lintErrors": 0,
       "e2eSmoke": "pass"
     },
     "mobile": {
       "testCount": "<N>",
       "typeErrors": 0,
       "lintErrors": 0
     },
     "workspaceBoundaries": "pass"
   }
   ```

4. Record `pnpm-lock.yaml` SHA and Gradle dependency state for postflight diffing.

**Exit criteria:** All gates green, `baseline.json` captured, working tree clean.

---

## Branch A: `upgrade/backend`

**Scope:** Gradle 8 to 9, Spring Boot 3.4 to 3.5, all safe Maven minor upgrades, ShedLock 5 to 6.

### Commit 1: Gradle 8.11.1 to 9.4.1

- Run `./gradlew wrapper --gradle-version 9.4.1`
- Fix deprecation warnings surfaced by Gradle 9
- Gate: `./gradlew clean :services:api:test`

### Commit 2: Spring Boot 3.4.2 to 3.5.3

- Update version in `services/api/build.gradle.kts`
- Check for Spring Security or autoconfiguration changes in 3.5 release notes
- **Do not touch `SecurityConfig.java` unless forced** (per AGENTS.md guardrail)
- Gate: `./gradlew gateSmoke`

### Commit 3: Maven minor upgrades (batch)

| Dependency | From | To |
|-----------|------|-----|
| JDBI | 3.47.0 | 3.49.3 |
| AWS S3 SDK | 2.29.46 | 2.34.0 |
| Firebase Admin | 9.4.2 | 9.5.0 |
| ErrorProne | 2.36.0 | 2.39.0 |
| ArchUnit | 1.3.0 | 1.4.1 |
| JSoup | 1.18.3 | 1.21.1 |
| Logstash Logback | 8.0 | 8.1 |
| Swagger Validator | 2.41.0 | 2.44.9 |

- Gate: `./gradlew test`

### Commit 4: ShedLock 5.16.0 to 6.6.0

- Review migration guide for API changes
- Update all ShedLock usage sites
- Gate: `./gradlew gateSmoke`

### Branch exit

- `./gradlew gateFull` passes
- Diff test count and mutation kill-rates against `baseline.json` — no regressions

---

## Branch B: `upgrade/frontend-safe`

**Scope:** Non-breaking patches and minor upgrades across all JS workspaces.

### Commit 1: Testing tooling

| Package | From | To |
|---------|------|-----|
| @playwright/test | 1.51.1 | 1.59.1 |
| @testing-library/react | 16.2.0 | 16.3.2 |
| @testing-library/react-native | 13.1.0 | 13.3.3 |
| @testing-library/jest-dom | 6.6.3 | 6.9.1 |

- Gate: `pnpm -r test`

### Commit 2: Build tooling patches

| Package | From | To |
|---------|------|-----|
| postcss | 8.5.6 | 8.5.9 |
| autoprefixer | 10.4.24 | 10.4.27 |
| @typescript-eslint/* | 8.56.0 | 8.58.1 |
| openapi-typescript | 7.10.1 | 7.13.0 |

- Gate: `pnpm -r typecheck && pnpm -r lint`

### Commit 3: App dependency minors

| Package | From | To |
|---------|------|-----|
| @tanstack/react-query | ^5.28.0 | ^5.97.0 |
| framer-motion | ^12.34.2 | ^12.38.0 |
| tailwind-merge | ^3.4.0 | ^3.5.0 |

- Gate: `pnpm -r test`

### Commit 4: Mobile safe minors

| Package | From | To |
|---------|------|-----|
| react-native-maps | 1.18.0 | 1.27.2 |
| react-native-svg | 15.8.0 | 15.15.4 |
| @gorhom/bottom-sheet | ^5.2.8 | ^5.2.9 |

- Gate: `pnpm --filter @tasky/mobile test`

### Commit 5: Regenerate lockfile

- `pnpm install` to ensure `pnpm-lock.yaml` is consistent
- Gate: `pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke`

### Branch exit

- All frontend gates green
- Diff test counts per workspace against `baseline.json` — no regressions

---

## Branch C: `upgrade/frontend-cascade`

**Scope:** All major version upgrades. Atomic cascade for React/RN/Expo.

### Commit group 1: React 18 to 19 + React Native 0.76 to 0.85 + Expo 52 to 55

**Web:**
- `apps/web/package.json`: react 19.2.5, react-dom 19.2.5

**Mobile:**
- `apps/mobile/package.json`: react 19.2.5, react-native 0.85.0, expo ~55.0.14, expo-router ~55.0.12

**All Expo sub-packages to SDK 55 line:**
- expo-font, expo-constants, expo-device, expo-blur, expo-asset
- expo-image-picker, expo-linear-gradient, expo-linking
- expo-location, expo-localization, expo-status-bar

**Shared:**
- `packages/core/package.json`: react peerDep ^19.0.0
- @types/react to 19.2.14, @types/react-dom to 19.2.3 across all workspaces

**Test infra:**
- jest-expo to ~55.0.15, babel-preset-expo to ~55.0.17, eslint-config-expo to 55.0.0

**Cleanup:**
- Remove `expo-localization` patch from `pnpm-workspace.yaml` if SDK 55 resolves it
- Fix breakage: ref-as-prop migration, react-test-renderer to React 19 equivalent

**Gate:** `pnpm -r typecheck && pnpm -r test`

### Commit 2: React Native ecosystem co-dependents

| Package | From | To |
|---------|------|-----|
| @react-native-firebase/app | ^23.8.8 | 24.0.0 |
| @react-native-firebase/messaging | ^23.8.8 | 24.0.0 |
| react-native-reanimated | ~3.16.7 | 4.3.0 |
| react-native-safe-area-context | 4.12.0 | 5.7.0 |
| react-native-screens | ~4.4.0 | 4.24.0 |
| react-native-gesture-handler | ~2.20.2 | 2.31.1 |
| @react-native-async-storage/async-storage | 1.23.1 | 3.0.2 |

- Fix breaking API changes from these majors
- Gate: `pnpm --filter @tasky/mobile test`

### Commit 3: Vite 5 to 8

| Package | From | To |
|---------|------|-----|
| vite | 5.4.21 | 8.0.8 |
| @vitejs/plugin-react | 4.5.0 | 6.0.1 |

- Update vite config if Rolldown changes require it
- Gate: `pnpm --filter @tasky/web build && pnpm --filter @tasky/web test && pnpm --filter @tasky/web test:e2e:smoke`

### Commit 4: TypeScript 5.9 to 6.0

- Update typescript to 6.0.2 in all workspace `package.json` files
- Fix any new strict-mode diagnostics
- Gate: `pnpm -r typecheck`

### Commit 5: Vitest 3 to 4 + Jest 29 to 30

| Package | From | To | Workspace |
|---------|------|-----|-----------|
| vitest | 3.0.7 | 4.1.4 | web |
| @vitest/coverage-v8 | 3.0.7 | 4.1.4 | web |
| jsdom | 26.0.0 | 29.0.2 | web |
| jest | 29.7.0 | 30.3.0 | mobile |
| @types/jest | 29.5.14 | 30.0.0 | mobile |

- Fix test runner API changes
- Gate: `pnpm -r test`

### Commit 6: Remaining app-level majors

| Package | From | To |
|---------|------|-----|
| i18next | ^25.8.13 | 26.0.4 |
| react-i18next | ^16.5.4 | 17.0.2 |
| lucide-react | ^0.575.0 | 1.8.0 |
| lucide-react-native | ^0.575.0 | 1.8.0 |
| react-router-dom | ^6.30.1 | 7.14.0 |
| zod | ^3.22.4 | 4.3.6 |
| eslint-plugin-react-hooks | 5.2.0 | 7.0.1 |
| @stryker-mutator/* | ^8.7.1 | 9.6.1 |

- Fix import/API changes for each
- Gate: `pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke`

### Commit 7: Tailwind 3 to 4 (final — most breaking)

- Update tailwindcss to 4.2.2 in both apps
- Migrate `tailwind.config.ts` to v4 CSS-first config format
- Update or replace tailwindcss-animate for v4 compatibility
- Verify design token integration still works
- NativeWind: stay on 4.2.3 (v5 is preview). Evaluate at this step whether v5 is viable given Reanimated 4 is now present.
- Gate: `pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke`

### Branch exit

- All gates green
- Diff test counts, type error count, and E2E status against `baseline.json` — no regressions

---

## Postflight (Per Branch, Before PR)

### Steps

1. Run the full gate suite (same commands as preflight).

2. Capture `postflight.json` with the same schema as `baseline.json`.

3. Diff against baseline:

   | Metric | Rule |
   |--------|------|
   | Test count (per workspace) | Must be >= baseline. Drop = investigate. |
   | JaCoCo line coverage | Must be >= baseline (backend only) |
   | PIT mutation kill-rates | Must be >= baseline per domain (backend only) |
   | Type errors | Must be 0 |
   | Lint errors | Must be 0 |
   | E2E smoke | Must pass |
   | Workspace boundaries | Must pass |
   | OpenAPI validate | Must pass |

   Legitimate reductions (e.g., deprecated test removed because API changed) must be documented in the PR description.

4. Verify `pnpm-lock.yaml` / Gradle dependency diff is intentional — only upgraded deps changed, no unexpected transitive additions.

5. Update `CHANGELOG.md` with one-liner per branch.

6. Open PR with description including:
   - Which deps changed (from to to)
   - Baseline vs. postflight diff summary
   - Any breakage encountered and how it was fixed
   - Any tests modified and why

### Merge Order

1. **Branch B** (`upgrade/frontend-safe`) — lowest risk, validates CI pipeline
2. **Branch A** (`upgrade/backend`) — independent, own test suite
3. **Branch C** (`upgrade/frontend-cascade`) — highest risk, merges last

Each branch rebases onto main after the previous one merges, re-runs postflight to confirm no conflicts introduced regressions.

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| React 19 ref-as-prop breaks component library | Audit all `forwardRef` usage before upgrading; fix in same commit |
| Expo SDK 55 breaks `expo-localization` patch | Check if patch is still needed; if yes, port patch to SDK 55 |
| Vite 8 Rolldown changes break build config | Review Vite 8 migration guide; config changes are typically minimal |
| Tailwind 4 config migration breaks design tokens | Token integration is via CSS variables; verify `packages/design-tokens` output still maps |
| ShedLock 6 breaks scheduled job locking | Review ShedLock 6 changelog for breaking changes; update usage sites |
| SecurityConfig.java accidentally modified | Per AGENTS.md: do not touch SecurityConfig.java unless forced by Spring Security changes |
| Silent test deletion to make CI pass | Baseline diff catches test count drops; PR must explain any reductions |
| NativeWind v5 preview instability | Stay on v4.2.3; only upgrade if v5 is proven stable at this step |
| react-router-dom v7 breaking changes | v7 has loader/action API changes; audit all route definitions |
| Firebase RN 24 requires native module rebuild | Expo prebuild may be needed; run `expo prebuild --clean` after upgrade |
