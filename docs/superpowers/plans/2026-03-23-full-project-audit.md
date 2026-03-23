# Full Project Audit — Phase 1 Production Readiness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the entire Tasky monorepo for documentation alignment, infrastructure correctness, code quality, and Phase 1 production readiness — producing a consolidated findings report with actionable fix list.

**Architecture:** Seven independent audit streams run as parallel subagents, each producing a structured findings report. A final consolidation task merges findings into a single actionable document. Each stream is read-only (no code changes) — fixes come after the audit is accepted.

**Tech Stack:** Java 21 / Spring Boot 3 (backend), React 18 / Vite (web), React Native / Expo 52 (mobile), PostgreSQL 16, Docker Compose, pnpm workspaces, Gradle 8

**Authoritative docs:** `AGENTS.md` > `docs/PRD.md` > `docs/ARCHITECTURE.md` + `docs/API.yaml` > `docs/LAUNCH_ROADMAP.md`

---

## Audit Stream Overview

| # | Stream | Subagent Type | Parallel? | Output |
|---|--------|---------------|-----------|--------|
| 1 | Backend ↔ Documentation Alignment | Explore | Yes | `artifacts/audit/01-backend-alignment.md` |
| 2 | Mobile ↔ Documentation Alignment | Explore | Yes | `artifacts/audit/02-mobile-alignment.md` |
| 3 | Web ↔ Documentation Alignment | Explore | Yes | `artifacts/audit/03-web-alignment.md` |
| 4 | Infrastructure & Startup Verification | general-purpose | Yes | `artifacts/audit/04-infrastructure.md` |
| 5 | Configuration & Environment Audit | Explore | Yes | `artifacts/audit/05-config-env.md` |
| 6 | Lint, Format & Type Check Compliance | general-purpose | Yes | `artifacts/audit/06-lint-format.md` |
| 7 | Phase 1 Production Readiness Assessment | Explore | After 1-6 | `artifacts/audit/07-phase1-readiness.md` |
| 8 | Consolidation & Fix List | — | After 7 | `artifacts/audit/AUDIT-REPORT.md` |

Streams 1–6 are fully independent and MUST be dispatched in parallel.
Stream 7 reads the outputs of 1–6 to assess overall readiness.
Stream 8 is done inline by the orchestrator.

---

## Task 1: Backend ↔ Documentation Alignment

**Purpose:** Verify the Spring Boot backend implements what PRD, ARCHITECTURE.md, and API.yaml specify for Phase 0-1.

**Files to read:**
- `docs/PRD.md` — Sections 5 (Scope), 6 (User Flows), 7 (Requirements)
- `docs/ARCHITECTURE.md` — Sections 2-5 (domains, tech decisions, data model, API contracts)
- `docs/API.yaml` — All endpoint definitions
- `docs/LAUNCH_ROADMAP.md` — "What Shipped" section + Production Readiness Checklist
- `src/main/java/mn/tasky/**` — All backend source
- `src/main/resources/db/migration/` — Flyway migrations
- `src/main/resources/application*.yml` — Spring config profiles

**Subagent instructions — check each of these and report findings:**

- [ ] **Step 1: API.yaml ↔ Controller parity**
  - For every endpoint in `docs/API.yaml`, verify a corresponding `@RestController` method exists in the backend.
  - Check: HTTP method, path, path/query params, request/response DTOs match the OpenAPI schemas.
  - Check: Endpoints that are Phase 2+ deferred (escrow, credits, subscription, referrals, instant-match) correctly return 404 or 503 with appropriate feature toggle checks, not silently exist.
  - Report: Missing endpoints, mismatched signatures, extra endpoints not in spec.

- [ ] **Step 2: Domain structure alignment**
  - Verify the Java package structure matches the domain-to-package mapping in ARCHITECTURE.md Section 2.2. Report any packages that exist in code but are not documented, and any documented packages that do not exist.
  - Check: No cross-domain package imports that violate boundaries (e.g., `booking` importing from `dispute` directly).

- [ ] **Step 3: Data model alignment**
  - Audit ALL Flyway migrations present in `src/main/resources/db/migration/` (currently V1 through V16). Compare against the ERD/data model in ARCHITECTURE.md.
  - Verify required tables exist: `users`, `tasks`, `task_intake_responses`, `bookings`, `applications`, `reviews`, `review_ratings`, `disputes`, `categories`, `category_intake_schemas`, `messages`, `conversations`, `device_tokens`, `verification_submissions`, `feature_toggles`, `domain_outbox_events`.
  - Check: PostGIS extension enabled, GiST index on `tasks.location_point`.
  - Check: AES-256-GCM phone encryption columns + blind index columns exist per ARCHITECTURE.md.

- [ ] **Step 4: Auth & Security alignment**
  - Verify Facebook OAuth flow matches PRD Section 6.1 step 1 (Phase 0-1 auth).
  - Verify JWT stateless auth per ARCHITECTURE.md Section 3.1.
  - Verify dev auth bypass exists and has production safety gate (app fails to start if enabled in prod profile).
  - Verify RBAC: roles CUSTOMER, TASKER, ADMIN exist and are enforced on endpoints.
  - **CRITICAL**: Read `SecurityConfig.java` and verify it has NOT been gutted (known subagent issue per memory). Report full contents.

- [ ] **Step 5: Business logic alignment**
  - Booking state machine: verify states match PRD (ASSIGNED → COMPLETED | CANCELLED) and API.yaml.
  - Application flow: verify APPLIED → SELECTED → ACCEPTED → DECLINED → EXPIRED.
  - Verification flow: verify consent tracking (policy version + timestamp) per LAUNCH_ROADMAP.md.
  - Review system: verify 5-category granular reviews, role-specific (3 ratings per direction).
  - Dispute creation and admin resolution endpoints exist.
  - Feature toggles: DB-backed, runtime-switchable, audit-logged.
  - Idempotency on critical state-changing endpoints (check for idempotency key headers).
  - Transactional outbox (`domain_outbox_events` + `DomainEventOutboxProcessor`).

- [ ] **Step 6: Write findings to `artifacts/audit/01-backend-alignment.md`**

  Use this report format:
  ```markdown
  # Backend ↔ Documentation Alignment Audit

  ## Summary
  - Endpoints in API.yaml: X | Implemented: Y | Missing: Z
  - Domain structure: PASS/FAIL (details)
  - Data model: PASS/FAIL (details)
  - Auth & Security: PASS/FAIL (details)
  - Business logic: PASS/FAIL (details)

  ## Findings

  ### CRITICAL (blocks production)
  - [finding with file:line references]

  ### WARNING (should fix before launch)
  - [finding]

  ### INFO (minor, can defer)
  - [finding]
  ```

---

## Task 2: Mobile ↔ Documentation Alignment

**Purpose:** Verify the Expo/React Native mobile app implements the Phase 0-1 user flows and follows architecture conventions.

**Files to read:**
- `docs/PRD.md` — Sections 6.1 (Customer Flow), 6.2 (Tasker Flow)
- `docs/ARCHITECTURE.md` — Section 3.2 (Frontend Stack), 3.4 (Design System)
- `docs/API.yaml` — All endpoints the mobile app should call
- `AGENTS.md` — Section 3 (Frontend Design System Governance)
- `apps/mobile/src/**` — All mobile source
- `apps/mobile/package.json` — Dependencies
- `packages/sdk/src/generated/api-types.ts` — Generated SDK types

**Subagent instructions:**

- [ ] **Step 1: Screen coverage for Phase 0-1 flows**
  - Map PRD user flows to actual screens in `apps/mobile/src/app/`:
    - Customer: Onboarding (Facebook OAuth) → Post Task (category selection → intake form → location → schedule → budget → review → post) → View Applicants → Accept Tasker → Booking confirmation (liability disclaimer) → Mark Complete → Submit Review
    - Tasker: Onboarding → Browse Tasks → Apply (triggers verification prompt if unverified) → Upload ID + Selfie → View Bookings → Mark Done → Submit Review
    - Admin: Not required on mobile
  - Report: Missing screens, incomplete flows, screens that exist but aren't wired.

- [ ] **Step 2: API integration check**
  - Verify the mobile app uses `@tasky/sdk` or `@tasky/core` for API calls (not raw fetch/axios to hardcoded URLs).
  - Check that API base URL is configurable via environment/config (not hardcoded).
  - Verify TanStack Query is used for server state (not raw useEffect+fetch).
  - Check WebSocket/STOMP setup for real-time messaging exists.

- [ ] **Step 3: Architecture conventions**
  - Verify Expo Router file-based routing is used (not React Navigation directly).
  - Verify Zustand for state management (not Redux or bare Context for complex state).
  - Verify i18n is set up with `en` and `mn` locales.
  - Verify push notification setup: `@react-native-firebase/messaging` + `@notifee/react-native` (NOT expo-notifications for delivery, per ARCHITECTURE.md).
  - Check: No Radix UI or shadcn imports (mobile must use native components per AGENTS.md).
  - Check: Design tokens from `@tasky/design-tokens` are used for theming.

- [ ] **Step 4: Dependency audit**
  - Check `package.json` for:
    - No deprecated or banned dependencies (Material UI, Chakra, etc.)
    - Expo SDK version matches 52
    - React Native version compatibility
    - No duplicate state management libraries

- [ ] **Step 5: Write findings to `artifacts/audit/02-mobile-alignment.md`**

  Same report format as Task 1.

---

## Task 3: Web ↔ Documentation Alignment

**Purpose:** Verify the React web application implements Phase 0-1 flows and follows architecture conventions.

**Files to read:**
- `docs/PRD.md` — Sections 6.1, 6.2 (same flows as mobile, web parity is intentional)
- `docs/ARCHITECTURE.md` — Section 3.2, 3.4 (Design System)
- `AGENTS.md` — Section 3 (Frontend Design System Governance)
- `apps/web/src/**` — All web source
- `apps/web/package.json` — Dependencies
- `packages/sdk/`, `packages/core/`, `packages/design-tokens/` — Shared packages

**Subagent instructions:**

- [ ] **Step 1: Page/route coverage for Phase 0-1 flows**
  - Map PRD user flows to actual routes/pages in `apps/web/src/`:
    - Same customer and tasker flows as mobile (web parity per Doctrine #5).
    - Landing page for marketing/SEO.
  - Report: Missing pages, incomplete flows, routes that exist but aren't functional.

- [ ] **Step 2: API integration check**
  - Same checks as mobile Task 2 Step 2 but for the web app.
  - Verify web app uses `@tasky/sdk` or `@tasky/core`.
  - Verify TanStack Query usage.
  - Verify WebSocket/STOMP for messaging.

- [ ] **Step 3: Architecture conventions**
  - Verify React Router 6 is used for routing.
  - Verify UI primitives: Radix UI + Tailwind, shadcn file conventions (components in `apps/web/src/components/ui/`).
  - Verify: No Material UI, Chakra, or other banned component libraries.
  - Verify i18n with `en` and `mn` locales.
  - Verify design tokens from `@tasky/design-tokens` are used.

- [ ] **Step 4: Dependency audit**
  - Same checks as mobile but for web-specific concerns.
  - Verify Vite as bundler (not webpack/CRA).
  - No duplicate component libraries.

- [ ] **Step 5: Write findings to `artifacts/audit/03-web-alignment.md`**

  Same report format as Task 1.

---

## Task 4: Infrastructure & Startup Verification

**Purpose:** Verify that Docker images build, containers start, and the full local dev stack works end-to-end.

**Subagent instructions (this stream runs actual commands):**

- [ ] **Step 1: Docker Compose validation**
  - Read `docker-compose.yml` and verify all services match ARCHITECTURE.md Section 3.3:
    - `app` (Spring Boot), `postgres` (PostGIS 16), `pgbouncer`, `minio`, `minio-bootstrap`, `postgres-exporter`
  - Check: Which services have health checks defined and which do not. Report any service without a health check as a WARNING.
  - Check: Volumes are correctly mapped (data persistence).
  - Check: Network configuration is correct (services can reach each other).
  - Check: Port mappings match `.env.example` variables.

- [ ] **Step 2: Dockerfile audit**
  - Read `Dockerfile` and verify:
    - Multi-stage build (build + runtime).
    - Base images: `eclipse-temurin:21-jdk` (build), `eclipse-temurin:21-jre` (runtime).
    - Runs as unprivileged user (not root).
    - No secrets baked into the image.
    - `.dockerignore` exists and excludes sensitive files.

- [ ] **Step 3: Backend startup test**
  - Run `./gradlew compileJava compileTestJava` to verify the backend compiles.
  - Run `./gradlew bootJar` to verify the JAR builds.
  - Check `src/main/resources/application.yml` and `application-dev.yml` for correct profile configuration.
  - Verify Flyway migrations are in `src/main/resources/db/migration/` and numbered sequentially.

- [ ] **Step 4: Frontend startup test**
  - Run `pnpm install` (if needed) to verify dependencies resolve.
  - Run `pnpm --filter @tasky/sdk typecheck` (or `build` if a build script exists) to verify SDK compiles.
  - Run `pnpm --filter @tasky/web build` to verify web app builds.
  - Run `pnpm --filter @tasky/mobile typecheck` to verify mobile app compiles without type errors.

- [ ] **Step 5: Project structure conventions**
  - Verify pnpm workspace config (`pnpm-workspace.yaml`) includes `apps/*` and `packages/*`.
  - Verify root `package.json` workspace scripts work (`build`, `test`, `lint`, `format`, `typecheck`).
  - Verify `.editorconfig` is present and matches project conventions (4-space Java, 2-space JSON/TS).
  - Verify `.gitignore` excludes build artifacts, node_modules, .env, IDE files.

- [ ] **Step 6: Write findings to `artifacts/audit/04-infrastructure.md`**

  Report format:
  ```markdown
  # Infrastructure & Startup Audit

  ## Summary
  - Docker Compose: PASS/FAIL
  - Dockerfile: PASS/FAIL
  - Backend compilation: PASS/FAIL
  - Frontend builds: PASS/FAIL
  - Project structure: PASS/FAIL

  ## Build Outputs
  [paste relevant build output snippets]

  ## Findings
  ### CRITICAL / WARNING / INFO
  ```

---

## Task 5: Configuration & Environment Audit

**Purpose:** Verify all configuration is correctly externalized to .env files, no secrets are hardcoded, and config profiles are properly set up.

**Files to read:**
- `.env.example` — Reference for all required variables
- `docker-compose.yml` — Environment variable references
- `src/main/resources/application*.yml` — Spring Boot config
- `apps/web/vite.config.ts`, `apps/web/.env*` — Web config
- `apps/mobile/app.json`, `apps/mobile/.env*` — Mobile config

**Subagent instructions:**

- [ ] **Step 1: .env completeness**
  - Read `.env.example` and list all variables.
  - Verify each variable is actually consumed somewhere (docker-compose.yml, application.yml, or app config).
  - Check for variables that are used in code but NOT listed in `.env.example`.
  - Verify no `.env` file is committed to git (check `.gitignore`).

- [ ] **Step 2: Hardcoded secrets scan**
  - Search the entire codebase for:
    - Hardcoded JWT secrets, API keys, passwords, tokens.
    - Hardcoded database connection strings.
    - Hardcoded URLs that should be configurable (API base URL in frontends).
  - Patterns to grep: `password`, `secret`, `token`, `api_key`, `apiKey`, `jdbc:postgresql`, `localhost:8080` (in non-config files).
  - Exclude: test fixtures, `.env.example`, documentation.

- [ ] **Step 3: Spring Boot profile configuration**
  - Verify profiles exist: `default` (`application.yml`), `dev` (`application-dev.yml`), `prod` (`application-prod.yml`).
  - Verify `dev` profile enables dev auth, verbose logging.
  - Verify `prod` profile disables dev auth (safety gate), has appropriate log levels.
  - Check if a `test` profile file (`application-test.yml`) exists; if not, verify that test configuration is handled via Testcontainers annotations in test classes or `@SpringBootTest` properties.
  - Check: CORS allowed origins are configurable via env var (`TASKY_CORS_ALLOWED_ORIGINS`).
  - Check: WebSocket allowed origins are configurable (`TASKY_WEBSOCKET_ALLOWED_ORIGINS`).

- [ ] **Step 4: Frontend configuration**
  - Web: Verify API base URL is read from `VITE_*` env var, not hardcoded.
  - Mobile: Verify API base URL is configurable (Expo config, env var, or constants file).
  - Both: Verify no production URLs are hardcoded in source.

- [ ] **Step 5: Write findings to `artifacts/audit/05-config-env.md`**

  Same report format.

---

## Task 6: Lint, Format & Type Check Compliance

**Purpose:** Verify all code passes linting, formatting, and type checking with zero errors.

**Subagent instructions (runs actual commands):**

- [ ] **Step 1: Backend — Java quality checks**
  - Run: `./gradlew spotlessCheck` — Formatting compliance
  - Run: `./gradlew checkstyleMain` — Style rules
  - Run: `./gradlew compileJava` — Compilation (ErrorProne enabled)
  - Report: Number of violations per tool, file locations.

- [ ] **Step 2: Frontend — ESLint**
  - Run: `pnpm lint` (workspace-level, covers web + mobile + packages)
  - Report: Number of errors and warnings per app, top violation categories.

- [ ] **Step 3: Frontend — Prettier formatting**
  - Run: `pnpm format:check` (workspace-level)
  - Report: Number of files with formatting violations per app.

- [ ] **Step 4: Frontend — TypeScript type checking**
  - Run: `pnpm typecheck` (workspace-level)
  - Report: Number of type errors per app, specific error categories.

- [ ] **Step 5: Test suite health check**
  - Run: `./gradlew test` (backend) — Report pass/fail count.
  - Run: `pnpm test` (frontend) — Report pass/fail count.
  - Note: Full test pass is not required for audit, but report the state.

- [ ] **Step 6: Write findings to `artifacts/audit/06-lint-format.md`**

  Report format:
  ```markdown
  # Lint, Format & Type Check Audit

  ## Summary Table
  | Check | Backend | Web | Mobile | SDK | Core | Tokens |
  |-------|---------|-----|--------|-----|------|--------|
  | Format | PASS/FAIL (N issues) | ... | ... | ... | ... | ... |
  | Lint | ... | ... | ... | ... | ... | ... |
  | Types | N/A | ... | ... | ... | ... | ... |
  | Tests | X/Y pass | ... | ... | ... | ... | ... |

  ## Detailed Violations
  [grouped by severity and app]
  ```

---

## Task 7: Phase 1 Production Readiness Assessment

**Purpose:** Using findings from Tasks 1–6, assess against the Production Readiness Checklist in `docs/LAUNCH_ROADMAP.md` and produce a go/no-go recommendation.

**Depends on:** Tasks 1–6 (reads their output reports).

**Files to read:**
- `artifacts/audit/01-backend-alignment.md` through `06-lint-format.md`
- `docs/LAUNCH_ROADMAP.md` — Production Readiness Checklist
- `docs/PRD.md` — Phase gates, success metrics

**Subagent instructions:**

- [ ] **Step 1: Evaluate Production Readiness Checklist**
  - For each item in LAUNCH_ROADMAP.md's "Production Readiness Checklist", mark PASS/FAIL based on audit findings:
    - [ ] All Flyway migrations run cleanly on fresh database
    - [ ] Migrations run cleanly on existing dev database
    - [ ] 3 seed category intake schemas deployed (Cleaning, Moving & Hauling, Handyman)
    - [ ] Feature toggles seeded (all monetization = false)
    - [ ] Full test suite green (`./gradlew test`)
    - [ ] Docker Compose local dev environment works end-to-end
    - [ ] Admin can: create/approve verification, manage categories + schemas, resolve disputes, toggle features
    - [ ] Core flow manual walkthrough: post task → apply → accept → complete → review

- [ ] **Step 2: Cross-cutting assessment**
  - Security: Are there any CRITICAL security findings from the audit streams?
  - API contract: Is the backend fully aligned with API.yaml for Phase 0-1 endpoints?
  - Frontend parity: Do web and mobile cover the same Phase 0-1 flows?
  - i18n: Are both `en` and `mn` locales functional?
  - Configuration: Are all secrets externalized? Is prod safety gate in place?

- [ ] **Step 3: Write findings to `artifacts/audit/07-phase1-readiness.md`**

  Report format:
  ```markdown
  # Phase 1 Production Readiness Assessment

  ## GO / NO-GO Recommendation: [GO | NO-GO | CONDITIONAL GO]

  ## Production Readiness Checklist
  | # | Item | Status | Notes |
  |---|------|--------|-------|
  | 1 | Flyway migrations clean | PASS/FAIL | ... |
  | ... |

  ## Critical Blockers (must fix before launch)
  1. [blocker from any audit stream]

  ## Warnings (should fix, not blocking)
  1. [warning]

  ## Deferred (acceptable for Phase 1)
  1. [item]
  ```

---

## Task 8: Consolidation & Fix List

**Purpose:** Merge all findings into a single actionable document.

**Done inline by orchestrator (not a subagent).**

- [ ] **Step 1: Read all 7 audit reports**
- [ ] **Step 2: Produce `artifacts/audit/AUDIT-REPORT.md`**

  Final format:
  ```markdown
  # Tasky Full Project Audit — 2026-03-23

  ## Executive Summary
  [2-3 sentences: overall health, go/no-go, top concerns]

  ## Audit Results by Stream
  | Stream | Status | Critical | Warning | Info |
  |--------|--------|----------|---------|------|
  | Backend Alignment | ... | N | N | N |
  | Mobile Alignment | ... | N | N | N |
  | Web Alignment | ... | N | N | N |
  | Infrastructure | ... | N | N | N |
  | Configuration | ... | N | N | N |
  | Lint & Format | ... | N | N | N |

  ## Production Readiness: [GO / NO-GO / CONDITIONAL]

  ## Action Items (ordered by priority)
  ### P0 — Must Fix Before Launch
  1. [item] — [which stream] — [file:line]

  ### P1 — Should Fix Before Launch
  1. [item]

  ### P2 — Can Defer
  1. [item]
  ```

---

## Subagent Dispatch Strategy

### Parallel Wave 1 (Streams 1–6)

Launch all 6 subagents simultaneously. Each is independent — no shared state.

| Subagent | Type | Key Instruction |
|----------|------|-----------------|
| Backend Alignment | Explore (very thorough) | Read docs, read all backend source, compare, write report |
| Mobile Alignment | Explore (very thorough) | Read docs, read all mobile source, compare, write report |
| Web Alignment | Explore (very thorough) | Read docs, read all web source, compare, write report |
| Infrastructure | general-purpose | Read configs AND run build commands, write report |
| Config & Env | Explore (very thorough) | Read all config files, grep for hardcoded secrets, write report |
| Lint & Format | general-purpose | Run all lint/format/type commands, capture output, write report |

### Sequential Wave 2 (Stream 7)

After all Wave 1 subagents complete, dispatch Stream 7 to read their reports and produce the readiness assessment.

### Inline (Stream 8)

Orchestrator reads all reports and produces the final consolidated document.

---

## Estimated Effort

- Wave 1 (parallel): ~10–15 minutes wall-clock (subagents run concurrently)
- Wave 2 (sequential): ~5 minutes
- Consolidation: ~5 minutes
- **Total: ~20–25 minutes**

---

## Success Criteria

1. All 7 audit reports written to `artifacts/audit/`
2. Consolidated `AUDIT-REPORT.md` produced with prioritized action items
3. Clear GO / NO-GO / CONDITIONAL recommendation for Phase 1 launch
4. Every finding has a file:line reference where applicable
5. No code changes made during audit — this is observation only
