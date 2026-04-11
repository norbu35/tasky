# CI Pipeline Redesign — Design Spec

> **For agentic workers:** This is a design spec. Use `superpowers:writing-plans` to create the implementation plan.

**Goal:** Make the GitHub quality gate authoritative, complete, and blocking. Make the local pre-push hook fast (~55s) but covering 90% of the CI gate. Eliminate redundancies across pre-commit, pre-push, and CI.

**Scope:** Pre-commit hooks, pre-push hooks, GitHub Actions workflows (quality-gates, nightly-regression), CVE remediation, Dependabot enablement, E2E infrastructure.

---

## 1. Three-Layer Pipeline

Each layer has a clear purpose. No check runs in more than one layer unless it must (e.g., migrations in both pre-push and CI because CI runs against the merge commit, which may differ from what was pushed).

### 1.1 Pre-commit (~3s)

Formatting only. No compilation, no tests, no network.

| Tool                  | Scope                         |
| --------------------- | ----------------------------- |
| Prettier              | TS, TSX, JSON, YAML, CSS, MD  |
| ESLint                | TS/TSX (via lint-staged)      |
| Spotless              | Java (Palantir format)        |
| Commit-msg validation | `type(scope): summary` format |

**Change:** Fix the hardcoded ESLint path in `.lintstagedrc.json` from `./apps/mobile/node_modules/.bin/eslint` to `eslint` resolved from the workspace root.

### 1.2 Pre-push (~55s)

Structural correctness plus fast tests. Catches 90% of CI failures before a push.

| Check                | Tool                                             | Est. time |
| -------------------- | ------------------------------------------------ | --------- |
| TypeScript errors    | `pnpm -r typecheck`                              | ~5s       |
| Workspace boundaries | `pnpm workspace:boundaries`                      | ~1s       |
| Migration safety     | `python3 tooling/scripts/validate-migrations.py` | ~1s       |
| API contract         | `./gradlew openApiValidate -q`                   | ~8s       |
| Lint                 | `pnpm -r lint`                                   | ~8s       |
| SDK drift            | `pnpm sdk:drift`                                 | ~5s       |
| Web unit tests       | `pnpm --filter @tasky/web test:unit`             | ~10s      |
| Mobile unit tests    | `pnpm --filter @tasky/mobile test:unit`          | ~13s      |

**New additions vs. current:** lint, SDK drift, web unit tests, mobile unit tests.

**Intentionally excluded (CI-only):**

- Backend Java tests (need Testcontainers/Postgres)
- E2E tests (need full stack)
- Security scans (Trivy, Semgrep, Scorecard)
- Java static analysis (Checkstyle, PMD, SpotBugs)
- Mutation testing (nightly only)

### 1.3 CI Quality Gates (PR gate, ~8-15 min)

Authoritative final gate. All jobs block merge. No `continue-on-error`, no `exit-code: '0'` on anything except container scan (temporarily, until Spring Security upgrade).

Triggered on: `pull_request`, `workflow_dispatch`.

---

## 2. CI Job Definitions

Six jobs, zero overlap, all blocking.

### 2.1 `structural-gate` (~2 min, ubuntu-latest)

Structural checks that are not tests and not compilation.

1. SDK contract drift validation (`tooling/scripts/validate-sdk-contract-drift.sh`)
2. Workspace boundary validation (`pnpm workspace:boundaries`)
3. Migration safety validation (`python3 tooling/scripts/validate-migrations.py`)

**Removed from this job vs. current `cleanup-gate`:**

- `pnpm -r typecheck` — moved to `frontend-quality`
- `gateSmoke` (backend tests) — moved to `backend-quality`
- `openApiValidate` — moved to `backend-quality`

### 2.2 `backend-quality` (~5 min, ubuntu-latest)

Java compilation, static analysis, tests, coverage, and API contract in one job.

1. `./gradlew check jacocoTestCoverageVerification openApiValidate` — compiles + Checkstyle + PMD + SpotBugs + ErrorProne + unit tests + 80% line coverage + API contract (single Gradle invocation, tests run once)

### 2.3 `frontend-quality` (~3 min, ubuntu-latest)

TypeScript compilation, linting, and unit tests.

1. `pnpm -r typecheck`
2. `pnpm -r lint`
3. `pnpm -r test` — vitest (web, 264 tests) + jest (mobile, 741 tests)

### 2.4 `e2e-web` (~8 min, ubuntu-latest)

Playwright smoke tests against a live backend with real Facebook OAuth.

1. Start full stack: `docker compose up -d postgres minio minio-bootstrap`
2. Build backend: `./gradlew --no-daemon :services:api:bootJar`
3. Start backend: `java -jar services/api/build/libs/*.jar &`
4. Wait for health check: poll `/actuator/health` until ready
5. Build web app: `pnpm --filter @tasky/web build` (with `VITE_DEV_AUTH_ENABLED=false`)
6. Run Playwright smoke: `pnpm --filter @tasky/web test:e2e:smoke`

**Secrets required:**

- `FACEBOOK_TEST_APP_ID` — from dedicated "Tasky CI Test" Facebook app
- `FACEBOOK_TEST_APP_SECRET` — same app
- Injected as environment variables into the backend process

### 2.5 `e2e-android` (~15 min, ubuntu-latest)

Maestro smoke tests on Android emulator against a live backend.

1. Start full stack (same as e2e-web)
2. Build and start backend (same as e2e-web)
3. Enable KVM acceleration for Android emulator
4. Build Android app via Expo: `pnpm --filter @tasky/mobile exec expo run:android --variant release`
5. Boot Android emulator
6. Install Maestro CLI
7. Run Maestro smoke flows: `pnpm --filter @tasky/mobile test:e2e:smoke`

**Secrets required:** Same Facebook test app credentials.

### 2.6 `security` (~4 min, ubuntu-latest)

All security checks. All blocking (except container scan temporarily).

1. **Trivy filesystem scan** — `exit-code: '1'`, `severity: HIGH,CRITICAL`, `ignore-unfixed: true`. Passes because npm CVEs are fixed via pnpm overrides.
2. **Trivy container scan** — `exit-code: '0'` temporarily. Uses `.trivyignore` with expiry dates for Spring Security CVEs. Becomes `exit-code: '1'` after backend Spring upgrade.
3. **Semgrep SAST** — OWASP Top 10, Java rules, custom `tasky-rules.yaml`.
4. **OpenSSF Scorecard** — `ossf/scorecard-action`. Non-blocking (informational). Outputs annotations and repo score. Stays informational permanently — it's a hygiene audit, not a merge gate.
5. **Trivyignore expiry check** — a shell step that parses `.trivyignore` for `# Expires:` comments and fails if any entry is past its date. Enforces human-managed expiry since Trivy itself ignores the comments.

**Removed:** `actions/dependency-review-action@v4` (requires GHAS, not available on free tier). Dependabot + Trivy cover the same ground.

---

## 3. Nightly Regression

Split into two schedules to stay within free tier.

### 3.1 Every night (ubuntu-only, ~20 min)

Cron: `0 2 * * *`

1. **full-regression** — `pnpm -r typecheck`, `pnpm -r test`, `./gradlew gateRegression openApiValidate`, container build + Trivy scan. Uses `gateRegression` (not `gateFull`) because `gateFull` has pre-existing mutation floor gaps in analytics (0% < 40%), messaging (18% < 40%), notification (4% < 40%) tracked in the test-rehab-backlog. Upgrade to `gateFull` once those domains meet their mutation floors.
2. **web-e2e-regression** — full Playwright suite (all tests, not just `@smoke`)

### 3.2 Monday + Thursday nights (macOS, ~15 min)

Cron: `0 2 * * 1,4`

1. **e2e-ios** — starts full stack (Postgres + MinIO + backend JAR, same as `e2e-web`), boots iOS simulator, builds iOS release app via Expo, installs Maestro CLI, runs Maestro smoke flows against live backend. Facebook test app credentials from GitHub secrets.

**Cost estimate:** ~135 macOS min/month (free tier allows 200).

---

## 4. CVE Remediation

### 4.1 Immediate: pnpm overrides

Add `pnpm.overrides` in root `package.json` to pin transitive deps to patched versions:

```json
{
  "pnpm": {
    "overrides": {
      "minimatch@<3.1.3": ">=3.1.3",
      "tar@<7.5.11": ">=7.5.11",
      "undici@<6.24.0": ">=6.24.0",
      "@xmldom/xmldom@<0.9.9": ">=0.9.9",
      "node-forge@<1.4.0": ">=1.4.0",
      "picomatch@<2.3.2": ">=2.3.2"
    }
  }
}
```

Run `pnpm install` to regenerate lockfile. Verify locally: `trivy fs . --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed`.

### 4.2 Temporary: .trivyignore for Spring Security

Create `.trivyignore` at repo root with expiry comments:

```
# Spring Security — blocked until backend upgrade (target: 2026-05-15)
CVE-2025-41232
CVE-2026-22732
CVE-2025-41248
CVE-2025-22228
CVE-2025-22235
CVE-2025-41249
```

Remove entries and set container scan `exit-code: '1'` after Spring Boot upgrade merges.

### 4.3 Ongoing: Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      minor-and-patch:
        update-types: [minor, patch]
    labels: [dependencies, auto]

  - package-ecosystem: gradle
    directory: /services/api
    schedule:
      interval: weekly
    labels: [dependencies, auto]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels: [ci, auto]
```

---

## 5. E2E Infrastructure

### 5.1 Facebook Test App

Create a dedicated Facebook app "Tasky CI Test" with:

- App Domain: user's current domain
- Valid OAuth Redirect URIs: `http://localhost:8080/api/v1/auth/facebook/callback`
- Test users created in the Facebook developer console for deterministic E2E flows

Store credentials as GitHub repository secrets:

- `FACEBOOK_TEST_APP_ID`
- `FACEBOOK_TEST_APP_SECRET`

### 5.2 Backend in CI

The E2E jobs (`e2e-web`, `e2e-android`, `e2e-ios`) start the full stack via docker-compose. The backend Spring Boot app runs as a foreground process with a CI-specific profile:

```
java -jar services/api/build/libs/*.jar \
  --spring.profiles.active=ci \
  --tasky.facebook.app-id=$FACEBOOK_TEST_APP_ID \
  --tasky.facebook.app-secret=$FACEBOOK_TEST_APP_SECRET
```

The `ci` Spring profile configures:

- Database URL pointing to the docker-compose Postgres
- MinIO endpoint pointing to the docker-compose MinIO
- Facebook OAuth credentials from environment
- Flyway auto-migration on startup

---

## 6. Redundancy Elimination

### What was removed

| Check                | Was in                                         | Now in                     |
| -------------------- | ---------------------------------------------- | -------------------------- |
| `pnpm -r typecheck`  | cleanup-gate + frontend-quality                | frontend-quality only      |
| Backend tests        | cleanup-gate (via gateSmoke) + backend-quality | backend-quality only       |
| `openApiValidate`    | cleanup-gate + backend-quality + pre-push      | backend-quality + pre-push |
| Workspace boundaries | cleanup-gate + pre-push                        | structural-gate + pre-push |
| Migration validation | pre-push + cleanup-gate                        | structural-gate + pre-push |

### Pre-push vs CI overlap (intentional)

Pre-push runs typecheck, lint, boundaries, migrations, OpenAPI, SDK drift, and unit tests. CI runs them again on the merge commit. This is intentional: the merge commit may introduce issues that the branch alone did not have. The cost is ~3 min of CI time, which is acceptable for the guarantee.

---

## 7. Summary of Files to Create or Modify

| File                                                 | Action                                    |
| ---------------------------------------------------- | ----------------------------------------- |
| `.lintstagedrc.json`                                 | Fix hardcoded ESLint path                 |
| `.husky/pre-push`                                    | Add lint, SDK drift, unit tests           |
| `.github/workflows/quality-gates.yml`                | Rewrite: 6 jobs, no overlap, all blocking |
| `.github/workflows/nightly-regression.yml`           | Split schedules, add Android E2E          |
| `.github/dependabot.yml`                             | Create                                    |
| `.trivyignore`                                       | Create with Spring CVEs + expiry          |
| `package.json`                                       | Add `pnpm.overrides` for npm CVEs         |
| `pnpm-lock.yaml`                                     | Regenerate after overrides                |
| `services/api/src/main/resources/application-ci.yml` | Create CI Spring profile                  |
| `.github/workflows/release-gate.yml`                 | Update E2E jobs to match new structure    |
| `tooling/scripts/check-trivyignore-expiry.sh`        | Create expiry enforcement script          |
| Facebook developer console                           | Create "Tasky CI Test" app (manual)       |
| GitHub repository settings                           | Add secrets (manual)                      |
