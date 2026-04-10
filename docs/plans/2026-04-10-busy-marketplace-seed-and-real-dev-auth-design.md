# Busy Marketplace Seed And Real Dev Auth Design

**Date:** 2026-04-10
**Status:** approved for execution

## Goal

Make the local Tasky environment look and behave like a populated Phase 1 marketplace by:

- replacing the thin schema-sample seed with a richer deterministic dataset
- making seeded customer and tasker identities loginable through the real backend `/api/v1/auth/dev/login` path
- turning local dev auth on by default while keeping production fail-closed
- removing every frontend runtime branch that fabricates tokens, fake profiles, fake caches, or fake success states
- shifting smoke and journey testing to the real backend instead of frontend-side auth/data mocks

## Problem Statement

The current local environment fails in three different ways.

### 1. The seed is broad but not useful for real user flows

`services/api/src/main/resources/db/migration/V19__seed_test_data.sql` inserts generic sample rows, but it does not seed stable login-ready people. In particular:

- seeded users do not have phone-backed identities that `AuthService.devLogin()` can attach to
- the dataset is evenly distributed row-count filler, not a believable marketplace state with active, past, and unhappy-path work
- several launch-live frontend journeys still depend on fixture-like personas rather than on the current seed

### 2. Local auth/data behavior is split between backend truth and frontend fiction

The repo already has a valid local-only backend auth path:

- `POST /api/v1/auth/dev/login`
- enabled only when `tasky.dev-auth.enabled=true`
- guarded by `AuthService.validateOtpConfiguration()` so startup fails outside `local` or `test`

But the clients do not consistently use it:

- web shows local quick-login buttons only behind `VITE_DEV_AUTH_ENABLED`
- mobile has runtime branches that fabricate `dev-access-token`, fake profiles, fake categories, empty query caches, and even fake task-submit success without hitting the backend
- web Playwright support currently intercepts `/api/v1/auth/dev/login` and other API calls instead of exercising the real backend

This means a developer can believe the app works locally while never proving the real backend path, the real seed, or the real data dependencies.

### 3. “Nothing is seeded” can be true even when rows exist

There are multiple reasons a local developer may not see seeded information:

- the existing seed is not shaped around the logged-in user
- frontend dev branches can short-circuit the backend and preload empty data
- local Docker currently defaults backend dev auth off, so persona login is unavailable unless toggled on
- Flyway will not rerun a changed `V19` on an already-migrated volume, so a stale local DB can keep an outdated seed forever

The user has explicitly said the local DB can be wiped. That lets us replace `V19` in place and optimize for a clean local bootstrap instead of carrying a repair migration for an empty sandbox.

## Product And Technical Constraints

### Product constraints

- Phase 1 remains the source of truth. No launch-live claim is added for email/password.
- Facebook OAuth remains the real product auth path.
- Local-only developer auth is acceptable as a testing tool, but only if it hits the real backend and is impossible to enable accidentally in production.

### Technical constraints

- Follow the API-first posture already in the repo.
- Preserve production safety: `application-prod.yml` must stay hard-disabled for dev auth, and startup must still fail if someone tries to override that outside `local`/`test`.
- Do not rely on frontend-generated fake data to render non-empty states.
- Do not require manual SQL after `docker compose up` for the normal local bootstrap.
- The user is willing to wipe the local database, so replacing `V19` is acceptable.

## Source Of Truth

Use this order when implementation details conflict:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/API.yaml`
4. module `AGENTS.md` files under `services/api/src/main/java/mn/tasky/`
5. existing backend runtime behavior under `services/api/src/main/java/mn/tasky/`
6. existing local/staging operational docs under `docs/maintenance/`

## Current Failure Analysis

### Backend auth reality

The backend already has the correct shape for local dev auth:

- `DevAuthController` exposes `/api/v1/auth/dev/login`
- `AuthService.devLogin()` resolves a user by phone blind index, creates one if absent, updates role if requested, and issues a normal JWT-backed session
- `AuthService.validateOtpConfiguration()` already throws if dev auth is enabled outside `local` or `test`

That is the right direction. The missing piece is better persona seeding and stricter client behavior.

### Seed/login mismatch

The backend auth flow can reuse seeded users only if the seed populates `users.phone_blind_idx` with the same HMAC strategy as `CryptoService.blindIndex()`.

The repo does not currently seed that linkage in a useful way.

To keep secrets out of versioned SQL:

- the migration should compute `phone_blind_idx` inside PostgreSQL from the runtime blind-index key
- the migration should not try to precompute encrypted `users.phone`
- the first real backend dev login should backfill `users.phone` for a seeded identity when the blind index matches but the encrypted phone is still null

### Frontend fake-runtime inventory

The current runtime shortcuts that must be removed include:

- mobile `useDevLogin()` fabricating fake tokens and fake cached data
- mobile task-review submit short-circuit that skips the API entirely
- any other `EXPO_PUBLIC_DEV_AUTH_ENABLED` branch that returns fake state instead of calling the backend

The acceptable local shortcut after this work is:

- a visible login button that triggers a real HTTP call to `/api/v1/auth/dev/login`

### Testing drift

Current e2e/smoke posture still includes frontend-side interception:

- web Playwright support mocks `/api/v1/auth/dev/login`
- web journey specs mock task/category flows rather than using the real seeded backend
- mobile Maestro docs still describe “dev auth bypass” in a way that implies fake runtime behavior

Unit tests can keep local mocks for isolated component logic. Backend-backed journey and smoke tests should not.

## Chosen Approach

Use one coordinated tranche that changes the local experience end to end.

### 1. Replace `V19` with a deterministic busy-marketplace seed

Rewrite `services/api/src/main/resources/db/migration/V19__seed_test_data.sql` as a richer local/dev dataset with stable IDs, names, phones, and cross-table relationships.

The new seed should model a believable Phase 1 marketplace:

- canonical customers with task history
- canonical taskers with different trust/reliability states
- a spread of open, assigned, completed, cancelled, and no-show tasks/bookings
- multiple categories and districts represented
- applicant pools for open tasks
- active conversations and message history
- completed bookings with bilateral reviews
- disputes and evidence records
- notifications and analytics rows
- enough wallet/payment rows to keep read-heavy admin/support surfaces non-empty without activating monetization

The dataset should not be “10 rows per table”. It should be scenario-shaped.

### 2. Make seeded personas real-backend loginable

Seed stable phone numbers for the main local personas and derive `phone_blind_idx` in the migration.

Recommended local personas:

- at least one seeded customer for browse/post/manage flows
- at least one seeded tasker for feed/apply/job flows
- optionally one seeded admin operator account for backend-backed admin smoke

Admin handling should stay local-only:

- if admin backend-backed smoke remains in scope, allow `ADMIN` through backend dev auth only in `local`/`test`
- keep admin login out of the normal customer/tasker UI
- use programmatic dev-auth login for admin smoke tests rather than a frontend-only fake path

### 3. Make local dev auth default-on, production fail-closed

The local posture should become:

- `application-local.yml`: dev auth enabled by default
- `docker-compose.yml`: local app service defaults `TASKY_DEV_AUTH_ENABLED=true`
- local web build defaults its quick-login buttons on

Production posture remains:

- `application-prod.yml`: `tasky.dev-auth.enabled: false`
- startup guard remains active and tested

This gives two layers of protection:

1. configuration defaults keep local friction low
2. runtime startup failure prevents accidental prod enablement

### 4. Remove all frontend fake-runtime behavior

Keep local login shortcuts only if they hit the real backend.

Required runtime cleanup:

- mobile `useDevLogin()` always calls `api.devLogin()`
- mobile removes fake token/profile/category/query-cache seeding
- mobile task-submit and similar flows stop short-circuiting success locally
- web keeps local quick-login buttons only as UI wrappers around the real backend endpoint

After this change, if a screen is empty in local dev, it should be empty because the backend data is empty or filtered that way, not because the frontend invented placeholder state.

### 5. Move smoke/journey verification onto the real backend

For app-level verification:

- web Playwright journeys should authenticate against the real backend dev-auth endpoint and use real API responses
- mobile Maestro flows should do the same
- admin smoke may authenticate programmatically against the real dev-auth backend if no user-facing admin login screen exists

For isolated unit tests:

- component-level mocks remain acceptable where the test is not claiming integration truth
- tests that claim journey/runtime behavior should stop relying on mocked auth/data paths

## Seed Shape

The new dataset should cover the launch-live Phase 1 lifecycle, not future monetization promises.

### Identity

- named customer and tasker personas with stable UUIDs and phone numbers
- profile names, avatar URLs, ratings, completed-task counts
- at least one pending-verification tasker and one verified/pro-level tasker
- optional local-only admin identity if needed for backend-backed admin smoke

### Marketplace

- open tasks across several categories and districts
- tasks already assigned to a tasker
- completed tasks with review history
- cancelled/no-show tasks for unhappy-path visibility
- application pools that let customers review multiple applicants

### Communication

- conversations tied to active and completed bookings
- enough messages to make inbox/detail screens meaningful

### Trust and safety

- verification rows
- disputes, evidence, and moderation-ready records
- review enforcement/support artifacts where the current schema supports them

### Ops/read-heavy surfaces

- notification logs
- analytics events
- feature-toggle and wallet/payment-adjacent rows only to the extent they support current Phase 1 operator visibility, not to imply later-phase activation

## Implementation Notes

### Blind-index derivation in SQL

The migration should compute `phone_blind_idx` from the configured blind-index key at migrate time.

That implies:

- enable `pgcrypto` if needed for HMAC support
- decode the runtime base64 blind-index key in SQL
- compute the exact base64-encoded HMAC-SHA256 string expected by `CryptoService.blindIndex()`

### Phone backfill on first login

Because the encrypted phone value should not be hardcoded in SQL:

- `AuthService.ensureUser()` should detect an existing blind-index match with missing encrypted phone
- it should encrypt the supplied phone and persist it via existing DAO support
- the resulting session/profile should then look like a normal real backend login

This keeps the seed repo-safe while still making the personas fully usable.

## Risks And Mitigations

### Risk: local seed becomes stale or too synthetic

Mitigation:

- shape it around user journeys, not equal row counts
- document the canonical local personas and intended flows

### Risk: dev auth leaks beyond local/test

Mitigation:

- keep `application-prod.yml` hardcoded off
- preserve and extend startup safety tests
- make docs explicit about local-only usage

### Risk: frontend e2e becomes less deterministic

Mitigation:

- use deterministic seeded identities and seeded base data
- programmatically log in through the real backend when needed
- keep narrow unit tests mocked, but not smoke/journey tests

### Risk: replacing `V19` only helps fresh databases

Mitigation:

- explicitly document that this tranche assumes developers wipe the local DB volume
- verify with a clean `docker compose down -v` bootstrap path

## Verification Strategy

The tranche is not complete until all of the following are proven:

1. Clean local bootstrap:
   - wipe local volumes
   - start Docker stack
   - confirm Flyway applies the replaced `V19`
2. Real backend dev login:
   - customer login succeeds against `/api/v1/auth/dev/login`
   - tasker login succeeds against `/api/v1/auth/dev/login`
   - optional admin login succeeds only if local-only admin support is added
3. Seed visibility:
   - authenticated customer sees non-empty customer-relevant data
   - authenticated tasker sees non-empty tasker-relevant data
4. Safety:
   - production profile still rejects dev auth enablement at startup
5. Frontend runtime truth:
   - no fake token/profile/query-cache/task-submit branches remain
6. Backend-backed smoke:
   - web and mobile smoke paths authenticate and render using the real backend

## Success Criteria

This work is successful when:

- `docker compose up` on a wiped local DB produces a visibly populated marketplace
- local customer/tasker dev login uses the real backend and lands on meaningful data
- no frontend runtime branch fabricates auth or domain data
- local-on/prod-safe dev-auth posture is enforced by config and tests
- smoke/journey verification proves real backend behavior rather than frontend mocks

## Non-Goals

- adding email/password login
- changing the Phase 1 product auth baseline
- activating monetization or later-phase product surfaces
- making staging or production depend on dev auth
