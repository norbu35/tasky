# Production Readiness Audit and Remediation Design

## Objective

Assess the current Tasky system against project doctrine, the PRD, the architecture baseline, and the actual release pipeline; then define the target production-ready state and the remediation streams required to reach it.

## Scope

This audit covers:

- backend, web, mobile, shared packages, and deployment artifacts
- security/privacy controls and auditability
- OpenAPI and client/server contract integrity
- release engineering, CI gates, and runtime operability
- alignment with the PRD’s Phase 0/1 launch scope and the broader phased roadmap

This work is intentionally split into two targets:

1. **Launch-ready production baseline**
   The minimum state required to safely ship the currently intended Phase 0/1 marketplace.
2. **Full PRD completion program**
   The staged work needed to converge the product toward later Phase 2-4 commitments without pretending that all of that belongs in one release.

## Audit Method

Inputs reviewed:

- [AGENTS.md](/home/norbu/projects/tasky/.worktrees/TASK-116/AGENTS.md)
- [docs/PRD.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/PRD.md)
- [docs/ARCHITECTURE.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/ARCHITECTURE.md)
- [docs/API.yaml](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/API.yaml)
- existing remediation plan at [docs/plans/2026-03-27-audit-remediation-plan.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/plans/2026-03-27-audit-remediation-plan.md)
- current CI/release workflows under [.github/workflows](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows)
- current Docker/compose/runtime assets
- current verification evidence and local full-verification results from March 28, 2026

## Current-State Assessment

### 1. Release Readiness Verdict

The repository is **not production-ready** in its current state.

The immediate blockers are not isolated to one subsystem. They span:

- broken release gates
- broken or stale test expectations
- broken web release packaging
- incomplete security/audit controls for sensitive identity flows
- drift between the PRD, the architecture spec, the OpenAPI contract, and the shipped UI

### 2. Critical Findings

#### A. Security and Privacy

1. **PII reads in the admin verification queue are not fully audited.**
   The pending-verifications list returns decrypted phone numbers and presigned identity-media URLs without corresponding audit events. This violates the project’s auditability doctrine and the PRD privacy baseline.
   Key evidence:
   - [src/main/java/mn/tasky/admin/api/AdminVerificationController.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/admin/api/AdminVerificationController.java)
   - [src/main/java/mn/tasky/auth/application/AuthService.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/auth/application/AuthService.java)
   - [docs/PRD.md:878](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/PRD.md#L878)

2. **Verification approval and rejection are high-risk identity transitions without immutable audit coverage.**
   Reads are partially audited; approve/reject state changes are not.
   Key evidence:
   - [src/main/java/mn/tasky/admin/api/AdminVerificationController.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/admin/api/AdminVerificationController.java)
   - [src/test/java/mn/tasky/admin/AdminVerificationAuditTests.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/test/java/mn/tasky/admin/AdminVerificationAuditTests.java)

3. **Encryption-at-rest for identity media is not demonstrated.**
   Phone fields use application crypto, but object storage for ID images has no visible SSE/KMS/bucket-encryption enforcement in the runtime path.
   Key evidence:
   - [src/main/java/mn/tasky/common/security/CryptoService.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/common/security/CryptoService.java)
   - [src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java)
   - [docker-compose.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/docker-compose.yml)

4. **Required governance artifacts for production security are missing or not discoverable.**
   The repo does not currently present the required threat model, data-classification policy, retention/deletion policy, or incident-response playbook that `AGENTS.md` requires before production.

#### B. Contract and Product Integrity

1. **The mobile app, which doctrine defines as the primary UX, is not aligned with the MVP Phase 0/1 scope.**
   Mobile auth is not real Facebook OAuth, and mobile task posting does not yet implement schema-driven intake comparable to web.
   Key evidence:
   - [apps/mobile/src/app/(auth)/index.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(auth)/index.tsx)
   - [apps/mobile/src/features/auth/components/LoginForm.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/features/auth/components/LoginForm.tsx)
   - [apps/mobile/src/app/(customer)/tasks/new/intake.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(customer)/tasks/new/intake.tsx)
   - [apps/web/src/components/task-creation/IntakeFormRenderer.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/src/components/task-creation/IntakeFormRenderer.tsx)

2. **The OpenAPI contract is not authoritative enough to catch response-shape drift.**
   Example: the API spec documents `phone_masked`, while the server returns `phone`.
   Key evidence:
   - [docs/API.yaml:188](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/API.yaml#L188)
   - [src/main/java/mn/tasky/user/dto/ProfileResponse.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/main/java/mn/tasky/user/dto/ProfileResponse.java)
   - [src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java](/home/norbu/projects/tasky/.worktrees/TASK-116/src/test/java/mn/tasky/contract/OpenApiSpringParityTests.java)

3. **Deferred Phase 2+/3 capabilities are surfaced in UI as if they are available.**
   Credits, referrals, subscriptions, DAN verification, and lead-pricing management are partially demo-only or client-local despite being explicitly deferred in the contract.
   Key evidence:
   - [docs/API.yaml](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/API.yaml)
   - [apps/mobile/src/app/(tasker)/credits/index.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(tasker)/credits/index.tsx)
   - [apps/mobile/src/app/(tasker)/subscription.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/mobile/src/app/(tasker)/subscription.tsx)
   - [apps/web/src/pages/admin/AdminLeadPricingPage.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/src/pages/admin/AdminLeadPricingPage.tsx)

4. **Messaging and notifications are below PRD parity on the clients.**
   The backend has real messaging primitives, but web chat/inbox remains scaffolded and mobile notifications are still mock-backed.

#### C. Release Engineering and Runtime Readiness

1. **The documented PR workflow is currently impossible to satisfy.**
   CI requires [docs/BACKLOG.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/BACKLOG.md) even though the repo says the legacy backlog was intentionally not restored, and it requires a compatibility marker missing from [CLAUDE.md](/home/norbu/projects/tasky/.worktrees/TASK-116/CLAUDE.md).
   Key evidence:
   - [.github/workflows/quality-gates.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/quality-gates.yml)
   - [scripts/validate-backlog.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-backlog.py)
   - [scripts/validate-compat-docs.py](/home/norbu/projects/tasky/.worktrees/TASK-116/scripts/validate-compat-docs.py)

2. **Self-verification can certify stale or mismatched evidence.**
   CI only verifies that `artifacts/self-verify.json` exists and then trusts its embedded ticket/risk metadata, even if the artifact belongs to another ticket.
   Key evidence:
   - [artifacts/self-verify.json](/home/norbu/projects/tasky/.worktrees/TASK-116/artifacts/self-verify.json)
   - [docs/agent/WORK_LOG.md](/home/norbu/projects/tasky/.worktrees/TASK-116/docs/agent/WORK_LOG.md)
   - [.github/workflows/quality-gates.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/quality-gates.yml)

3. **The web release artifact is broken and CI does not catch it.**
   The web Docker build fails because a web unit test imports mobile source, but CI only builds/scans the backend image.
   Key evidence:
   - [apps/web/Dockerfile](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/Dockerfile)
   - [apps/web/tests/unit/token-binding.test.tsx](/home/norbu/projects/tasky/.worktrees/TASK-116/apps/web/tests/unit/token-binding.test.tsx)
   - [.github/workflows/quality-gates.yml](/home/norbu/projects/tasky/.worktrees/TASK-116/.github/workflows/quality-gates.yml)

4. **There is no actual release pipeline.**
   The repo has PR gates and a nightly regression, but no image publish, deploy promotion, rollback validation, or release-signoff workflow.

5. **Observability stops at emission.**
   The system exposes logs, metrics, and product-event emission, but it does not yet define the operational stack needed to act on them: dashboards, alert routing, traces, or deployable monitoring assets.

### 3. High and Medium Findings

#### Architecture and Ops

- Least-privilege runtime DB credentials are designed but not wired. `tasky_app` exists, but runtime still uses owner-level env vars.
- Backend static analysis and linting are not enforced in the normal low/medium-risk verification paths.
- `performance-smoke.sh` tests `/actuator/health`, not user-impacting endpoints.
- The architecture doc has drifted from implementation in places such as mobile navigation and runtime profile guidance.
- Modular boundaries are mostly conventional; ArchUnit enforcement is still narrow.

#### Testing and Verification

- Current frontend suites are red due to stale expectations and route-copy drift.
- The mobile intake route test is outdated relative to the current parameter contract.
- The web route/integration tests and the web Docker build indicate that packaging and test boundaries have diverged.

#### Product Analytics

- Product event emission exists, but the KPI/reporting layer is below the PRD’s observability needs for launch and monetization decisions.
- Leakage indicators, review completion, verification SLA reporting, and intake observability are not yet materially represented as operator-facing metrics.

## Root-Cause Themes

The findings cluster into five systemic causes:

1. **Contract drift**
   The server, clients, tests, and spec are no longer moving as one unit.

2. **Phase drift**
   Deferred or later-phase product surfaces are leaking into the current UX without the backend and release readiness to support them.

3. **Release-gate drift**
   Repo policy, validator scripts, and workflows no longer agree on what the canonical planning and verification artifacts are.

4. **Security completeness drift**
   Sensitive flows have partial controls, but not complete end-to-end auditability and operational evidence.

5. **Operations drift**
   Deployment assets exist, but production operations requirements have not been fully codified into runnable infrastructure and release automation.

## Target State

### 1. Launch-Ready Production Baseline

The system is considered launch-ready only when all of the following are true:

- mobile and web both implement the actual Phase 0/1 customer and tasker journeys
- OpenAPI is authoritative for live endpoint paths and payload/response schemas
- security-sensitive flows (auth, verification, dispute, payout, admin moderation) are fully auditable
- identity media handling has demonstrated encryption-at-rest and retention coverage
- CI gates are internally consistent and reproducible locally
- backend and web release artifacts both build successfully in CI
- release automation exists for build, publish, deploy, rollback, and signoff
- observability includes deployable dashboards, alerts, and traces for critical flows

### 2. Full PRD Completion Program

The full PRD target is broader than a single launch. It must be modeled as staged production-hardening plus phased capability delivery:

- **Baseline launch**: safe Phase 0/1 marketplace
- **Phase 2**: monetization and OTP migration behind real feature gating
- **Phase 3**: subscriptions, escrow, payouts, and anti-leakage enforcement
- **Phase 4**: consumer subscriptions, alternate rails, and multi-city expansion

No single implementation branch or one-pass plan should attempt to deliver all PRD phases at once.

## Remediation Strategy

### Workstream A: Repair the Release-Gate System

Align validator scripts, canonical planning artifacts, self-verify provenance, and CI expectations so the repo can produce trustworthy green signals again.

### Workstream B: Re-establish Contract Authority

Restore a single source of truth between `docs/API.yaml`, generated SDK types, server DTOs, client request/response types, and parity tests.

### Workstream C: Complete the Mobile-First Core Product

Bring mobile auth, structured intake, task posting, notifications, messaging, and launch-critical parity up to the level already promised in doctrine and PRD.

### Workstream D: Close Security and Auditability Gaps

Harden verification media access, approval/rejection auditing, storage encryption evidence, retention policies, threat modeling, and PII incident response.

### Workstream E: Make Deployment and Operations Real

Ship usable release automation, least-privilege runtime credentials, meaningful smoke/performance checks, and an actual observability stack.

### Workstream F: Quarantine Deferred Surfaces and Plan Later Phases

Remove or clearly gate demo-only/deferred UI surfaces, then plan Phase 2+ capability delivery as a separate program once the launch baseline is safe.

## Release Gates for the Launch Baseline

Before any production deployment, the repo must satisfy:

1. `workflow-integrity` passes without special-casing stale docs.
2. `pnpm -r lint`, `pnpm -r typecheck`, and `pnpm -r test` pass.
3. `./gradlew --no-daemon check openApiValidate` passes.
4. Backend and web production images both build in CI.
5. Trivy and Semgrep pass at the required severities.
6. A fresh self-verify artifact exists for the exact ticket/branch and matches CI parity.
7. Rollback, restore, and release-signoff artifacts exist and are validated.
8. Observability dashboards and alerts exist for auth, task posting, booking completion, dispute creation, and verification SLA.

## Program Recommendation

Treat this as a **production-readiness program**, not a single feature. The right execution order is:

1. Release-gate integrity
2. Contract integrity
3. Mobile-first Phase 0/1 completion
4. Security/privacy closure
5. Deployment/operations completion
6. Deferred-feature quarantine
7. Phase 2+ capability implementation

That sequencing minimizes false-green releases, prevents later-phase surfaces from masking current-state risk, and aligns the codebase with the project’s stated doctrine.
