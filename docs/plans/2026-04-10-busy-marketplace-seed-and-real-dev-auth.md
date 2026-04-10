# Busy Marketplace Seed And Real Dev Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the local seed with a deterministic busy-marketplace dataset, make local dev auth real-backend-only and default-on in `local`, remove frontend fake runtime paths, and move smoke verification onto the real backend.

**Architecture:** Backend remains the source of truth for local developer authentication through `/api/v1/auth/dev/login`. The new `V19` migration seeds scenario-shaped marketplace data and loginable phone blind indexes, while `AuthService` backfills encrypted phones on first real login. Web and mobile keep local quick-login affordances only as thin UI wrappers around the backend endpoint, and smoke paths stop fabricating auth/data in frontend code.

**Tech Stack:** PostgreSQL/Flyway/PLpgSQL/pgcrypto, Java 21/Spring Boot/JDBI, React/Vite, React Native/Expo, Playwright, Maestro.

---

**Execution discipline:** Use `@test-driven-development` for behavior changes and `@verification-before-completion` before claiming the tranche is done.

### Task 1: Tighten backend dev-auth safety and seeded-user backfill

**Files:**

- Modify: `services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/dto/DevLoginRequest.java`
- Modify: `services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java` only if request validation or role handling needs expansion

**Step 1: Write the failing unit tests**

Add tests that prove:

- `SCN-AUTH-001` still fails when dev auth is enabled in a production-like profile
- local/test profile accepts dev auth startup validation
- `devLogin()` backfills encrypted `phone` when a seeded user exists by `phone_blind_idx` but `phone` is null
- if local admin dev auth is added, unsupported-role validation becomes `CUSTOMER|TASKER|ADMIN` in local/test only

Example skeleton:

```java
@Test
@DisplayName("SCN-AUTH-001: Local profile permits dev auth startup validation")
void localProfileAllowsDevAuth() { ... }

@Test
@DisplayName("SCN-AUTH-001: Dev login backfills encrypted phone for seeded blind-index match")
void devLoginBackfillsSeededPhone() { ... }
```

**Step 2: Run the targeted auth tests and confirm failure**

Run:

```bash
./gradlew :services:api:test --tests mn.tasky.auth.AuthScenarioTests
```

Expected:

- new tests fail because the current implementation does not backfill seeded phones and may not yet cover the local-allowed assertion

**Step 3: Implement the minimal backend changes**

- update `AuthService.ensureUser()` so an existing blind-index match with missing encrypted `phone` is repaired using `userDao.updatePhoneAndBlindIndex(...)`
- keep the current prod fail-closed startup guard intact
- if admin real-backend smoke is required, expand backend dev-auth role validation carefully and keep it local/test-only by virtue of the existing startup gate

**Step 4: Re-run the targeted auth tests**

Run:

```bash
./gradlew :services:api:test --tests mn.tasky.auth.AuthScenarioTests
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java \
        services/api/src/main/java/mn/tasky/auth/application/AuthService.java \
        services/api/src/main/java/mn/tasky/auth/dto/DevLoginRequest.java \
        services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java
git commit -m "fix(auth): harden local dev login safety"
```

### Task 2: Replace `V19` with a scenario-shaped busy-marketplace seed

**Files:**

- Modify: `services/api/src/main/resources/db/migration/V19__seed_test_data.sql`
- Optionally modify: `services/api/src/main/resources/db/migration/V1__initial_schema.sql` only if extension placement is cleaner there and the DB-reset assumption is explicitly honored

**Step 1: Write the migration inventory and target rows**

In the migration comments and working notes, define the canonical local personas and seed states:

- customer(s), tasker(s), optional admin
- open/assigned/completed/cancelled/no-show tasks
- applicant pools
- bookings, conversations, messages, reviews, disputes, notifications, analytics, and read-heavy ops rows

Use stable UUIDs and explicit narrative comments instead of anonymous loops.

**Step 2: Write the replacement migration**

Implementation requirements:

- use deterministic UUIDs and stable phone numbers
- seed `phone_blind_idx` using SQL HMAC compatible with `CryptoService.blindIndex()`
- do not hardcode encrypted `phone`
- keep the migration idempotent enough for clean local rebuilds and readable enough for review
- shape the dataset around journeys, not flat row counts

**Step 3: Rebuild a clean local database and run migrations**

Run:

```bash
docker compose down -v
docker compose up -d postgres pgbouncer minio minio-bootstrap
./gradlew :services:api:flywayMigrate
```

Expected:

- clean database comes up
- Flyway applies the new `V19`
- no FK or extension errors occur

**Step 4: Verify seeded shape directly**

Run representative checks such as:

```bash
psql postgresql://tasky:tasky@localhost:5432/tasky -c "select role, status, count(*) from users group by 1,2 order by 1,2;"
psql postgresql://tasky:tasky@localhost:5432/tasky -c "select status, count(*) from tasks group by 1 order by 1;"
psql postgresql://tasky:tasky@localhost:5432/tasky -c "select status, count(*) from bookings group by 1 order by 1;"
psql postgresql://tasky:tasky@localhost:5432/tasky -c "select count(*) from conversations;"
```

Expected:

- multiple roles/states visible
- non-empty task and booking states across happy and unhappy paths

**Step 5: Commit**

```bash
git add services/api/src/main/resources/db/migration/V19__seed_test_data.sql \
        services/api/src/main/resources/db/migration/V1__initial_schema.sql
git commit -m "feat(db): seed a busy local marketplace"
```

### Task 3: Make local dev auth default-on and prod fail-closed by configuration

**Files:**

- Modify: `services/api/src/main/resources/application-local.yml`
- Modify: `services/api/src/main/resources/application-prod.yml` only if comments or explicitness need tightening
- Modify: `docker-compose.yml`
- Modify: `apps/web/Dockerfile`
- Modify: `.env.example` if local quick-start defaults need to be explicit

**Step 1: Write the failing configuration expectations**

Document and, where feasible, codify:

- local profile defaults dev auth on
- prod keeps it off
- Docker local defaults to real backend dev auth
- web Docker build exposes quick-login buttons locally

If an integration/config test exists, extend it. If not, capture this in precise smoke verification commands in the plan execution.

**Step 2: Apply the config changes**

- set `tasky.dev-auth.enabled` default to true in `application-local.yml`
- keep `application-prod.yml` hardcoded false
- set `TASKY_DEV_AUTH_ENABLED` default to true in `docker-compose.yml`
- set `VITE_DEV_AUTH_ENABLED` default to true for the local Docker-built web image

**Step 3: Boot the local stack and prove the endpoint exists**

Run:

```bash
docker compose down -v
docker compose up --build -d
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+97699000001","role":"CUSTOMER"}'
```

Expected:

- JSON response with `access_token`, `refresh_token`, and `user`

**Step 4: Prove production still fails closed**

Run a targeted test or startup simulation that exercises the existing `SCN-AUTH-001` guard.

Minimum required proof:

```bash
./gradlew :services:api:test --tests mn.tasky.auth.AuthScenarioTests
```

Expected:

- production-like enablement still throws

**Step 5: Commit**

```bash
git add services/api/src/main/resources/application-local.yml \
        services/api/src/main/resources/application-prod.yml \
        docker-compose.yml \
        apps/web/Dockerfile \
        .env.example
git commit -m "chore(local): default dev auth on in local only"
```

### Task 4: Remove frontend fake runtime auth and fake cached data

**Files:**

- Modify: `apps/mobile/src/features/auth/hooks/useAuth.ts`
- Modify: `apps/mobile/src/app/(customer)/tasks/new/review.tsx`
- Modify: `apps/mobile/src/app/(auth)/index.tsx`
- Modify: `apps/mobile/src/features/auth/components/LoginForm.tsx`
- Modify: `apps/web/src/pages/AuthPage.tsx`
- Create or modify: shared local persona constants file if needed, for example `packages/core/src/dev-auth-personas.ts`
- Modify: related mobile/web tests that currently assert fake-runtime behavior

**Step 1: Write the failing frontend tests**

Cover the real-backend-only rule:

- mobile `useDevLogin()` calls `api.devLogin()` instead of returning fake tokens
- no mobile task-submit path skips the API because of local env flags
- login buttons still render when local dev auth visibility is on, but they no longer imply fake data

Example skeleton:

```ts
it('calls api.devLogin for local quick login', async () => {
  await mutation.mutateAsync({ phone: '+97699000001', role: 'CUSTOMER' });
  expect(api.devLogin).toHaveBeenCalledWith('+97699000001', 'CUSTOMER');
});
```

**Step 2: Run the targeted frontend tests and confirm failure**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand useAuth
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/web test -- Auth
```

Expected:

- failures where the current mobile code still fabricates tokens/caches

**Step 3: Remove fake-runtime branches**

- delete fake token/profile/category/query-cache seeding from mobile `useDevLogin()`
- remove the review-submit local short-circuit
- keep quick-login buttons as real backend callers only
- unify web/mobile seeded phone constants so the same local personas are used consistently

**Step 4: Re-run the targeted tests**

Run:

```bash
pnpm --filter @tasky/mobile test -- --runInBand useAuth
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/web test -- Auth
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add apps/mobile/src/features/auth/hooks/useAuth.ts \
        apps/mobile/src/app/(customer)/tasks/new/review.tsx \
        apps/mobile/src/app/(auth)/index.tsx \
        apps/mobile/src/features/auth/components/LoginForm.tsx \
        apps/web/src/pages/AuthPage.tsx \
        packages/core/src/dev-auth-personas.ts \
        apps/mobile/__tests__ \
        apps/web/tests
git commit -m "refactor(frontend): remove fake local auth data paths"
```

### Task 5: Move web smoke tests from mocked auth/data to the real backend

**Files:**

- Modify: `apps/web/e2e/support/mockApi.ts`
- Modify: `apps/web/e2e/customer-happy-path.spec.ts`
- Modify: `apps/web/e2e/tasker-happy-path.spec.ts`
- Modify: `apps/web/e2e/admin-happy-path.spec.ts`
- Modify: `apps/web/package.json`
- Modify: `apps/web/playwright.config.ts` if backend URL/bootstrap changes are required

**Step 1: Replace mocked auth bootstrap with real-backend auth helpers**

Create helpers that:

- call the real backend `/api/v1/auth/dev/login`
- persist the returned session the same way the web app expects
- optionally seed admin auth programmatically if admin UI login is out of scope

Do not intercept `/api/v1/auth/dev/login` in Playwright route handlers anymore.

**Step 2: Remove mocked task/category journey data where the seed should supply it**

- customer flow should create/see real tasks
- tasker flow should browse/apply against real seeded/open tasks
- admin flow should read real backend data or use targeted backend setup calls, not frontend intercepts

**Step 3: Run smoke against the real local stack**

With Docker stack running:

```bash
pnpm --filter @tasky/web test:e2e:smoke
```

Expected:

- Playwright smoke passes against the live backend

**Step 4: Clean up or demote mock helpers**

- keep only mock helpers still needed for narrow non-backend tests
- remove any helper that pretends to prove runtime auth/data behavior

**Step 5: Commit**

```bash
git add apps/web/e2e/support/mockApi.ts \
        apps/web/e2e/customer-happy-path.spec.ts \
        apps/web/e2e/tasker-happy-path.spec.ts \
        apps/web/e2e/admin-happy-path.spec.ts \
        apps/web/package.json \
        apps/web/playwright.config.ts
git commit -m "test(web): run smoke flows against the real backend"
```

### Task 6: Align mobile Maestro/docs and local guidance with real-backend dev auth

**Files:**

- Modify: `apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml`
- Modify: `apps/mobile/maestro/flows/_support/login-customer.yaml`
- Modify: `apps/mobile/maestro/flows/_support/login-tasker.yaml`
- Modify: `apps/mobile/maestro/flows/capture-auth-screens.yaml`
- Modify: `README.md`
- Modify: `docs/maintenance/STAGING_RUNBOOK.md`
- Modify: `docs/maintenance/STAGING_TOGGLE_POSTURE.md`
- Modify: `docs/maintenance/STAGING_SEED_DATA.md`
- Modify: `CHANGELOG.md`

**Step 1: Update the flow/docs language**

Replace wording that implies:

- frontend-only bypass
- fake tokens
- fake cache seeding

with wording that states:

- local quick-login uses the real backend dev-auth endpoint
- staging/private sandbox uses real backend dev auth only where intended

**Step 2: Verify mobile smoke prerequisites now describe the real backend**

Run:

```bash
rg -n "fake token|fakeProfile|fakeCategories|bypass|skip API call" apps/mobile docs README.md
```

Expected:

- no stale runtime guidance remains, aside from clearly-scoped historical notes if intentionally preserved

**Step 3: Run final repo verification**

Run:

```bash
./gradlew :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
./gradlew :services:api:gateSmoke
```

If environment supports it, also run:

```bash
pnpm --filter @tasky/web test:e2e:smoke
cd apps/mobile && ./scripts/run-e2e-smoke.sh
```

Expected:

- backend tests pass
- frontend typecheck/tests pass
- smoke gate passes
- backend-backed smoke is green or any remaining gap is explicitly documented

**Step 4: Commit**

```bash
git add apps/mobile/maestro/flows/JRN-SHARED-01-onboarding.yaml \
        apps/mobile/maestro/flows/_support/login-customer.yaml \
        apps/mobile/maestro/flows/_support/login-tasker.yaml \
        apps/mobile/maestro/flows/capture-auth-screens.yaml \
        README.md \
        docs/maintenance/STAGING_RUNBOOK.md \
        docs/maintenance/STAGING_TOGGLE_POSTURE.md \
        docs/maintenance/STAGING_SEED_DATA.md \
        CHANGELOG.md
git commit -m "docs(local): align runtime and smoke guidance with real dev auth"
```
