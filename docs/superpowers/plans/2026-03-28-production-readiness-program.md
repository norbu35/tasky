# Production Readiness Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Tasky from its current partially integrated state to a launch-ready production baseline, then sequence the remaining work needed to reach the broader PRD target state.

**Architecture:** Execute this as a staged program, not a single branch. First restore trustworthy release gates and contract integrity, then complete the mobile-first Phase 0/1 product, then close security/operations gaps, and only after that deliver deferred Phase 2+ capabilities behind real release criteria.

**Tech Stack:** Java 21, Spring Boot 3, PostgreSQL/PostGIS, JDBI, React/Vite, React Native/Expo, pnpm, Docker/Compose, GitHub Actions

---

## Program Rules

- This is a **master plan**, not a one-branch implementation checklist.
- Each task below should become its own ticket or tightly related ticket group.
- Each workstream must produce its own detailed execution subplan before code changes start.
- Do not mix launch-baseline fixes with Phase 2+ capability work in the same branch.
- Do not expose deferred UI surfaces without either a live backend contract or a hard feature gate.

## Recommended Execution Order

1. Release-gate integrity and CI truthfulness
2. API/spec/client contract authority
3. Mobile-first Phase 0/1 core-flow completion
4. Security/privacy/auditability hardening
5. Deployment, observability, and release automation
6. Deferred-surface quarantine and roadmap cleanup
7. Phase 2+ program delivery

## Task 1: Repair Release-Gate Integrity

**Files:**
- Modify: [scripts/validate-backlog.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-backlog.py)
- Modify: [scripts/validate-traceability.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-traceability.py)
- Modify: [scripts/validate-ticket-specs.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-ticket-specs.py)
- Modify: [scripts/validate-compat-docs.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-compat-docs.py)
- Modify: [scripts/self-verify.sh](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/self-verify.sh)
- Modify: [scripts/validate-self-verify.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-self-verify.py)
- Modify: [.github/workflows/quality-gates.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/quality-gates.yml)
- Modify: [docs/quality/SELF_VERIFY_CONTRACT.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/quality/SELF_VERIFY_CONTRACT.md)
- Modify or create canonical docs required by the workflow

- [ ] Decide whether backlog/compatibility validation should be restored to living docs or removed from the required PR path.
- [ ] Make the validator set match the repo’s actual canonical planning sources.
- [ ] Make CI reject stale or wrong-ticket `artifacts/self-verify.json` files.
- [ ] Add explicit branch/ticket/artifact provenance checks to the self-verify path.
- [ ] Re-run:

```bash
python3 scripts/validate-traceability.py
python3 scripts/validate-backlog.py
python3 scripts/validate-ticket-specs.py
python3 scripts/validate-compat-docs.py
python3 scripts/validate-self-verify.py artifacts/self-verify.json docs/quality/self-verify.schema.json
```

- [ ] Exit criterion: the repo’s documented PR gate is achievable and trustworthy again.

## Task 2: Restore API/SDK/Server/Client Contract Authority

**Files:**
- Modify: [docs/API.yaml](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/API.yaml)
- Modify: [packages/sdk/src/generated/api-types.ts](/home/norbu/projects/tasky/.worktrees/TASK-116/packages/sdk/src/generated/api-types.ts)
- Modify: [src/main/java/mn/tasky/user/dto/ProfileResponse.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/user/dto/ProfileResponse.java)
- Modify: [apps/web/src/lib/apiClient.ts](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/src/lib/apiClient.ts)
- Modify: [apps/mobile/src/lib/mobileApiClient.ts](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/lib/mobileApiClient.ts)
- Modify: [src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java)
- Modify or add response-shape parity tests

- [ ] Inventory live contract drift, starting with high-impact fields such as profile/phone exposure, booking payloads, and verification/admin responses.
- [ ] Extend contract tests from path coverage to response-schema coverage for live endpoints.
- [ ] Regenerate SDK types and remove remaining hand-maintained request/response drift in clients.
- [ ] Re-run:

```bash
./gradlew --no-daemon test --tests mn.tasky.contract.ApiContractTraceabilityTests --tests mn.tasky.contract.OpenApiSpringParityTests
./gradlew --no-daemon openApiValidate
pnpm --filter @tasky/sdk generate
pnpm --filter @tasky/web typecheck
pnpm --filter @tasky/mobile typecheck
```

- [ ] Exit criterion: OpenAPI is authoritative for both live paths and live payload shapes.

## Task 3: Complete the Mobile-First Phase 0/1 Product

**Files:**
- Modify: [apps/mobile/src/app/(auth)/index.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(auth)/index.tsx)
- Modify: [apps/mobile/src/features/auth/components/LoginForm.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/features/auth/components/LoginForm.tsx)
- Modify: [apps/mobile/src/app/(customer)/tasks/new/intake.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(customer)/tasks/new/intake.tsx)
- Modify: the rest of the mobile task-posting wizard under [apps/mobile/src/app/(customer)/tasks/new](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(customer)/tasks/new)
- Modify: mobile notifications and messaging client flows
- Modify: stale mobile tests such as [apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/__tests__/screens/customer/IntakeFormScreen.test.tsx)

- [ ] Replace simulated or phase-inaccurate auth UX with the real Phase 0/1 path.
- [ ] Bring mobile intake to structured, schema-driven task creation rather than free-text-only capture.
- [ ] Complete the mobile task-posting route flow so the current test suite matches actual payload contracts.
- [ ] Close client parity gaps for notifications, chat, and launch-critical customer/tasker flows.
- [ ] Re-run:

```bash
pnpm --filter @tasky/mobile typecheck
pnpm --filter @tasky/mobile test:unit -- --runInBand
pnpm --filter @tasky/web test:unit
```

- [ ] Exit criterion: the primary mobile UX is launch-ready for the PRD’s actual Phase 0/1 scope.

## Task 4: Quarantine Deferred Phase 2+ Surfaces

**Files:**
- Modify: deferred UI surfaces across [apps/mobile/src/app/(tasker)](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(tasker)) and [apps/web/src/pages/admin](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/src/pages/admin)
- Modify: feature toggle/config gates
- Modify: [docs/API.yaml](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/API.yaml)
- Modify: product docs that imply live readiness

- [ ] Inventory all client-visible flows that are contract-marked `x-tasky-status: deferred`.
- [ ] For each surface, choose one of: remove, hard-gate, or implement for real.
- [ ] Eliminate demo-only placeholders from launch-critical navigation.
- [ ] Re-run targeted integration tests for any touched routes and flows.
- [ ] Exit criterion: users can no longer reach misleading demo-only product surfaces in a production build.

## Task 5: Close Security, Privacy, and Auditability Gaps

**Files:**
- Modify: [src/main/java/mn/tasky/admin/api/AdminVerificationController.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/admin/api/AdminVerificationController.java)
- Modify: [src/main/java/mn/tasky/auth/application/AuthService.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/auth/application/AuthService.java)
- Modify: [src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java)
- Modify: [src/main/java/mn/tasky/common/audit](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/common/audit)
- Add: threat model, retention policy, data classification, incident response docs under `docs/`
- Add or modify verification/privacy tests

- [ ] Audit every verification-media read, list, download, approve, and reject path for immutable audit coverage.
- [ ] Ensure identity-media handling has a defined encryption-at-rest control and operational evidence.
- [ ] Implement or document queryable PII access logs as required for incident investigation.
- [ ] Add the missing governance artifacts required by doctrine before production.
- [ ] Re-run:

```bash
./gradlew --no-daemon test --tests mn.tasky.admin.AdminVerificationAuditTests
./gradlew --no-daemon test --tests mn.tasky.security.AuthorizationMatrixTests
./gradlew --no-daemon test --tests mn.tasky.OtpSecurityIntegrationTests
```

- [ ] Exit criterion: high-risk identity and admin moderation flows are fully auditable and policy-complete.

## Task 6: Harden Runtime Credentials and Data Boundaries

**Files:**
- Modify: [docker/init-db.sql](/home/norbu/projects/tasky/.worktrees/TASK-116/docker/init-db.sql)
- Modify: [docker-compose.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/docker-compose.yml)
- Modify: [src/main/resources/application.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/resources/application.yml)
- Modify: [src/main/resources/application-prod.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/resources/application-prod.yml)
- Modify: [.env.example](/home/norbu/projects/tasky/.worktrees/TASK-116/.env.example)

- [ ] Wire runtime DB access to the least-privilege application user rather than the owner credential path.
- [ ] Remove or clearly separate dev-grade defaults from production runtime guidance.
- [ ] Align env templates, compose, and Spring profiles so “prod” means deployable production semantics.
- [ ] Exit criterion: runtime credentials and env guidance satisfy least-privilege and secret-management doctrine.

## Task 7: Make the Web and Backend Release Artifacts Real

**Files:**
- Modify: [apps/web/Dockerfile](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/Dockerfile)
- Modify: [apps/web/tests/unit/token-binding.test.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/tests/unit/token-binding.test.tsx)
- Modify: [Dockerfile](/home/norbu/projects/tasky/.worktrees/TASK-116/Dockerfile) as needed
- Modify: [.github/workflows/quality-gates.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/quality-gates.yml)
- Modify: [.github/workflows/nightly-regression.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/nightly-regression.yml)

- [ ] Make the web build hermetic: web tests must not depend on mobile source visibility in the image build.
- [ ] Add backend and web image build gates to CI.
- [ ] Add image scanning for both release artifacts.
- [ ] Re-run:

```bash
docker build -t tasky-server:ci .
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
```

- [ ] Exit criterion: both deployable artifacts build and scan cleanly in CI.

## Task 8: Build a Real Production Operations Stack

**Files:**
- Add: deployable monitoring/alerting/tracing assets under `docker/`, `ops/`, or approved infra directories
- Modify: [scripts/performance-smoke.sh](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/performance-smoke.sh)
- Modify: workflow files to include meaningful smoke gates
- Add: release/deploy workflow(s)

- [ ] Add dashboards, alerts, and trace collection for auth, task posting, booking completion, disputes, and verification SLA.
- [ ] Replace health-only smoke tests with user-impacting endpoint checks.
- [ ] Add a release pipeline that publishes artifacts, validates deploy readiness, and supports rollback.
- [ ] Exit criterion: the repo contains an actual operational model, not just application emissions.

## Task 9: Strengthen Module and Architecture Enforcement

**Files:**
- Modify: [src/test/java/mn/tasky/architecture/ArchitectureTests.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/test/java/mn/tasky/architecture/ArchitectureTests.java)
- Modify: [src/main/java/mn/tasky/common/config/JdbiConfig.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/common/config/JdbiConfig.java)
- Modify: [docs/ARCHITECTURE.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/ARCHITECTURE.md)

- [ ] Expand boundary tests so modular-monolith claims are actually enforced.
- [ ] Reduce cross-domain registry coupling where practical, or explicitly document accepted coupling patterns.
- [ ] Bring architecture docs back into alignment with the real client/runtime stack.
- [ ] Exit criterion: architecture docs are trustworthy and key modular boundaries are tested, not implied.

## Task 10: Phase 2+ Capability Program

**Files:**
- Ticket backlog, phase plans, and deferred-surface docs

- [ ] After Tasks 1-9 are complete, generate a dedicated Phase 2 program covering OTP migration, monetization, referrals, B2B Lite, and admin pricing.
- [ ] Generate a dedicated Phase 3 program covering subscriptions, escrow, payouts, and stronger anti-leakage enforcement.
- [ ] Generate a dedicated Phase 4 program covering consumer subscriptions, alternate rails, and expansion.
- [ ] Exit criterion: later-phase work is explicitly staged instead of leaking into launch-critical product surfaces.

## Final Launch-Baseline Verification

When Tasks 1-9 are complete, run the full launch-baseline gate:

```bash
pnpm install --frozen-lockfile
pnpm -r lint
pnpm -r typecheck
pnpm -r test
./gradlew --no-daemon check openApiValidate
docker build -t tasky-server:release .
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
scripts/self-verify.sh --ticket <launch-ticket> --risk high --req <REQ-IDS> --ticket-spec tickets/<launch-ticket>.json
python3 scripts/validate-self-verify.py artifacts/self-verify.json docs/quality/self-verify.schema.json
```

Expected outcome:

- all policy gates pass
- both deployable artifacts build
- fresh verification evidence matches the exact ticket and risk
- release-signoff artifacts exist
- the system is launch-ready for the actual Phase 0/1 scope
