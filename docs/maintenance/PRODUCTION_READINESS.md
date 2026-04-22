# Production Readiness

**Status:** Canonical operational policy  
**Last updated:** 2026-04-22

## 1. Scope

This document defines the go / no-go rules for the verified Phase 1 launch baseline only.

## 2. Decision States

| State                  | Meaning                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `not ready`            | The repo, environments, or evidence still block safe launch movement.                          |
| `ready for staging`    | The repo is truthful and can be exercised in staging, but production signoff is still blocked. |
| `ready for production` | Launch baseline, verification, environments, observability, and rollback posture are ratified. |

Current assessed state on 2026-04-22:

- `ready for staging` for the private VPS sandbox path
- not `ready for production`

## 3. Current Production Blockers

1. No release-grade staging environment with real Facebook OAuth callback rehearsal.
2. No recorded live staging rehearsal evidence on a real host.
3. Remaining blocker-grade backend scenario gaps listed in the active QA registry flow.
4. Launch dashboarding and alert routing are not yet verified against a deployed environment.

## 4. Required Runtime Controls

The following controls must remain intact:

- health and readiness probes
- Prometheus metrics exposure
- structured logs with trace and correlation identifiers
- structured error envelopes
- auth-facing rate limiting
- idempotency on critical state-changing endpoints
- Facebook outage posture
- DB-backed feature toggles with auditability
- backup and restore scripts plus rehearsal evidence

## 5. Verification Trust

### 5.1 Local and CI

- Local baseline verification is documented in `AGENTS.md` and `docs/maintenance/OPERATING_MODEL.md`.
- PR CI truth is `quality-gates.yml`.
- Release gate truth is `release-gate.yml`.
- Nightly regression truth is `nightly-regression` plus `./gradlew gateRegression`.

### 5.2 Launch evidence expectations

- backend checks and frontend checks remain green at the appropriate gate
- unresolved blocker-grade scenario gaps are either closed or explicitly waived with signoff
- staging smoke / rehearsal evidence exists

## 6. Environment Readiness

- Private VPS sandbox deploy path remains working.
- Release-grade staging must run with production-like auth posture and reachable Facebook callbacks.
- Production secrets must remain outside the repository.
- Runtime dependencies must include Postgres + PostGIS, PgBouncer, S3-compatible storage, and Firebase credentials.

## 7. Launch KPI And Dashboard Gate

Production launch must not proceed without a real dashboard for all seven approved Phase 1 metrics:

1. Self-Serve Fulfillment Rate
2. Qualified Match Rate within 24h
3. Post -> Confirmed Booking Rate within 48h
4. Booking Completion Rate
5. Intervention Rate
6. Trust Failure Rate
7. Verification Queue Turnaround

Rules:

- Category is the primary KPI slice.
- District is drilldown.
- Alerts are required only for the four hard-gate metrics.
- KPI computation must come from backend-exported business metrics, not ad hoc dashboard SQL.

## 8. Incident Severity And Ownership

Tasky remains a founder-operated pilot.

- Primary owner: founder/operator

| Severity | Definition                              | Required action                                                            |
| -------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `SEV-1`  | Launch-critical flow unavailable        | Freeze deploys, announce incident, collect evidence, roll back immediately |
| `SEV-2`  | Core flow degraded but partially usable | Stop new releases, mitigate quickly, roll back if unstable                 |
| `SEV-3`  | Non-critical defect with workaround     | Record, prioritize, and fix in the maintenance lane                        |

## 9. Rollback Triggers

Roll back immediately if any of the following occur after deploy:

1. Real-user login or session refresh fails.
2. Task creation or booking confirmation shows sustained 5xx failures.
3. Admin cannot review verifications, moderate users, or resolve disputes.
4. Migration issues corrupt or block launch-critical flows.
5. Hard-gate KPI or operational alert thresholds breach in a sustained way during the launch window.

## 10. Exit Criteria For `ready for production`

The recommendation may move to `ready for production` only when:

1. A release-grade staging rehearsal has been executed and recorded.
2. Current production blockers are closed or explicitly waived with documented signoff.
3. Launch KPI dashboards and alert routing are live.
4. Backup, restore, and rollback have been rehearsed.
5. The Phase 1 baseline remains truthful: citywide Ulaanbaatar launch, no payment-protection promise, and later-phase
   toggles still off.
