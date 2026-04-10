# Production Readiness

Last updated: 2026-04-10

## Scope

This document defines the production go/no-go rules for the verified Phase 1 launch baseline only.

It uses the tranche outcomes from:

- `docs/quality/launch-baseline-2026-04.md`
- `docs/quality/capability-matrix.md`
- `docs/quality/test-trust-audit.md`
- `docs/quality/verification-matrix.md`
- `docs/quality/staging-rehearsal-2026-04.md`

## Decision States

| State                  | Meaning                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `not ready`            | The repo, environments, or verification evidence still block safe launch movement.                           |
| `ready for staging`    | The repo is truthful and can be exercised in a staging environment, but production signoff is still blocked. |
| `ready for production` | Launch baseline, verification, environments, observability, and rollback posture are all ratified.           |

Current assessed state on 2026-04-10:

- `ready for staging` for the private VPS sandbox path
- not `ready for production`

## Current Production Blockers

Production remains blocked until these are closed:

1. No release-grade staging environment exists yet. The repo now supports a private VPS sandbox, but there is still no
   public or allowlisted HTTPS environment with `dev-auth` disabled and real Facebook OAuth callback rehearsal.
2. No live staging rehearsal evidence exists yet. `docs/quality/staging-rehearsal-2026-04.md` is still blocked on a
   real host.
3. The test-trust audit still records missing blocker-grade backend scenario families for:
   - verification-gated tasker activation (`REQ-P1-AUTH-04`)
   - verification workflow lifecycle (`REQ-P1-SAFE-01`)
   - Pro badge automatic assignment (`REQ-P1-SAFE-05`)
   - admin feature-toggle management (`REQ-P1-ADMIN-03`)
   - admin ban/unban (`REQ-P1-ADMIN-04`)
   - concierge dispatch backend proof inside `REQ-P1-ADMIN-05`
4. Live alert routing, dashboard wiring, and incident evidence are not yet proven against a real deployed stack.

## Required Runtime Controls

These controls already exist in the repo and must remain intact through staging and production:

| Control                     | Current truth                                                                    | Source                                                                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liveness / readiness health | `/actuator/health`, readiness group, and liveness group are enabled.             | `services/api/src/main/resources/application.yml`                                                                                                                                                                                                 |
| Prometheus metrics          | Actuator exposes `metrics` and `prometheus`.                                     | `services/api/src/main/resources/application.yml`                                                                                                                                                                                                 |
| Correlation and trace IDs   | Request observability filter populates MDC with `correlation_id` and `trace_id`. | `services/api/src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java`                                                                                                                                                        |
| Structured error envelopes  | Protected-route errors include `code`, `message`, and `trace_id`.                | `services/api/src/test/java/mn/tasky/contract/ContractEnvelopeTests.java`                                                                                                                                                                         |
| Rate limiting               | Public/auth-facing rate-limit filters exist.                                     | `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`, `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`, `services/api/src/main/java/mn/tasky/auth/application/FacebookRateLimitService.java` |
| Idempotency                 | Critical state-changing endpoints use idempotency keys and replay protection.    | `services/api/src/main/java/mn/tasky/common/idempotency/**`                                                                                                                                                                                       |
| OAuth outage posture        | Facebook circuit breaker and probe exist.                                        | `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`, `services/api/src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`                                                                        |
| Feature toggles             | DB-backed feature toggles and audit logging exist.                               | `services/api/src/main/java/mn/tasky/common/feature/**`                                                                                                                                                                                           |
| Backups / restore           | Operator scripts exist, but production rehearsal is still required.              | `docker/backup.sh`, `docker/restore.sh`                                                                                                                                                                                                           |

## Go / No-Go Checklist

### 1. Product and scope truth

- `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/API.yaml` reflect the verified Phase 1 launch baseline.
- Later-phase capabilities remain classified per the capability matrix, not by UI presence or seeded toggles.
- All launch toggles remain in the Phase 1 dormant posture from `docs/quality/launch-baseline-2026-04.md`.

### 2. Verification trust

- `./gradlew --no-daemon gateRegression` passes.
- `pnpm -r typecheck` passes.
- Direct web and mobile unit/integration suites remain green per `docs/quality/test-trust-audit.md`.
- Playwright smoke and Maestro smoke pass in CI or staging-equivalent infrastructure.
- The unresolved missing blocker-grade backend scenario families listed above are either implemented or explicitly
  waived with documented product signoff.

### 3. Environment readiness

- Private VPS sandbox deploy path remains working.
- Release-grade staging exists with:
  - `SPRING_PROFILES_ACTIVE=prod`
  - `TASKY_DEV_AUTH_ENABLED=false`
  - `VITE_DEV_AUTH_ENABLED=false`
  - `EXPO_PUBLIC_DEV_AUTH_ENABLED=false`
  - real Facebook callback reachability
- Staging rehearsal evidence is attached in `docs/quality/staging-rehearsal-2026-04.md`.

### 4. Secrets and dependency posture

- Production secrets are generated and stored outside the repository.
- Required production secrets are present:
  - `TASKY_JWT_SECRET`
  - `TASKY_ENCRYPTION_KEY`
  - `TASKY_BLIND_INDEX_KEY`
  - `TASKY_QPAY_WEBHOOK_SECRET`
  - `TASKY_FACEBOOK_APP_ID`
  - `TASKY_FACEBOOK_APP_SECRET`
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
- Runtime dependencies are provisioned:
  - Postgres + PostGIS
  - PgBouncer
  - S3-compatible storage
  - Firebase push credentials

### 5. Observability and launch control

- Health endpoints and Prometheus scraping are enabled in the deployed environment.
- The KPI and alert thresholds in `docs/METRICS.md` are wired to a real dashboard.
- Incident owner and rollback operator are named for the launch window.

### 6. Rollback readiness

- A fresh logical backup exists before the production cutover.
- The previous deploy artifact or image reference is retained.
- Toggle posture for dormant features is captured before deploy.
- Rollback triggers and operator actions below are understood and rehearsed.

## Launch KPIs And Operator Thresholds

The authoritative KPI definitions live in `docs/METRICS.md`. Production launch should not proceed without dashboarding
for:

- liquidity score
- task post to confirmed booking conversion
- booking completion rate
- review completion rate
- verification queue turnaround time
- dispute resolution time
- repeat booking rate

## Incident Severity And Ownership

Tasky is still a founder-operated pilot. Until a larger team exists, all launch accountability belongs to one explicit
role:

- Primary owner: founder/operator

Severity model:

| Severity | Definition                                                                                                                       | Required action                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `SEV-1`  | Launch-critical flow unavailable: login, task posting, applicant confirmation, booking completion, or admin moderation unusable. | Freeze deploys, announce incident, collect logs/metrics, and roll back immediately.        |
| `SEV-2`  | Core flow degraded but partially usable: elevated 5xx rate, push delivery broken, or major admin latency.                        | Stop new releases, mitigate within the active window, roll back if not stabilized quickly. |
| `SEV-3`  | Non-critical defect or isolated feature issue with a workaround.                                                                 | Record, prioritize, and fix in the normal maintenance lane.                                |

## Rollback Triggers

Roll back immediately if any of the following are observed after deploy:

1. Login or session refresh fails for real users.
2. Task creation or booking confirmation returns repeated 5xx responses.
3. Admin cannot review verifications, moderate users, or resolve disputes.
4. Database migration corrupts or blocks launch-critical flows.
5. Error rate exceeds the threshold defined in `docs/METRICS.md` for a sustained window.
6. OAuth outage posture fails closed incorrectly and strands valid sessions.

## Rollback Actions

1. Freeze further deploys and toggle changes.
2. Capture health output, relevant logs, and Prometheus snapshots.
3. Revert application containers to the previous known-good version.
4. Restore from the fresh pre-deploy backup if schema or data integrity is affected.
5. Re-run launch smoke before reopening traffic.
6. Record the incident and disposition in the current readiness report or incident log.

## Exit Criteria For `ready for production`

The recommendation may move from `ready for staging` to `ready for production` only when:

1. A release-grade staging rehearsal has been executed and recorded.
2. Production blockers listed above are closed or explicitly waived with documented signoff.
3. Launch KPI dashboards and alert routing are live.
4. Backup, restore, and rollback have been rehearsed.
5. The launch baseline remains Phase 1 only, with later-phase toggles still off.
