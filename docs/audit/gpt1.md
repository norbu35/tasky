# 1. Executive summary

- Monorepo is well-structured around a Java/Spring backend, React/Vite web app,
  Expo mobile app, shared TypeScript packages, and explicit repo-level
  gates/docs.
- The biggest concrete risk is a production DB bootstrap script that hardcodes
  the runtime DB role/password (`tasky_app` / `tasky_app`), which undermines the
  env-based secret model and can break fresh prod bootstraps.
- Web auth is materially weaker than mobile auth: the web client receives
  refresh tokens but never uses them, so prod sessions will hard-expire when the
  access token expires.
- Authenticated API rate limiting is likely keyed by `Authentication#getName()`
  rather than stable `userId`, which makes enforcement weaker than the comment
  claims.
- Supply-chain/security scanning exists, but it is not in the main PR/release
  gate path; it runs after image publish on `main` and in nightly/full gates.
- Some operational docs are stale enough to mislead maintainers. The worst
  example is the production-readiness doc claiming mobile has no refresh flow
  when the code now does.
- Notification providers log raw device tokens. That is unnecessary exposure of
  sensitive identifiers.
- The backend has strong guardrails worth preserving: ArchUnit boundary tests,
  OpenAPI-as-source-of-truth, scenario registry/gates, secret scanning hooks,
  and non-root container images.
- Repo hygiene inside the archive is decent, but this zip does not include
  `.git`, so commit history/branching quality could not be audited.

# 2. Repository snapshot

This is a pnpm + Gradle monorepo with a Spring Boot 3 / Java 21 backend in
`services/api`, a React 19 + Vite 8 web client in `apps/web`, an Expo SDK 55 /
React Native 0.83 mobile client in `apps/mobile`, and shared TS packages in
`packages/*`. Persistence is PostgreSQL/PostGIS with Flyway and JDBI. Infra is
Docker Compose-driven. The archive contains substantial docs and test assets;
rough size is ~136k lines across source and docs, with ~95k lines in
app/service/package code and ~40k in docs. The zip is an archive snapshot, not a
full git checkout.

```text
.
├── apps/
│   ├── mobile/
│   └── web/
├── services/
│   ├── api/
│   └── README.md
├── packages/
│   ├── core/
│   ├── design-tokens/
│   ├── sdk/
│   └── test-utils/
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── design/
│   ├── maintenance/
│   ├── operations/
│   └── plans/
├── tooling/
│   ├── agent/
│   ├── config/
│   └── scripts/
├── tests/
│   ├── registry.yaml
│   └── scenarios/
├── docker/
├── archive/
├── research/
├── build.gradle.kts
├── settings.gradle.kts
├── package.json
├── pnpm-workspace.yaml
├── Dockerfile
└── docker-compose*.yml
```

# 3. Findings by category

## 1. Architecture & design

[MEDIUM | HIGH]

Where:
`services/api/src/main/java/mn/tasky/task/application/TaskService.java:13–60`,
`services/api/src/main/java/mn/tasky/task/application/TaskService.java:103–214`,
`services/api/src/main/java/mn/tasky/task/application/TaskService.java:523–665`

What: `TaskService` has become a domain hub: it owns task creation, intake
validation, scope-summary generation, notifications, analytics emission, photo
ownership checks, status transitions, cancel/update flows, and storage-key
policy handling. The constructor fan-in and method spread are too wide for one
service.

Why it matters: This raises coupling inside the task domain and makes future
changes riskier. It also makes test setup heavier and obscures clear seams for
command/query ports.

Recommendation: Split this into smaller application services behind the existing
domain ports, e.g. `TaskCreationService`, `TaskMutationService`,
`TaskLifecycleService`, and `TaskPhotoService`. Keep `TaskService` only as a
thin façade if compatibility is needed.

## 2. Code quality

[MEDIUM | HIGH]

Where: `apps/web/src/lib/apiClient.ts:658–716`,
`apps/mobile/src/lib/mobileApiClient.ts:115–217`

What: The web and mobile clients duplicate the HTTP transport layer, but the
implementations have already diverged in behavior. Mobile retries on `401` with
refresh-token flow; web immediately emits `tasky:unauthorized` and signs the
user out.

Why it matters: This is not cosmetic duplication. It caused a real behavior
split across platforms, and future fixes to retries, headers, error decoding,
idempotency, or tracing will drift again.

Recommendation: Extract a shared transport core into `@tasky/core` or
`@tasky/sdk` with pluggable auth-refresh hooks. Keep only platform-specific
storage/session wiring in each app.

## 3. Type safety & correctness

[HIGH | MEDIUM]

Where:
`services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java:25–31`,
`services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java:71–81`,
`services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java:122–125`,
`services/api/src/main/java/mn/tasky/common/security/JwtPrincipal.java:1–3`

What: The filter comment says authenticated requests are keyed by user ID, but
the code uses `authentication.getName()`. The authentication principal is a bare
`JwtPrincipal` record, not a type with an explicit `getName()` contract.
Inference: this is likely token-string-ish identity rather than stable `userId`,
especially if `toString()` is used.

Why it matters: If the rate key varies per token/session instead of per user,
authenticated users can reset their effective limit by rotating tokens. That
weakens abuse protection and makes ops tuning misleading.

Recommendation: Key directly on `JwtPrincipal.userId()` in `RateLimitFilter`, or
wrap the principal in a type that implements a stable authenticated-name
contract.

## 4. Security

[CRITICAL | HIGH]

Where: `docker/init-db.sql:12–31`, `docker-compose.production.yml:107–130`,
`.env.production.example:12–15`

What: Production bootstrap mounts an init script that always creates `tasky_app`
with password `tasky_app`, then grants that hardcoded role access to database
`tasky`. That conflicts with the production env contract, which says
`APP_DB_PASSWORD` is required and externally supplied.

Why it matters: This is a real credential weakness, not a style issue. A fresh
prod volume will be initialized with a known runtime password regardless of what
the operator intended, and rotations/env overrides become inconsistent with the
actual DB state.

Recommendation: Stop hardcoding the runtime role/password in
`docker/init-db.sql`. Template or generate the SQL from env at bootstrap time,
or create the runtime user explicitly in deployment automation before app start.

[MEDIUM | HIGH]

Where:
`services/api/src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java:23–33`,
`services/api/src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java:53–80`,
`services/api/src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java:86–100`

What: Both push providers log raw device tokens. The logging provider writes
them at `info`; the Firebase provider writes them on success/failure paths.

Why it matters: Device tokens are sensitive identifiers. Logging them increases
blast radius in log systems and makes incident handling harder for no real
operational gain.

Recommendation: Stop logging full tokens. At most log a short hash or suffix and
keep full tokens only in secured storage/DB.

## 5. Data layer

No issues found.

## 6. API & contract

No issues found.

## 7. Performance

[MEDIUM | HIGH]

Where:
`services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java:21–23`,
`services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java:32`,
`services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java:46–69`

What: STOMP send-rate buckets are stored in an unbounded `ConcurrentHashMap` and
never removed. The comment says buckets are effectively evicted when users
reconnect, but the code does not do that.

Why it matters: Over time, every distinct user ID leaves a resident bucket
behind. On a long-lived process with churn, that becomes a quiet memory-growth
path.

Recommendation: Remove buckets on disconnect/session end, or move to an expiring
cache keyed by user ID with idle eviction.

## 8. Reliability & resilience

[HIGH | MEDIUM]

Where:
`services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java:34–46`,
`services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java:78–102`,
`services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java:131–154`

What: The Facebook auth client builds a `RestClient` with a base URL only. There
is no explicit connect timeout, read timeout, or retry budget visible here.

Why it matters: The circuit breaker helps after failure is observed, but without
request deadlines a slow or half-dead upstream can still pin request threads and
degrade login paths before the breaker opens.

Recommendation: Configure explicit connect/read timeouts on the underlying HTTP
client and keep retries bounded or disabled for auth flows.

## 9. Observability

[HIGH | HIGH]

Where: `docs/maintenance/PRODUCTION_READINESS.md:43–46`,
`docs/maintenance/PRODUCTION_READINESS.md:109–113`,
`docs/maintenance/PRODUCTION_READINESS.md:174–177`

What: The project’s own readiness doc says live alert routing, dashboard wiring,
and KPI dashboards are not yet proven in a real deployed stack.

Why it matters: This is a release-readiness gap, not a theoretical nice-to-have.
If auth, booking, or moderation breaks in prod, the repo does not yet show a
verified alerting path.

Recommendation: Treat dashboard/alert wiring as a launch gate. Add the dashboard
links/runbook references to the repo and record rehearsal evidence alongside the
existing readiness docs.

## 10. Testing

[HIGH | HIGH]

Where: `docs/maintenance/PRODUCTION_READINESS.md:36–43`,
`docs/maintenance/PRODUCTION_READINESS.md:74–79`

What: The repo explicitly records missing blocker-grade backend scenario
families for verification-gated tasker activation, verification lifecycle,
pro-badge assignment, admin feature-toggle management, admin ban/unban, and
concierge dispatch proof.

Why it matters: These are already classified as production blockers by the
maintainers. That means the current test suite is not yet trusted on several
launch-critical admin/safety paths.

Recommendation: Implement those scenario families first, then rerun the scenario
registry/gates and remove the blocker list from the readiness doc only after
evidence exists.

## 11. Build, tooling, DX

[LOW | HIGH]

Where: `.trivyignore:1–6`, `tooling/scripts/check-trivyignore-expiry.sh:13–27`

What: The documented `.trivyignore` format says suppressions are inline comments
like `CVE-...  # expires: YYYY-MM-DD`, but the checker only looks for standalone
lines matching `# Expires: YYYY-MM-DD`.

Why it matters: The policy checker will silently miss the format it documents.
As soon as real suppressions are added, expiry enforcement becomes unreliable.

Recommendation: Make the script parse the documented inline format, or change
the file format docs to match the script. Right now they contradict each other.

## 12. CI/CD

[HIGH | HIGH]

Where: `.github/workflows/quality-gates.yml:7–190`,
`.github/workflows/release-gate.yml:21–125`,
`.github/workflows/build-and-push.yml:102–124`,
`services/api/build.gradle.kts:256–261`, `services/api/build.gradle.kts:334–346`

What: Vulnerability scanning is not part of the main PR/release gate path. PR
quality gates run structure/tests/lint/e2e, release gate runs
migration/perf/smoke checks, and backend dependency scanning is explicitly
opt-in except in nightly/full gates; Trivy runs only after image publish on
`main`.

Why it matters: A dependency or image vulnerability can merge and even pass
release gating before the blocking scan happens. That is backwards.

Recommendation: Add dependency and image vulnerability scanning to
`quality-gates.yml` and `release-gate.yml`, not just post-push and nightly
flows.

## 13. Infrastructure & config

[MEDIUM | HIGH]

Where: `docker-compose.production.yml:123`, `docker-compose.production.yml:159`,
`docker-compose.production.yml:206`, `docker-compose.yml:138`,
`docker-compose.yml:157`

What: Several runtime images are pinned to `latest` (`pgbouncer`, `minio`,
`minio/mc`).

Why it matters: This weakens reproducibility and makes rollback/debugging
harder. A routine redeploy can pick up a different image than the last
known-good one.

Recommendation: Pin immutable tags or digests for all runtime images, especially
in production compose files.

## 14. Frontend-specific

[HIGH | HIGH]

Where: `apps/web/src/lib/apiClient.ts:235–243`,
`apps/web/src/lib/apiClient.ts:599–607`,
`apps/web/src/lib/apiClient.ts:658–716`, `apps/web/src/AppShell.tsx:26–31`,
`apps/web/src/AppShell.tsx:63–77`,
`services/api/src/main/resources/application.yml:98–99`

What: The web client receives refresh tokens on login, stores them in session
state, but never uses them. Any `401` dispatches `tasky:unauthorized`, and
`AppShell` immediately signs the user out. Backend default access-token TTL is
900 seconds.

Why it matters: In production, web sessions will hard-expire on access-token
expiry instead of silently refreshing. That is a user-facing auth failure, not
polish.

Recommendation: Implement the same refresh-on-401 pattern the mobile client
already has, or stop issuing refresh tokens to web if forced reauth is
intentional.

## 15. Mobile-specific

[MEDIUM | MEDIUM]

Where: `apps/mobile/src/store/authStore.ts:1–15`,
`apps/mobile/src/store/appStore.ts:1–25`,
`apps/mobile/src/providers/AppBootstrapProvider.tsx:14–33`

What: Mobile auth state is memory-only, while unrelated app state already uses
persisted zustand storage. Inference: app restarts clear the session even though
the refresh flow exists.

Why it matters: On mobile, session loss on app restart is avoidable friction and
wastes the refresh-token design already present in the client.

Recommendation: Persist auth state with `zustand` persistence and store tokens
in platform-secure storage, not plain in-memory state.

## 16. Documentation

[MEDIUM | HIGH]

Where: `docs/maintenance/PRODUCTION_READINESS.md:44–46`,
`apps/mobile/src/lib/mobileApiClient.ts:75–113`,
`apps/mobile/src/lib/mobileApiClient.ts:150–160`,
`apps/mobile/src/lib/mobileApiClient.ts:197–207`,
`apps/mobile/src/providers/AppBootstrapProvider.tsx:14–33`

What: The production-readiness doc says the mobile client has no token refresh
mechanism, but the mobile client clearly implements one and wires it at
bootstrap.

Why it matters: This is the wrong place for drift. Operators and reviewers will
use this doc to decide go/no-go.

Recommendation: Update the readiness doc immediately and replace the stale
blocker with the real remaining auth gap, if any.

[LOW | HIGH]

Where: `services/README.md:5–9`, `apps/web/README.md:5–23`,
`apps/web/package.json:24–79`

What: Multiple README files are stale. `services/README.md` says backend source
still lives at repo root, and `apps/web/README.md` documents React 18 / Router 6
/ Tailwind 3 / `next-themes`, while the actual package uses React 19 / Router 7
/ Tailwind 4 and no `next-themes`.

Why it matters: New engineers will distrust local docs fast if the first basic
facts are wrong.

Recommendation: Either trim these READMEs down to stable truths or make them
part of the same maintenance gate as package/version updates.

## 17. Licensing & compliance

No issues found.

## 18. Git & repo hygiene

No issues found.

## 19. Deletion candidates

[LOW | HIGH]

Where: `apps/web/src/router/AppRoutes.tsx:617–618`,
`apps/web/src/future/admin/AdminPayoutsPage.tsx:21–77`,
`apps/web/src/future/admin/AdminLeadPricingPage.tsx:23–89`

What: Two sizable admin pages still exist, but their routes now hard-redirect to
`/profile`. They are effectively dead runtime code.

Why it matters: Dead code raises maintenance cost and confuses future
contributors about what is actually live.

Recommendation: Delete these pages if they are truly deferred, or move them into
`archive/` with a clear note.

## 20. Positive observations

- Strong architectural guardrails: ArchUnit tests enforce domain boundaries and
  public-port rules instead of leaving architecture as doc-only intent
  (`services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java:16–164`,
  `services/api/src/test/java/mn/tasky/architecture/PublicPortBoundaryTest.java:17–99`).
- API-contract discipline is better than average: OpenAPI is treated as source
  of truth and SDK drift is explicitly checked in CI/hooks (`README.md:101–105`,
  `AGENTS.md:80–88`, `package.json:27–30`,
  `.github/workflows/quality-gates.yml:43–50`).
- Repo hygiene gates are real, not aspirational: pre-push runs typecheck,
  workspace boundaries, mobile structure checks, migration validation, OpenAPI
  validation, lint, SDK drift, and frontend unit tests
  (`.husky/pre-push:15–41`).
- Container hardening is decent: backend and web images are multi-stage and run
  as non-root (`Dockerfile:1–29`, `apps/web/Dockerfile:1–36`).
- Web edge hardening is good: production Caddy config sets HSTS, XFO, referrer
  policy, permissions policy, and CSP (`apps/web/Caddyfile.production:9–23`).
- Auth safety rails exist in code, not just docs: dev auth and OTP test modes
  are blocked outside allowed profiles
  (`services/api/src/main/java/mn/tasky/auth/application/AuthService.java:108–126`).
- The scenario registry is a real governance tool with explicit risk tiers and
  coverage state (`tests/registry.yaml:1–18`, `tests/scenarios/README.md:1–19`).

# 4. Cross-cutting themes

The repo’s biggest pattern is good intent with incomplete closure. The team
built real guardrails—architecture tests, scenario registries, PR hooks, OpenAPI
discipline—but a few high-impact edges still sit outside those gates: secret
bootstrap, vulnerability scanning, and operator docs.

The second pattern is platform divergence. Mobile and web started from similar
client transport code, then mobile gained refresh logic while web did not. The
duplication is already producing product-level inconsistency.

The third pattern is doc drift. Several docs are still treated as
source-of-truth, but they are stale on facts that now matter operationally.

# 5. Prioritized remediation plan

| #   | Severity | Effort (S/M/L) | Title                                                                      | Rationale                                                        |
| --- | -------- | -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Critical | M              | Remove hardcoded runtime DB credentials from `docker/init-db.sql`          | Highest security risk; directly undermines prod secret model.    |
| 2   | High     | M              | Add refresh-token flow to the web client                                   | Current web sessions hard-expire on access-token expiry.         |
| 3   | High     | S              | Fix authenticated rate-limit key to use stable `userId`                    | Current behavior likely weakens abuse protection.                |
| 4   | High     | M              | Move dependency/image vulnerability scans into PR and release gates        | Security scanning currently happens too late.                    |
| 5   | High     | S              | Add explicit timeouts to Facebook outbound auth calls                      | Prevents login-path thread pinning and improves failure posture. |
| 6   | High     | M              | Close the blocker-grade backend scenario gaps called out in readiness docs | These are already classified as launch blockers.                 |
| 7   | High     | S              | Correct `PRODUCTION_READINESS.md` to match current auth reality            | Operators need truthful go/no-go docs.                           |
| 8   | Medium   | S              | Stop logging raw push device tokens                                        | Reduces unnecessary sensitive-data exposure.                     |
| 9   | Medium   | S              | Add eviction/cleanup for STOMP rate-limit buckets                          | Prevents quiet memory growth on long-lived nodes.                |
| 10  | Medium   | M              | Persist mobile auth state securely                                         | Makes mobile refresh flow useful across app restarts.            |
| 11  | Medium   | M              | Split `TaskService` into narrower application services                     | Reduces hotspot risk and future change cost.                     |
| 12  | Medium   | M              | Extract shared HTTP transport logic for web/mobile                         | Prevents more cross-platform auth/retry drift.                   |
| 13  | Medium   | S              | Pin all `latest` runtime images to immutable tags/digests                  | Improves reproducibility and rollback safety.                    |
| 14  | Low      | S              | Fix `.trivyignore` expiry parser to match documented format                | Prevents a false sense of policy enforcement.                    |
| 15  | Low      | S              | Remove or archive dead future admin pages                                  | Cuts dead code and route confusion.                              |
| 16  | Low      | S              | Refresh stale service/web READMEs                                          | Low effort, immediate DX win.                                    |

# 6. Open questions for the maintainers

- This archive has no `.git` directory. Was that intentional? I could not audit
  commit history, atomicity, branch discipline, or deleted secrets in history.
- Is production intended to remain single-instance for now? That changes the
  urgency of the in-memory token blacklist and STOMP rate-limit storage.
- Is forced re-login on web after access-token expiry intentional policy, or
  just unfinished parity with mobile?
- Are push device tokens treated as sensitive in your logging policy? Current
  code suggests “no,” but that should be explicit.
- The archive did not include a `LICENSE` file. Is this repo intentionally
  proprietary, or is licensing still undecided?
- Where are the actual dashboard URLs, alert routes, and on-call ownership
  records kept today? The repo docs say they are not yet proven.
