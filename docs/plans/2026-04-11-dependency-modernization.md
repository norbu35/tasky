# Dependency Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all dependencies across backend and frontend to latest stable versions, verified against a green baseline.

**Architecture:** Three isolated branches (`upgrade/backend`, `upgrade/frontend-safe`, `upgrade/frontend-cascade`) each capture a preflight baseline, upgrade deps with per-commit gates, then diff postflight against baseline before PR. Merge order: safe → backend → cascade.

**Tech Stack:** Gradle 9 / Spring Boot 3.5 / Java 21 / pnpm 10 / React 19 / RN 0.85 / Expo 55 / Vite 8 / TS 6 / Tailwind 4

**Design spec:** `docs/plans/2026-04-11-dependency-modernization-design.md`

---

## Task 0: Preflight — Capture Baseline on main

**Files:**
- Create: `tooling/scripts/capture-baseline.sh`
- Output: `baseline.json` (committed to each upgrade branch, not to main)

- [ ] **Step 1: Create the baseline capture script**

Create `tooling/scripts/capture-baseline.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

COMMIT=$(git rev-parse HEAD)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=== Running backend gates ==="
./gradlew clean :services:api:test 2>&1 | tail -5
BACKEND_TESTS=$(find services/api/build/test-results -name "*.xml" -exec grep -l "testcase" {} \; | xargs grep -c "<testcase" | awk -F: '{s+=$2} END {print s}')
JACOCO_LINE=$(grep -oP 'Total.*?(\d+)%' services/api/build/reports/jacoco/test/html/index.html 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
./gradlew :services:api:openApiValidate 2>&1 | tail -1

echo "=== Running frontend gates ==="
pnpm -r typecheck 2>&1 | tail -3
pnpm -r lint 2>&1 | tail -3
WEB_TESTS=$(pnpm --filter @tasky/web test:unit 2>&1 | grep -oP 'Tests\s+\d+ passed' | grep -oP '\d+' || echo "0")
MOBILE_TESTS=$(pnpm --filter @tasky/mobile test:unit 2>&1 | grep -oP '\d+ passed' | grep -oP '\d+' | head -1 || echo "0")
pnpm --filter @tasky/web test:e2e:smoke 2>&1 | tail -3
pnpm workspace:boundaries 2>&1 | tail -1

cat > baseline.json <<ENDJSON
{
  "timestamp": "$TIMESTAMP",
  "commit": "$COMMIT",
  "backend": {
    "testCount": $BACKEND_TESTS,
    "jacocoLineCoverage": $JACOCO_LINE,
    "openApiValid": true
  },
  "web": {
    "testCount": $WEB_TESTS,
    "typeErrors": 0,
    "lintErrors": 0,
    "e2eSmoke": "pass"
  },
  "mobile": {
    "testCount": $MOBILE_TESTS,
    "typeErrors": 0,
    "lintErrors": 0
  },
  "workspaceBoundaries": "pass"
}
ENDJSON

echo ""
echo "=== Baseline captured ==="
cat baseline.json
```

- [ ] **Step 2: Run the baseline capture**

```bash
chmod +x tooling/scripts/capture-baseline.sh
bash tooling/scripts/capture-baseline.sh
```

Expected: All gates green, `baseline.json` created in repo root with concrete numbers.

If any gate fails, fix it on main before proceeding. Do not start upgrade branches from a broken baseline.

- [ ] **Step 3: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` (aside from `baseline.json` and the new script, which are not committed to main).

---

## Branch B: `upgrade/frontend-safe`

### Task 1: Create branch and commit baseline

**Files:**
- Create branch: `upgrade/frontend-safe`
- Commit: `baseline.json`, `tooling/scripts/capture-baseline.sh`

- [ ] **Step 1: Create the branch from main**

```bash
git checkout -b upgrade/frontend-safe
```

- [ ] **Step 2: Commit baseline and script to the branch**

```bash
git add baseline.json tooling/scripts/capture-baseline.sh
git commit -m "chore: add preflight baseline for dependency upgrade"
```

---

### Task 2: Upgrade testing tooling

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `apps/mobile/package.json` (devDependencies)

- [ ] **Step 1: Update web testing deps in `apps/web/package.json`**

Change in devDependencies:
```
"@playwright/test": "1.51.1"        → "@playwright/test": "1.59.1"
"@testing-library/jest-dom": "6.6.3" → "@testing-library/jest-dom": "6.9.1"
"@testing-library/react": "16.2.0"   → "@testing-library/react": "16.3.2"
```

- [ ] **Step 2: Update mobile testing deps in `apps/mobile/package.json`**

Change in devDependencies:
```
"@testing-library/react-native": "13.1.0" → "@testing-library/react-native": "13.3.3"
```

- [ ] **Step 3: Install and run gate**

```bash
pnpm install
pnpm -r test
```

Expected: All tests pass. Test counts should match or exceed baseline.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade testing tooling (Playwright 1.59, testing-library patches)"
```

---

### Task 3: Upgrade build tooling patches

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `packages/sdk/package.json` (devDependencies)

- [ ] **Step 1: Update web build deps in `apps/web/package.json`**

Change in devDependencies:
```
"@typescript-eslint/eslint-plugin": "8.56.0" → "@typescript-eslint/eslint-plugin": "8.58.1"
"@typescript-eslint/parser": "8.56.0"         → "@typescript-eslint/parser": "8.58.1"
"postcss": "^8.5.6"                           → "postcss": "^8.5.9"
"autoprefixer": "^10.4.24"                    → "autoprefixer": "^10.4.27"
```

- [ ] **Step 2: Update @typescript-eslint in `packages/core/package.json`**

Change in devDependencies:
```
"@typescript-eslint/eslint-plugin": "8.56.0" → "@typescript-eslint/eslint-plugin": "8.58.1"
"@typescript-eslint/parser": "8.56.0"         → "@typescript-eslint/parser": "8.58.1"
```

- [ ] **Step 3: Update openapi-typescript in `packages/sdk/package.json`**

Change in devDependencies:
```
"openapi-typescript": "7.10.1" → "openapi-typescript": "7.13.0"
```

- [ ] **Step 4: Install and run gates**

```bash
pnpm install
pnpm sdk:generate
pnpm -r typecheck && pnpm -r lint
```

Expected: Zero type errors, zero lint errors. SDK regeneration produces no diff (or only formatting changes from new openapi-typescript).

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json packages/core/package.json packages/sdk/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade build tooling (typescript-eslint 8.58, postcss, openapi-typescript 7.13)"
```

---

### Task 4: Upgrade app dependency minors

**Files:**
- Modify: `apps/web/package.json` (dependencies)

- [ ] **Step 1: Update caret-range deps in `apps/web/package.json`**

These are caret ranges — update the floor to the latest minor:
```
"@tanstack/react-query": "^5.28.0"  → "@tanstack/react-query": "^5.97.0"
"framer-motion": "^12.34.2"         → "framer-motion": "^12.38.0"
"tailwind-merge": "^3.4.0"          → "tailwind-merge": "^3.5.0"
```

- [ ] **Step 2: Install and run gate**

```bash
pnpm install
pnpm -r test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade web app minors (react-query 5.97, framer-motion 12.38, tailwind-merge 3.5)"
```

---

### Task 5: Upgrade mobile safe minors

**Files:**
- Modify: `apps/mobile/package.json` (dependencies)

- [ ] **Step 1: Update mobile deps in `apps/mobile/package.json`**

```
"react-native-maps": "1.18.0"       → "react-native-maps": "1.27.2"
"react-native-svg": "15.8.0"        → "react-native-svg": "15.15.4"
"@gorhom/bottom-sheet": "^5.2.8"    → "@gorhom/bottom-sheet": "^5.2.9"
```

- [ ] **Step 2: Install and run gate**

```bash
pnpm install
pnpm --filter @tasky/mobile test
```

Expected: All mobile tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade mobile safe minors (react-native-maps 1.27, svg 15.15, bottom-sheet 5.2.9)"
```

---

### Task 6: Regenerate lockfile and run full gate

**Files:**
- Modify: `pnpm-lock.yaml` (auto-generated)

- [ ] **Step 1: Clean install to ensure lockfile consistency**

```bash
pnpm install
```

- [ ] **Step 2: Run full frontend gate suite**

```bash
pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke && pnpm workspace:boundaries
```

Expected: All pass.

- [ ] **Step 3: Commit lockfile if changed**

```bash
git add pnpm-lock.yaml
git diff --cached --quiet || git commit -m "chore: regenerate pnpm-lock.yaml after safe upgrades"
```

---

### Task 7: Postflight — Branch B

- [ ] **Step 1: Capture postflight**

```bash
cp tooling/scripts/capture-baseline.sh tooling/scripts/capture-postflight.sh
bash tooling/scripts/capture-postflight.sh
mv baseline.json postflight.json
```

- [ ] **Step 2: Diff against baseline**

```bash
diff <(jq -S . baseline.json) <(jq -S . postflight.json)
```

Verify: test counts are >= baseline, type/lint errors are 0, e2eSmoke is pass.

- [ ] **Step 3: Update CHANGELOG.md**

Add under the latest version heading:
```
- chore: upgrade frontend safe dependencies (Playwright 1.59, testing-library, postcss, openapi-typescript 7.13, react-query 5.97)
```

- [ ] **Step 4: Commit and push**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for frontend-safe dependency upgrade"
git push -u origin upgrade/frontend-safe
```

- [ ] **Step 5: Open PR**

```bash
gh pr create --title "chore: upgrade frontend safe dependencies" --body "$(cat <<'EOF'
## Summary
- Upgrade testing tooling: Playwright 1.59.1, testing-library patches
- Upgrade build tooling: typescript-eslint 8.58.1, postcss 8.5.9, openapi-typescript 7.13.0
- Upgrade app minors: react-query 5.97, framer-motion 12.38, tailwind-merge 3.5
- Upgrade mobile safe: react-native-maps 1.27, react-native-svg 15.15

## Verification
All existing gates pass. Test counts match or exceed preflight baseline.
No breaking changes — all minor/patch upgrades.

## Baseline diff
[Paste diff output here]
EOF
)"
```

---

## Branch A: `upgrade/backend`

### Task 8: Create branch and commit baseline

- [ ] **Step 1: Create the branch from main**

```bash
git checkout main
git checkout -b upgrade/backend
```

- [ ] **Step 2: Commit baseline to the branch**

```bash
git add baseline.json tooling/scripts/capture-baseline.sh
git commit -m "chore: add preflight baseline for dependency upgrade"
```

---

### Task 9: Upgrade Gradle 8.11.1 to 9.4.1

**Files:**
- Modify: `gradle/wrapper/gradle-wrapper.properties`
- Modify: `build.gradle.kts` and `services/api/build.gradle.kts` (if deprecation fixes needed)

- [ ] **Step 1: Run the Gradle wrapper upgrade**

```bash
./gradlew wrapper --gradle-version 9.4.1
```

This updates `gradle/wrapper/gradle-wrapper.properties` and the wrapper JAR.

- [ ] **Step 2: Verify the wrapper version**

```bash
./gradlew --version
```

Expected: `Gradle 9.4.1`

- [ ] **Step 3: Run backend tests to check for deprecation breakage**

```bash
./gradlew clean :services:api:test 2>&1 | head -50
```

If deprecation warnings appear, fix them in `build.gradle.kts` or `services/api/build.gradle.kts`. Common Gradle 9 changes:
- `isIgnoreFailures` → check if setter API changed
- Task configuration avoidance warnings become errors
- `ConfigurableFileCollection` API changes

- [ ] **Step 4: Run full test suite**

```bash
./gradlew clean :services:api:test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add gradle/ build.gradle.kts services/api/build.gradle.kts settings.gradle.kts
git commit -m "chore(deps): upgrade Gradle 8.11.1 → 9.4.1"
```

---

### Task 10: Upgrade Spring Boot 3.4.2 to 3.5.3

**Files:**
- Modify: `services/api/build.gradle.kts:6` (plugin version)

- [ ] **Step 1: Update Spring Boot version**

In `services/api/build.gradle.kts`, change line 6:
```
id("org.springframework.boot") version "3.4.2"
```
to:
```
id("org.springframework.boot") version "3.5.3"
```

- [ ] **Step 2: Run compile to check for API changes**

```bash
./gradlew :services:api:compileJava
```

If compilation fails, check Spring Boot 3.5 release notes for breaking autoconfiguration or security changes. **Do not modify `SecurityConfig.java`** unless the compiler forces it — per AGENTS.md guardrail.

- [ ] **Step 3: Run gate**

```bash
./gradlew gateSmoke
```

Expected: All critical scenarios pass.

- [ ] **Step 4: Commit**

```bash
git add services/api/build.gradle.kts
git commit -m "chore(deps): upgrade Spring Boot 3.4.2 → 3.5.3"
```

---

### Task 11: Upgrade Maven minor dependencies (batch)

**Files:**
- Modify: `services/api/build.gradle.kts` (version strings)

- [ ] **Step 1: Update version variables and inline versions**

In `services/api/build.gradle.kts`:

Line 32 — change:
```kotlin
val jdbiVersion = "3.47.0"
```
to:
```kotlin
val jdbiVersion = "3.49.3"
```

Line 68 — change:
```kotlin
implementation("software.amazon.awssdk:s3:2.29.46")
```
to:
```kotlin
implementation("software.amazon.awssdk:s3:2.34.0")
```

Line 71 — change:
```kotlin
implementation("net.logstash.logback:logstash-logback-encoder:8.0")
```
to:
```kotlin
implementation("net.logstash.logback:logstash-logback-encoder:8.1")
```

Line 75 — change:
```kotlin
implementation("org.jsoup:jsoup:1.18.3")
```
to:
```kotlin
implementation("org.jsoup:jsoup:1.21.1")
```

Line 78 — change:
```kotlin
implementation("com.google.firebase:firebase-admin:9.4.2")
```
to:
```kotlin
implementation("com.google.firebase:firebase-admin:9.5.0")
```

Line 88 — change:
```kotlin
testImplementation("com.tngtech.archunit:archunit-junit5:1.3.0")
```
to:
```kotlin
testImplementation("com.tngtech.archunit:archunit-junit5:1.4.1")
```

Line 89 — change:
```kotlin
testImplementation("com.atlassian.oai:swagger-request-validator-mockmvc:2.41.0")
```
to:
```kotlin
testImplementation("com.atlassian.oai:swagger-request-validator-mockmvc:2.44.9")
```

Line 92 — change:
```kotlin
errorprone("com.google.errorprone:error_prone_core:2.36.0")
```
to:
```kotlin
errorprone("com.google.errorprone:error_prone_core:2.39.0")
```

- [ ] **Step 2: Run gate**

```bash
./gradlew :services:api:test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add services/api/build.gradle.kts
git commit -m "chore(deps): upgrade Maven minors (JDBI 3.49, AWS SDK 2.34, Firebase 9.5, ErrorProne 2.39, ArchUnit 1.4, JSoup 1.21, Logstash 8.1, Swagger Validator 2.44)"
```

---

### Task 12: Upgrade ShedLock 5.16.0 to 6.6.0

**Files:**
- Modify: `services/api/build.gradle.kts:54-55` (ShedLock versions)
- Possibly modify: ShedLock usage sites (search for `@SchedulerLock`)

- [ ] **Step 1: Update ShedLock versions**

In `services/api/build.gradle.kts`, change lines 54-55:
```kotlin
implementation("net.javacrumbs.shedlock:shedlock-spring:5.16.0")
implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:5.16.0")
```
to:
```kotlin
implementation("net.javacrumbs.shedlock:shedlock-spring:6.6.0")
implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:6.6.0")
```

- [ ] **Step 2: Search for ShedLock usage sites that may need API changes**

```bash
grep -rn "SchedulerLock\|LockProvider\|shedlock" services/api/src/ --include="*.java"
```

Review each hit against the ShedLock 6 changelog. Common breaking changes:
- `@SchedulerLock` annotation attribute renames
- `LockProvider` interface changes
- Configuration class updates

Fix any compilation errors.

- [ ] **Step 3: Run gate**

```bash
./gradlew gateSmoke
```

Expected: All critical scenarios pass.

- [ ] **Step 4: Commit**

```bash
git add services/api/build.gradle.kts services/api/src/
git commit -m "chore(deps): upgrade ShedLock 5.16.0 → 6.6.0"
```

---

### Task 13: Postflight — Branch A

- [ ] **Step 1: Run full backend gate**

```bash
./gradlew gateFull
```

Expected: Pass. This runs tests + JaCoCo + PIT mutation testing.

- [ ] **Step 2: Diff test count and mutation kill-rates against baseline**

```bash
bash tooling/scripts/capture-baseline.sh
mv baseline.json postflight-backend.json
diff <(jq -S .backend baseline.json) <(jq -S .backend postflight-backend.json)
```

Verify: testCount >=, jacocoLineCoverage >=, mutationKillRates >= per domain.

- [ ] **Step 3: Update CHANGELOG.md**

Add:
```
- chore: upgrade backend dependencies (Gradle 9.4.1, Spring Boot 3.5.3, JDBI 3.49, ShedLock 6.6, AWS SDK 2.34)
```

- [ ] **Step 4: Commit, push, and open PR**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for backend dependency upgrade"
git push -u origin upgrade/backend
gh pr create --title "chore: upgrade backend dependencies" --body "$(cat <<'EOF'
## Summary
- Gradle 8.11.1 → 9.4.1
- Spring Boot 3.4.2 → 3.5.3
- JDBI 3.47.0 → 3.49.3, AWS S3 SDK 2.29.46 → 2.34.0, Firebase Admin 9.5.0
- ErrorProne 2.39.0, ArchUnit 1.4.1, JSoup 1.21.1, Logstash 8.1, Swagger Validator 2.44.9
- ShedLock 5.16.0 → 6.6.0

## Verification
`./gradlew gateFull` passes. Test counts and mutation kill-rates match or exceed baseline.

## Baseline diff
[Paste diff output here]
EOF
)"
```

---

## Branch C: `upgrade/frontend-cascade`

### Task 14: Create branch and commit baseline

- [ ] **Step 1: Create the branch from main**

```bash
git checkout main
git checkout -b upgrade/frontend-cascade
```

- [ ] **Step 2: Commit baseline to the branch**

```bash
git add baseline.json tooling/scripts/capture-baseline.sh
git commit -m "chore: add preflight baseline for dependency upgrade"
```

---

### Task 15: React 18→19 + React Native 0.76→0.85 + Expo 52→55 (atomic)

**Files:**
- Modify: `apps/web/package.json` (react, react-dom, @types/react, @types/react-dom)
- Modify: `apps/mobile/package.json` (react, react-native, expo, all expo-* packages, jest-expo, babel-preset-expo, eslint-config-expo, react-test-renderer, @types/react)
- Modify: `packages/core/package.json` (peerDependencies.react, devDependencies.@types/react)
- Modify: `pnpm-workspace.yaml` (remove expo-localization patch if resolved)
- Fix: Any source files with React 19 breakage (forwardRef, ref-as-prop)

- [ ] **Step 1: Update `apps/web/package.json`**

In dependencies:
```
"react": "18.3.1"      → "react": "19.2.5"
"react-dom": "18.3.1"  → "react-dom": "19.2.5"
```

In devDependencies:
```
"@types/react": "18.3.5"      → "@types/react": "19.2.14"
"@types/react-dom": "18.3.0"  → "@types/react-dom": "19.2.3"
```

- [ ] **Step 2: Update `apps/mobile/package.json`**

In dependencies:
```
"react": "18.3.1"                           → "react": "19.2.5"
"react-native": "0.76.7"                    → "react-native": "0.85.0"
"expo": "~52.0.39"                          → "expo": "~55.0.14"
"expo-asset": "~11.0.5"                     → "expo-asset": "~55.0.14"
"expo-blur": "~14.0.3"                      → "expo-blur": "~55.0.14"
"expo-constants": "~17.0.3"                 → "expo-constants": "~55.0.13"
"expo-device": "~7.0.3"                     → "expo-device": "~55.0.14"
"expo-font": "~13.0.4"                      → "expo-font": "~55.0.6"
"expo-image-picker": "~16.0.6"              → "expo-image-picker": "~55.0.18"
"expo-linear-gradient": "~14.0.2"           → "expo-linear-gradient": "~55.0.13"
"expo-linking": "~7.0.3"                    → "expo-linking": "~55.0.12"
"expo-localization": "~16.0.1"              → "expo-localization": "~55.0.13"
"expo-location": "~18.0.10"                 → "expo-location": "~55.1.8"
"expo-router": "~4.0.17"                    → "expo-router": "~55.0.12"
"expo-status-bar": "~2.0.0"                 → "expo-status-bar": "~55.0.5"
```

In devDependencies:
```
"@types/react": "18.3.5"                    → "@types/react": "19.2.14"
"babel-preset-expo": "~12.0.0"              → "babel-preset-expo": "~55.0.17"
"eslint-config-expo": "10.0.0"              → "eslint-config-expo": "55.0.0"
"jest-expo": "~52.0.4"                      → "jest-expo": "~55.0.15"
"react-test-renderer": "18.3.1"             → "react-test-renderer": "19.2.5"
```

- [ ] **Step 3: Update `packages/core/package.json`**

In peerDependencies:
```
"react": "^18.2.0"  → "react": "^19.0.0"
```

In devDependencies:
```
"@types/react": "^18.2.73"  → "@types/react": "^19.0.0"
```

- [ ] **Step 4: Remove expo-localization patch from `pnpm-workspace.yaml` if SDK 55 resolves it**

If expo-localization@55.x resolves the original issue, change `pnpm-workspace.yaml` to:
```yaml
packages:
  - apps/*
  - packages/*
```

If the patch is still needed, port it to the new version. Check with:
```bash
pnpm install
pnpm --filter @tasky/mobile typecheck
```

- [ ] **Step 5: Install and fix React 19 breakage**

```bash
pnpm install
pnpm -r typecheck 2>&1 | head -80
```

Common React 19 fixes:
- `forwardRef` is no longer needed — `ref` is a regular prop. Remove `forwardRef` wrappers.
- `react-test-renderer` — check if it still works with React 19, or replace test patterns with `@testing-library/react`.
- `defaultProps` on function components is deprecated — move to default parameter values.

Search for affected patterns:
```bash
grep -rn "forwardRef" apps/web/src/ apps/mobile/src/ packages/ --include="*.tsx" --include="*.ts"
grep -rn "defaultProps" apps/web/src/ apps/mobile/src/ packages/ --include="*.tsx" --include="*.ts"
```

Fix each instance.

- [ ] **Step 6: Run gate**

```bash
pnpm -r typecheck && pnpm -r test
```

Expected: All tests pass across all workspaces.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json packages/core/package.json pnpm-workspace.yaml pnpm-lock.yaml
git add -u  # pick up any source file fixes
git commit -m "chore(deps): upgrade React 19.2.5, React Native 0.85.0, Expo SDK 55"
```

---

### Task 16: React Native ecosystem co-dependents

**Files:**
- Modify: `apps/mobile/package.json` (dependencies)
- Possibly modify: source files using changed APIs

- [ ] **Step 1: Update RN ecosystem deps in `apps/mobile/package.json`**

In dependencies:
```
"@react-native-firebase/app": "^23.8.8"                        → "@react-native-firebase/app": "^24.0.0"
"@react-native-firebase/messaging": "^23.8.8"                  → "@react-native-firebase/messaging": "^24.0.0"
"react-native-reanimated": "~3.16.7"                           → "react-native-reanimated": "~4.3.0"
"react-native-safe-area-context": "4.12.0"                     → "react-native-safe-area-context": "5.7.0"
"react-native-screens": "~4.4.0"                               → "react-native-screens": "~4.24.0"
"react-native-gesture-handler": "~2.20.2"                      → "react-native-gesture-handler": "~2.31.1"
"@react-native-async-storage/async-storage": "1.23.1"          → "@react-native-async-storage/async-storage": "3.0.2"
```

- [ ] **Step 2: Install and check for breakage**

```bash
pnpm install
pnpm --filter @tasky/mobile typecheck 2>&1 | head -40
```

Common breaking changes:
- `@react-native-async-storage/async-storage` v3 — API may have changed. Search usage:
  ```bash
  grep -rn "AsyncStorage" apps/mobile/src/ --include="*.ts" --include="*.tsx"
  ```
- `react-native-reanimated` v4 — worklet API changes. Search usage:
  ```bash
  grep -rn "useAnimatedStyle\|useSharedValue\|withTiming\|worklet" apps/mobile/src/ --include="*.ts" --include="*.tsx"
  ```
- `react-native-safe-area-context` v5 — hook API may differ. Search:
  ```bash
  grep -rn "useSafeAreaInsets\|SafeAreaProvider" apps/mobile/src/ --include="*.ts" --include="*.tsx"
  ```

Fix each instance.

- [ ] **Step 3: Run gate**

```bash
pnpm --filter @tasky/mobile test
```

Expected: All mobile tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git add -u
git commit -m "chore(deps): upgrade RN ecosystem (Firebase 24, Reanimated 4.3, safe-area-context 5.7, async-storage 3.0)"
```

---

### Task 17: Vite 5 to 8

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Possibly modify: `apps/web/vite.config.ts` (if Rolldown migration needs config changes)

- [ ] **Step 1: Update Vite and plugin in `apps/web/package.json`**

In devDependencies:
```
"vite": "5.4.21"                   → "vite": "8.0.8"
"@vitejs/plugin-react": "4.5.0"   → "@vitejs/plugin-react": "6.0.1"
```

- [ ] **Step 2: Install and check build**

```bash
pnpm install
pnpm --filter @tasky/web build
```

If build fails, check `apps/web/vite.config.ts` for deprecated options. Vite 8 uses Rolldown internally but the config API is mostly compatible. Common changes:
- `optimizeDeps` options may behave differently
- Plugin API v6 may require updates

- [ ] **Step 3: Run gate**

```bash
pnpm --filter @tasky/web build && pnpm --filter @tasky/web test && pnpm --filter @tasky/web test:e2e:smoke
```

Expected: Build succeeds, all tests pass, E2E smoke passes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/vite.config.ts
git commit -m "chore(deps): upgrade Vite 5.4.21 → 8.0.8 (Rolldown bundler)"
```

---

### Task 18: TypeScript 5.9 to 6.0

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `apps/mobile/package.json` (devDependencies)
- Modify: `packages/core/package.json` (devDependencies)
- Modify: `packages/sdk/package.json` (devDependencies)

- [ ] **Step 1: Update TypeScript version across all workspaces**

In each of these files, update the `typescript` devDependency:
```
"typescript": "5.9.2"  → "typescript": "6.0.2"
```

Files:
- `apps/web/package.json`
- `apps/mobile/package.json`
- `packages/core/package.json`
- `packages/sdk/package.json`

- [ ] **Step 2: Install and run typecheck**

```bash
pnpm install
pnpm -r typecheck
```

Expected: Zero type errors. TS 6.0 is the last JS-based release and is largely backward-compatible with 5.9. If new diagnostics surface, fix them.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json packages/core/package.json packages/sdk/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade TypeScript 5.9.2 → 6.0.2"
```

---

### Task 19: Vitest 3→4 + Jest 29→30

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `apps/mobile/package.json` (devDependencies)

- [ ] **Step 1: Update web test runner in `apps/web/package.json`**

In devDependencies:
```
"vitest": "3.0.7"                → "vitest": "4.1.4"
"@vitest/coverage-v8": "3.0.7"  → "@vitest/coverage-v8": "4.1.4"
"jsdom": "26.0.0"                → "jsdom": "29.0.2"
```

- [ ] **Step 2: Update mobile test runner in `apps/mobile/package.json`**

In devDependencies:
```
"jest": "29.7.0"          → "jest": "30.3.0"
"@types/jest": "29.5.14"  → "@types/jest": "30.0.0"
```

- [ ] **Step 3: Install and run gate**

```bash
pnpm install
pnpm -r test
```

If tests fail, check migration guides:
- Vitest 4: config API changes, snapshot format changes
- Jest 30: possible timer/mock API changes

Fix affected test files.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json pnpm-lock.yaml
git add -u
git commit -m "chore(deps): upgrade Vitest 3.0.7 → 4.1.4, Jest 29.7.0 → 30.3.0"
```

---

### Task 20: Remaining app-level majors

**Files:**
- Modify: `apps/web/package.json` (dependencies + devDependencies)
- Modify: `apps/mobile/package.json` (dependencies)
- Modify: `packages/core/package.json` (dependencies)
- Fix: Source files with changed import paths or APIs

- [ ] **Step 1: Update i18n stack in `apps/web/package.json` and `apps/mobile/package.json`**

In both files, change in dependencies:
```
"i18next": "^25.8.13"      → "i18next": "^26.0.4"
"react-i18next": "^16.5.4" → "react-i18next": "^17.0.2"
```

- [ ] **Step 2: Update lucide icons in both apps**

In `apps/web/package.json` dependencies:
```
"lucide-react": "^0.575.0" → "lucide-react": "^1.8.0"
```

In `apps/mobile/package.json` dependencies:
```
"lucide-react-native": "^0.575.0" → "lucide-react-native": "^1.8.0"
```

Check for renamed icons:
```bash
grep -rn "from 'lucide-react" apps/web/src/ --include="*.tsx" --include="*.ts" | head -20
grep -rn "from 'lucide-react-native" apps/mobile/src/ --include="*.tsx" --include="*.ts" | head -20
```

- [ ] **Step 3: Update react-router-dom in `apps/web/package.json`**

In dependencies:
```
"react-router-dom": "^6.30.1" → "react-router-dom": "^7.14.0"
```

React Router v7 changes:
- `useLoaderData`, `useActionData` API changes
- Route definition format may differ
- Search for affected patterns:
```bash
grep -rn "useLoaderData\|useActionData\|createBrowserRouter\|RouterProvider" apps/web/src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 4: Update zod in `packages/core/package.json`**

In dependencies:
```
"zod": "^3.22.4" → "zod": "^4.3.6"
```

Zod v4 has breaking changes. Search for usage:
```bash
grep -rn "z\.\|ZodSchema\|z\.object\|z\.string" packages/core/src/ apps/ --include="*.ts" --include="*.tsx" | head -30
```

Fix import paths and API changes.

- [ ] **Step 5: Update Stryker in `apps/web/package.json`**

In devDependencies:
```
"@stryker-mutator/core": "^8.7.1"           → "@stryker-mutator/core": "^9.6.1"
"@stryker-mutator/vitest-runner": "^8.7.1"   → "@stryker-mutator/vitest-runner": "^9.6.1"
```

- [ ] **Step 6: Update eslint-plugin-react-hooks in `apps/web/package.json`**

In devDependencies:
```
"eslint-plugin-react-hooks": "5.2.0" → "eslint-plugin-react-hooks": "7.0.1"
```

- [ ] **Step 7: Install and run gate**

```bash
pnpm install
pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke
```

Expected: All pass. Fix any breakage from API changes.

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json packages/core/package.json pnpm-lock.yaml
git add -u
git commit -m "chore(deps): upgrade i18next 26, lucide 1.8, react-router-dom 7, zod 4, Stryker 9"
```

---

### Task 21: Tailwind CSS 3 to 4

**Files:**
- Modify: `apps/web/package.json` (devDependencies)
- Modify: `apps/mobile/package.json` (devDependencies)
- Modify: `apps/web/tailwind.config.ts` (migrate to v4 format)
- Modify: `apps/mobile/tailwind.config.ts` (migrate to v4 format)
- Modify: `apps/web/postcss.config.*` (Tailwind v4 uses `@tailwindcss/postcss`)
- Modify: `apps/web/src/styles.css` (v4 uses `@import "tailwindcss"` instead of `@tailwind` directives)

- [ ] **Step 1: Update tailwindcss version in `apps/web/package.json`**

In devDependencies:
```
"tailwindcss": "^3.4.17"        → "tailwindcss": "^4.2.2"
"tailwindcss-animate": "^1.0.7" → remove (check if v4-compatible version exists, or replace)
"autoprefixer": "^10.4.27"      → remove (Tailwind v4 includes autoprefixer)
```

Add:
```
"@tailwindcss/postcss": "^4.2.2"
```

- [ ] **Step 2: Update tailwindcss version in `apps/mobile/package.json`**

In devDependencies:
```
"tailwindcss": "3.4.17" → "tailwindcss": "4.2.2"
```

Note: NativeWind 4.2.3 may NOT be compatible with Tailwind v4. If mobile breaks, revert mobile's tailwindcss to 3.4.17 and keep only web on v4. NativeWind v5 (preview) is required for Tailwind v4 support.

- [ ] **Step 3: Migrate web CSS entry point**

In `apps/web/src/styles.css`, replace `@tailwind` directives:
```css
/* Old (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```
with:
```css
/* New (v4) */
@import "tailwindcss";
```

- [ ] **Step 4: Migrate PostCSS config**

Update the web PostCSS config to use `@tailwindcss/postcss` instead of `tailwindcss`:
```js
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Remove `autoprefixer` — it's built into Tailwind v4.

- [ ] **Step 5: Migrate `apps/web/tailwind.config.ts` to v4 CSS-first format**

Tailwind v4 moves configuration to CSS. The `tailwind.config.ts` file is still supported via `@config` directive but the preferred approach is CSS-based. For a safe migration, keep the JS config and add `@config` in the CSS:

In `apps/web/src/styles.css`:
```css
@import "tailwindcss";
@config "../../tailwind.config.ts";
```

This preserves the existing design token integration without rewriting the config.

- [ ] **Step 6: Install and run gate**

```bash
pnpm install
pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke
```

If mobile tests fail due to NativeWind/Tailwind v4 incompatibility:
```bash
# Revert mobile to Tailwind 3
# In apps/mobile/package.json devDependencies:
# "tailwindcss": "3.4.17"
pnpm install
pnpm --filter @tasky/mobile test
```

Document the NativeWind v4/v5 decision in the PR description.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/mobile/package.json apps/web/src/styles.css apps/web/postcss.config.* apps/web/tailwind.config.ts pnpm-lock.yaml
git add -u
git commit -m "chore(deps): upgrade Tailwind CSS 3.4.17 → 4.2.2 (web), evaluate NativeWind v5 for mobile"
```

---

### Task 22: Postflight — Branch C

- [ ] **Step 1: Run all frontend gates**

```bash
pnpm -r typecheck && pnpm -r lint && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke && pnpm workspace:boundaries
```

Expected: All pass.

- [ ] **Step 2: Diff against baseline**

```bash
bash tooling/scripts/capture-baseline.sh
mv baseline.json postflight-cascade.json
diff <(jq -S . baseline.json) <(jq -S . postflight-cascade.json)
```

Verify: test counts >=, type/lint errors 0, e2eSmoke pass.

- [ ] **Step 3: Update CHANGELOG.md**

Add:
```
- chore: upgrade frontend cascade (React 19, React Native 0.85, Expo 55, Vite 8, TypeScript 6, Vitest 4, Jest 30, Tailwind 4, react-router-dom 7, zod 4, i18next 26)
```

- [ ] **Step 4: Commit, push, and open PR**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for frontend cascade dependency upgrade"
git push -u origin upgrade/frontend-cascade
gh pr create --title "chore: upgrade frontend cascade (React 19, Expo 55, Vite 8, TS 6, Tailwind 4)" --body "$(cat <<'EOF'
## Summary
- React 18.3.1 → 19.2.5, React Native 0.76.7 → 0.85.0, Expo SDK 52 → 55
- Firebase RN 23 → 24, Reanimated 3 → 4.3, safe-area-context 4 → 5.7
- Vite 5.4 → 8.0 (Rolldown), TypeScript 5.9 → 6.0
- Vitest 3.0 → 4.1, Jest 29.7 → 30.3
- i18next 25 → 26, react-router-dom 6 → 7, zod 3 → 4, lucide 0.575 → 1.8
- Tailwind CSS 3.4 → 4.2 (web), NativeWind evaluation documented

## Verification
All existing gates pass. Test counts match or exceed preflight baseline.

## Breakage encountered
[Document each breaking change and how it was resolved]

## NativeWind decision
[Document whether NativeWind stayed on v4 or upgraded to v5 preview]

## Baseline diff
[Paste diff output here]
EOF
)"
```

---

## Merge Sequence

After all three PRs are open and green:

### Step 1: Merge Branch B (frontend-safe)
```bash
gh pr merge upgrade/frontend-safe --merge
```

### Step 2: Rebase Branch A onto updated main, re-run postflight
```bash
git checkout upgrade/backend
git rebase main
./gradlew gateFull
gh pr merge upgrade/backend --merge
```

### Step 3: Rebase Branch C onto updated main, re-run postflight
```bash
git checkout upgrade/frontend-cascade
git rebase main
pnpm install
pnpm -r typecheck && pnpm -r test && pnpm --filter @tasky/web test:e2e:smoke
gh pr merge upgrade/frontend-cascade --merge
```

---

## Cleanup

After all three branches merge:

- [ ] Delete `baseline.json` and `postflight*.json` from main (they were only on branches)
- [ ] Verify main is green: `./gradlew gateSmoke && pnpm -r typecheck && pnpm -r test`
- [ ] Delete remote branches: `git push origin --delete upgrade/frontend-safe upgrade/backend upgrade/frontend-cascade`
