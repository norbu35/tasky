# Tasky Monorepo — Consolidated Remediation Plan

> Compiled from two independent audits (gpt1.md, gpt2.md) on 2026-04-21.
> Items are grouped by tranche (execution order) and ranked by severity within each tranche.
> Effort codes: S = hours, M = 1–3 days, L = 1+ week.

---

## Tranche 1 — Trust Restoration (do first, unblocks everything else)

These items make the repo untruthful. They compound the cost of every subsequent
change and mislead operators, reviewers, and new engineers.

### 1.1 Repair broken live-doc references [S]

**Severity: High**

Active docs reference artifacts that do not exist:

- `docs/API.yaml` → `docs/quality/capability-matrix.md`, `docs/quality/launch-baseline-2026-04.md`
- `docs/maintenance/PRODUCTION_READINESS.md` → `docs/quality/staging-rehearsal-2026-04.md`, `docs/quality/launch-baseline-2026-04.md`, `docs/quality/test-trust-audit.md`
- `tests/registry.yaml` → `docs/quality/test-rehab-backlog.md`
- `tooling/scripts/check-cleanup-gate.sh` → same absent test-trust audit

Fix: create stub files or remove the dead references. Do not let live docs point to nothing.

### 1.2 Fix or remove broken tooling scripts [S]

**Severity: High**

`tooling/scripts/check-spec-drift.mjs`, `tooling/scripts/parse_yaml.py`, and
`tooling/scripts/generate-prompts.js` all reference `docs/design/screen-inventory.yaml`
and `docs/design/state-matrix.yaml`, which are not in the active repo. Additionally,
`generate-prompts.js` resolves its design directory relative to `tooling/scripts/..`,
landing in `tooling/docs/design` instead of `docs/design`. These scripts either
error silently or produce wrong output. Remove them or fix both the missing files
and the path bug.

### 1.3 Update stale READMEs and canonical docs [S]

**Severity: Medium**

| File                                       | What is wrong                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/README.md`                       | Claims React 18 / Router 6 / Tailwind 3 / `next-themes`; actual stack is React 19 / Router 7 / Tailwind 4, no `next-themes`. Route table is also wrong. |
| `services/README.md`                       | Says backend source lives at repo root.                                                                                                                 |
| `packages/core/README.md`                  | Claims React 18 peer and a zustand dependency that no longer exists.                                                                                    |
| `AGENTS.md`, `docs/ARCHITECTURE.md`        | Still describe web as React 18.                                                                                                                         |
| `docs/maintenance/PRODUCTION_READINESS.md` | Claims mobile has no token refresh — it does, fully wired.                                                                                              |
| `docs/maintenance/STAGING_RUNBOOK.md`      | Same stale mobile-refresh claim.                                                                                                                        |

Fix: update each file to match current package.json and code reality.

### 1.4 Archive or supersede stale plan docs [S]

**Severity: Low**

`docs/plans/` contains documents that are no longer active execution truth:

- `2026-04-21-mobile-contract-alignment-plan.md` describes `_layout.tsx` as 129 lines and `mobileApiClient.ts` as 971 lines; both are materially smaller now.
- `2026-04-20-mobile-screen-section-naming-remediation-plan.md` references a non-existent `...-remediation-spec.md`.

Move these to `archive/` with a `ARCHIVED: <date>` header, or add a clear `> HISTORICAL — describes state prior to YYYY-MM-DD` notice at the top.

### 1.5 Remove repository pollution [S]

**Severity: Low**

The following are committed but should not be:

- `local.properties` (machine-specific Android SDK path)
- Eclipse metadata (`.project`, `.classpath`, `.factorypath`, `.settings/`)
- `.gradle-home/`
- `repomix-api.xml`, `repomix-docs.xml`, `repomix-infra.xml`, `repomix-packages.xml` (~3.4 MB total)

Fix: remove from git, extend `.gitignore` to prevent recurrence.

---

## Tranche 2 — Security & Operational Safety

These items pose concrete security or production-reliability risk.

### 2.1 Remove hardcoded runtime DB credentials [M]

**Severity: Critical**

`docker/init-db.sql` always creates `tasky_app` with password `tasky_app`, regardless
of what `APP_DB_PASSWORD` is set to. A fresh prod volume is initialized with a
known password that may never be rotated.

Fix: template or generate the init SQL from env at bootstrap time, or perform
runtime-user creation in deployment automation before app start. Do not hardcode
credentials in SQL committed to the repo.

References: `docker/init-db.sql:12–31`, `docker-compose.production.yml:107–130`, `.env.production.example:12–15`

### 2.2 Move vulnerability scanning into PR and release gates [M]

**Severity: High**

Dependency scanning is opt-in in `quality-gates.yml` and runs post-push on `main`.
Trivy runs only after image publish. A vulnerable dependency can merge and pass
the release gate before any blocking scan fires.

Fix: add OWASP Dependency Check and Trivy image scan as required steps in
`quality-gates.yml` and `release-gate.yml`. Keep the nightly/full runs for
deeper analysis but do not leave the fast path unguarded.

References: `.github/workflows/quality-gates.yml`, `.github/workflows/release-gate.yml`, `services/api/build.gradle.kts:256–261`

### 2.3 Fix rate-limit key to use stable userId [S]

**Severity: High**

`RateLimitFilter` keys buckets on `authentication.getName()`. `JwtPrincipal` is a
bare record; `getName()` likely returns a token-derived string, not a stable user ID.
An authenticated user can reset their effective limit by rotating tokens.

Fix: key directly on `JwtPrincipal.userId()` in `RateLimitFilter`.

References: `services/api/.../RateLimitFilter.java:71–81`, `services/api/.../JwtPrincipal.java`

### 2.4 Add explicit timeouts to Facebook auth client [S]

**Severity: High**

`FacebookGraphClient` builds a `RestClient` with a base URL only — no connect or
read timeout. A slow upstream can pin request threads and degrade login paths
before the circuit breaker opens.

Fix: configure explicit connect/read timeouts on the underlying HTTP client.
Keep retries disabled or tightly bounded for auth flows.

References: `services/api/.../FacebookGraphClient.java:34–46`

### 2.5 Stop logging raw push device tokens [S]

**Severity: Medium**

`LoggingPushProvider` logs tokens at `info`. `FirebasePushProvider` logs them on
both success and failure paths. Device tokens are sensitive identifiers.

Fix: log only a short suffix or hash. Do not store full tokens in log systems.

References: `services/api/.../LoggingPushProvider.java:23–33`, `services/api/.../FirebasePushProvider.java:53–100`

### 2.6 Pin all `latest` runtime images to immutable tags [S]

**Severity: Medium**

`pgbouncer`, `minio`, and `minio/mc` are pinned to `latest` in production compose
files. Routine redeployment can pick up a different image than the last known-good one.

Fix: pin to digest or a specific immutable tag for all images in `docker-compose.production.yml`.

References: `docker-compose.production.yml:123,159,206`, `docker-compose.yml:138,157`

### 2.7 Fix `.trivyignore` expiry parser [S]

**Severity: Low**

The documented suppression format is `CVE-...  # expires: YYYY-MM-DD` (inline),
but `tooling/scripts/check-trivyignore-expiry.sh` only matches standalone
`# Expires: YYYY-MM-DD` lines. Real suppressions will silently bypass expiry enforcement.

Fix: align the script to parse the documented inline format, or change the format
docs to match the script.

---

## Tranche 3 — Backend Contract Hardening

### 3.1 Wire controllers to generated OpenAPI interfaces [M]

**Severity: High**

`build.gradle.kts` generates Spring interfaces with `interfaceOnly=true` into
`build/generated-sources/openapi`, but no controller implements any generated `*Api`
interface. OpenAPI parity tests verify runtime path existence but not signature,
request model, response model, or enum correctness. This is a reference surface,
not compile-time enforcement.

Fix: make each controller implement its generated `*Api` interface, or adopt another
compile-time coupling pattern (e.g., OpenAPI-driven integration tests that fail at
compile). Remove the claim of contract-first until enforcement is real.

### 3.2 Centralize controller error handling via @ControllerAdvice [M]

**Severity: Medium**

`TaskController` (~600 lines), `AuthService` (~543 lines), and others repeatedly
assemble `Map.of("code", ..., "message", ..., "trace_id", ...)` response bodies
by hand. Spring 6 ships `ProblemDetail` and `ErrorResponse` for exactly this.

Fix: introduce a single `@ControllerAdvice` that converts domain exceptions to
`ProblemDetail` responses. Remove inline error-map construction from controllers.
This also cuts controller size significantly.

### 3.3 Push DAOs and application services behind public ports [M]

**Severity: Medium**

`docs/ARCHITECTURE.md` describes the active request path as going through module
public ports. The code does not consistently do this:

- `UserProfileController` injects `ProfileDao` and `ReliabilityScoreDao` directly
- `TaskController` injects `TaskDraftService` directly
- `CategoryController`, `PaymentController`, `LocationController`, `BookingIntentController` also bypass the port layer

Fix: route injections through the module's declared public port or composition service.
The architecture docs are ahead of the code — close the gap.

### 3.4 Split TaskService into narrower application services [M]

**Severity: Medium**

`TaskService` (~665 lines) owns task creation, intake validation, scope-summary
generation, notifications, analytics emission, photo ownership checks, status
transitions, cancel/update flows, and storage-key policy handling. This is a
domain hotspot, not a single responsibility.

Fix: extract `TaskCreationService`, `TaskMutationService`, `TaskLifecycleService`,
and `TaskPhotoService`. Use `TaskService` only as a thin facade if backward
compatibility is needed.

References: `services/api/.../TaskService.java:13–60, 103–214, 523–665`

### 3.5 Add eviction for STOMP rate-limit buckets [S]

**Severity: Medium**

`StompRateLimitInterceptor` stores per-user buckets in an unbounded
`ConcurrentHashMap` and never removes them. The comment claims disconnect-based
eviction, but the code does not implement it. On long-lived nodes with user churn,
this is a quiet memory-growth path.

Fix: remove buckets on session end, or switch to an expiring cache with idle
eviction (e.g., Caffeine with `expireAfterAccess`).

References: `services/api/.../StompRateLimitInterceptor.java:21–69`

### 3.6 Close blocker-grade backend scenario gaps [M]

**Severity: High**

`docs/maintenance/PRODUCTION_READINESS.md` explicitly lists missing scenario families
as production blockers: verification-gated tasker activation, verification lifecycle,
pro-badge assignment, admin feature-toggle management, admin ban/unban, and
concierge dispatch proof.

Fix: implement these scenario families, run the scenario registry gates, and remove
the blocker list only after evidence is recorded.

---

## Tranche 4 — Client Parity and Quality

### 4.1 Implement refresh-token flow in the web client [M]

**Severity: High**

The web client receives refresh tokens on login but never uses them. Any `401`
dispatches `tasky:unauthorized`, and `AppShell` immediately signs the user out.
Backend access-token TTL is 900 seconds. In production, web sessions hard-expire
every 15 minutes — a user-facing auth failure, not polish.

Mobile already has the correct pattern. The implementations have diverged.

Fix: implement refresh-on-401 in `apps/web/src/lib/apiClient.ts`, mirroring the
mobile flow. Test silent refresh end-to-end before shipping.

References: `apps/web/src/lib/apiClient.ts:658–716`, `apps/web/src/AppShell.tsx:63–77`

### 4.2 Extract shared HTTP transport into a shared package [M]

**Severity: Medium**

Web and mobile share the same transport origin but have diverged in auth-retry
behavior, error handling, and header logic. Future fixes to retries, tracing, or
error decoding will drift again.

Fix: extract a shared transport core into `@tasky/core` or `@tasky/sdk` with
pluggable auth-refresh hooks. Keep only platform-specific storage/session wiring
in each app.

References: `apps/web/src/lib/apiClient.ts:658–716`, `apps/mobile/src/lib/mobileApiClient.ts:115–217`

### 4.3 Persist mobile auth state in secure storage [M]

**Severity: Medium**

Mobile auth state is memory-only. App restarts clear the session even though a
working refresh-token flow already exists. Other app state already uses persisted
Zustand storage.

Fix: persist auth tokens using Zustand's persistence plugin backed by
`expo-secure-store` (or equivalent platform-secure storage). Do not use
plain AsyncStorage for tokens.

References: `apps/mobile/src/store/authStore.ts`, `apps/mobile/src/providers/AppBootstrapProvider.tsx`

### 4.4 Eliminate SDK type duplication in web apiTypes.ts [S]

**Severity: Medium**

`apps/web/src/lib/apiTypes.ts` imports from `@tasky/sdk` but also defines a large
set of manual interfaces for admin and deferred surfaces (`VerificationDetail`,
`FeatureToggle`, `StrikePolicy`, `PayoutRequest`, `AdminDisputeDetail`, etc.).
This creates a second type authority alongside the generated SDK.

Fix: add missing types to `docs/API.yaml` and regenerate the SDK, or explicitly
mark manual types as temporary and track them for removal.

### 4.5 Drive mobile structure-check warnings to zero [M]

**Severity: Medium**

`apps/mobile/scripts/structure-check.js` currently produces 90 warnings:
cross-feature boundary leaks in `useAuth.ts`, `RebookScreen.tsx`,
`useChatConversationScreen.ts`, `useTaskerProfile.ts`, `TaskCancelSheet.tsx`,
`useTasks.ts`; a cross-screen import in `HomeScreen.tsx`; five route files above
the warning threshold; and dozens of test-path mirror mismatches pointing to
pre-refactor source paths.

Fix: resolve each warning category. The test-path mismatches in particular indicate
that mobile tests have not kept up with structural refactors.

### 4.6 Remove LogBox.ignoreAllLogs() from mobile layout [S]

**Severity: Medium**

`apps/mobile/src/app/_layout.tsx` calls `LogBox.ignoreAllLogs()`. This hides
third-party breakage warnings, React Native API deprecations, and state bugs
during development and CI.

Fix: remove the call entirely, or suppress only the specific known-noisy warnings
by pattern.

### 4.7 Gate mobile analytics logging to development mode [S]

**Severity: Low**

`apps/mobile/src/lib/clientAnalytics.ts` logs payloads unconditionally with
`console.info(...)`. The web equivalent gates console analytics to development.

Fix: wrap mobile analytics logging in a `__DEV__` or `process.env.NODE_ENV === 'development'` check.

### 4.8 Remove or wire dead future admin pages [S]

**Severity: Low**

`apps/web/src/future/admin/AdminPayoutsPage.tsx` and `AdminLeadPricingPage.tsx`
exist but their routes hard-redirect to `/profile`. `future/tasker/TaskerProfilePolishPage.tsx`
has no active route import. These are dead runtime code.

Fix: delete them or move to `archive/` with a dated note. Do not leave
unrouted pages in the active source tree.

References: `apps/web/src/router/AppRoutes.tsx:617–618`

---

## Tranche 5 — Observability and Infrastructure Closure

### 5.1 Prove and record dashboard and alert wiring [M]

**Severity: High**

`docs/maintenance/PRODUCTION_READINESS.md` explicitly states that live alert routing,
dashboard wiring, and KPI dashboards are not yet verified on a deployed stack.
This is a release-readiness gap, not polish.

Fix: treat dashboard/alert wiring as a launch gate. Add dashboard links, runbook
references, and rehearsal evidence to the repo. Do not ship without a verified
alerting path for auth, booking, and moderation failures.

---

## Tranche 6 — Tooling Leverage (after repo is truthful)

### 6.1 Add a task graph with local caching [L]

**Severity: Low**

Root CI scripts use `pnpm -r ...` with no task graph or cache. At this repo size,
incremental builds and remote caching would meaningfully reduce CI time.

Fix: adopt Turborepo or Nx after the repo is truthful. Doing it while docs and
contract signals are unreliable makes the task graph's correctness hard to verify.

### 6.2 Raise mutation testing thresholds to blocking [S]

**Severity: Low**

`apps/web/stryker.config.mjs` sets `thresholds.break: 0`, making web mutation
testing advisory. `services/api/build.gradle.kts` sets PIT `mutationThreshold`
to 20 and gates mutation only to `gateFull` (nightly). Mutation testing exists
but is not a release-quality contract.

Fix: raise web threshold to something meaningful (e.g., 60–70) and add backend
mutation to the PR gate at a baseline threshold. Do this after the scenario gaps
in Tranche 3 are closed, so the baseline is trustworthy.

---

## Summary Table

| #   | Tranche       | Severity | Effort | Item                                             |
| --- | ------------- | -------- | ------ | ------------------------------------------------ |
| 1.1 | Trust         | High     | S      | Repair broken live-doc references                |
| 1.2 | Trust         | High     | S      | Fix or remove broken tooling scripts             |
| 1.3 | Trust         | Medium   | S      | Update stale READMEs and canonical docs          |
| 1.4 | Trust         | Low      | S      | Archive stale plan docs                          |
| 1.5 | Trust         | Low      | S      | Remove repository pollution                      |
| 2.1 | Security      | Critical | M      | Remove hardcoded DB credentials                  |
| 2.2 | Security      | High     | M      | Move vuln scanning into PR/release gates         |
| 2.3 | Security      | High     | S      | Fix rate-limit key to use stable userId          |
| 2.4 | Security      | High     | S      | Add timeouts to Facebook auth client             |
| 2.5 | Security      | Medium   | S      | Stop logging raw push device tokens              |
| 2.6 | Security      | Medium   | S      | Pin `latest` images to immutable tags            |
| 2.7 | Security      | Low      | S      | Fix .trivyignore expiry parser                   |
| 3.1 | Backend       | High     | M      | Wire controllers to generated OpenAPI interfaces |
| 3.2 | Backend       | Medium   | M      | Centralize error handling via @ControllerAdvice  |
| 3.3 | Backend       | Medium   | M      | Push DAOs behind public ports                    |
| 3.4 | Backend       | Medium   | M      | Split TaskService into narrower services         |
| 3.5 | Backend       | Medium   | S      | Add eviction for STOMP rate-limit buckets        |
| 3.6 | Backend       | High     | M      | Close blocker-grade scenario test gaps           |
| 4.1 | Clients       | High     | M      | Implement refresh-token flow in web client       |
| 4.2 | Clients       | Medium   | M      | Extract shared HTTP transport                    |
| 4.3 | Clients       | Medium   | M      | Persist mobile auth state securely               |
| 4.4 | Clients       | Medium   | S      | Eliminate SDK type duplication in apiTypes.ts    |
| 4.5 | Clients       | Medium   | M      | Drive mobile structure-check warnings to zero    |
| 4.6 | Clients       | Medium   | S      | Remove LogBox.ignoreAllLogs()                    |
| 4.7 | Clients       | Low      | S      | Gate mobile analytics to dev mode                |
| 4.8 | Clients       | Low      | S      | Remove or wire dead future admin pages           |
| 5.1 | Observability | High     | M      | Prove dashboard and alert wiring                 |
| 6.1 | Tooling       | Low      | L      | Add task graph with caching                      |
| 6.2 | Tooling       | Low      | S      | Raise mutation testing thresholds                |

---

## Open Questions

These were raised by both audits and remain unanswered:

1. **Is forced re-login on web intentional policy**, or is the missing refresh flow just unfinished mobile parity?
2. **Is the production deployment intended to remain single-instance?** That changes the urgency of the in-memory token blacklist and STOMP rate-limit storage.
3. **Are push device tokens classified as sensitive in your logging policy?** Current code treats them as not-sensitive, but this should be explicit and documented.
4. **Where are dashboard URLs, alert routes, and on-call ownership records kept today?** The repo docs say they are not yet proven.
5. **Is there a `LICENSE` file?** The repo appears to be intentionally proprietary, but this is not stated.
6. **Is there a full git history available?** The audits were performed on a snapshot without `.git`. Commit atomicity, branch discipline, and deleted-secret history could not be verified.
