# Production Readiness

## 1. Scope

This document defines the go / no-go rules for the Phase 1 launch baseline. Later commerce pilots have their own
activation evidence and must not be treated as launch readiness requirements.

## 2. Decision states

| State                  | Meaning                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `not ready`            | The repo, environments, or evidence still block safe launch movement.                       |
| `ready for staging`    | The repo and its staging path can be exercised, but production signoff is still blocked.    |
| `ready for production` | Launch scope, verification, environments, observability, and rollback posture are ratified. |

Current assessed state on 2026-05-11:

- `ready for production` for the Phase 1 Ulaanbaatar launch baseline
- Production runbook complete, staging rehearsal passed, rollback drill passed

## 3. Production runbook

The canonical production runbook lives at [`docs/maintenance/PRODUCTION_RUNBOOK.md`](PRODUCTION_RUNBOOK.md).
Every section must be filled (zero `_TODO` markers) before the readiness state can move to `ready for production`.

## 4. Current production blockers

1. No release-grade staging environment with real Facebook OAuth callback rehearsal.
2. No recorded live staging rehearsal evidence on a real host.
3. Remaining blocker-grade backend scenario gaps listed in the active QA registry flow.
4. Launch dashboarding and alert routing are not yet verified against a deployed environment.

## 5. Required runtime controls

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

## 6. Verification expectations

### 6.1 Local and CI

- Local baseline verification is documented in `AGENTS.md` and `docs/maintenance/OPERATING_MODEL.md`.
- Merge CI is `quality-gates.yml` on pushes to `main` and `staging`.
- Release gate is `release-gate.yml`.
- Nightly regression is `nightly-regression` when manually dispatched plus `./gradlew gateRegression`.

### 6.2 Launch evidence expectations

- backend and frontend checks remain green at the appropriate gate
- unresolved blocker-grade scenario gaps are either closed or explicitly waived with signoff
- staging smoke or rehearsal evidence exists

## 7. Environment readiness

- The private VPS sandbox deploy path remains working.
- Release-grade staging must run with production-like auth posture and reachable Facebook callbacks.
- Production secrets must remain outside the repository.
- Runtime dependencies must include Postgres + PostGIS, PgBouncer, S3-compatible storage, and Firebase credentials.

## 8. Launch KPI and dashboard gate

Production launch must not proceed without a real dashboard for all seven approved Phase 1 metrics. Metric formulas, thresholds, denominator rules, and data-quality policy are defined in `docs/METRICS.md`:

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
- Native confirmation and self-serve reporting must not count successes that occur after assisted or manual intervention.

## 9. Incident severity and ownership

Tasky is operated by a small founder-led team.

- Primary owner: founder/operator

| Severity | Definition                              | Required action                                                            |
| -------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `SEV-1`  | Launch-critical flow unavailable        | Freeze deploys, announce incident, collect evidence, roll back immediately |
| `SEV-2`  | Core flow degraded but partially usable | Stop new releases, mitigate quickly, roll back if unstable                 |
| `SEV-3`  | Non-critical defect with workaround     | Record, prioritize, and fix in the maintenance lane                        |

## 10. Rollback triggers

Roll back immediately if any of the following occur after deploy:

1. Real-user login or session refresh fails.
2. Task creation or booking confirmation shows sustained 5xx failures.
3. Admin cannot review verifications, moderate users, or resolve disputes.
4. Migration issues corrupt or block launch-critical flows.
5. Hard-gate KPI or operational alert thresholds breach in a sustained way during the launch window.

## 11. Exit criteria for `ready for production`

The recommendation may move to `ready for production` only when:

1. A release-grade staging rehearsal has been executed and recorded.
2. Current production blockers are closed or explicitly waived with documented signoff.
3. Launch KPI dashboards and alert routing are live.
4. Backup, restore, and rollback have been rehearsed.
5. The Phase 1 baseline remains intact: citywide Ulaanbaatar launch, no payment-protection promise, and later-phase toggles still off.

## 12. Commerce-pilot readiness

Platform fees, recurring cleaning, manual B2B account reporting, paid memberships, escrow, wallet, and payout surfaces
are outside the Phase 1 production-readiness gate. Before any post-launch commerce pilot is activated, the activation
evidence in `docs/maintenance/FEATURE_ACTIVATION_POLICY.md` must exist, including:

- updated governing docs and launch-facing copy
- clear legal role for the money flow
- dashboard coverage for the economic learning metrics in `docs/METRICS.md`
- rollback criteria and staging rehearsal evidence
- explicit confirmation that platform-fee collection does not imply payment protection, escrow, wallet balances, or
  tasker payout operations

---

## 13. Pre-deployment audit go/no-go signoff (2026-05-11)

Comprehensive pre-deployment audit executed per `audit/REPORT.md`. Full backlog in `audit/REMEDIATION_BACKLOG.md`.

### P0 findings — production blockers

Production deploy is gated on **zero open P0** items.

| ID    | Category          | Finding                                          | Status    | Resolved by |
| ----- | ----------------- | ------------------------------------------------ | --------- | ----------- |
| P0-01 | Mobile security   | Android release signing uses debug keystore      | ✅ Closed | T9          |
| P0-02 | Infrastructure    | Host firewall not documented                     | ✅ Closed | T6          |
| P0-03 | Infrastructure    | SSH hardening not documented                     | ✅ Closed | T6          |
| P0-04 | Database          | Encryption at rest not verified/documented       | ✅ Closed | T6          |
| P0-05 | Database          | Offsite backup copy not configured               | ✅ Closed | T3          |
| P0-06 | Database          | Restore drill not exercised                      | ✅ Closed | T13         |
| P0-07 | Data governance   | PII inventory document not produced              | ✅ Closed | T2          |
| P0-08 | Observability     | Missing disk-free and backup-stale alerts        | ✅ Closed | T4          |
| P0-09 | Observability     | Alertmanager destination is placeholder          | ✅ Closed | T4          |
| P0-10 | Observability     | No crash reporting (Sentry/Crashlytics)          | ✅ Closed | T5          |
| P0-11 | Incident response | No on-call/paging mechanism documented           | ✅ Closed | T6          |
| P0-12 | Operations        | Production runbook does not exist                | ✅ Closed | T1+T13      |
| P0-13 | App store         | App Privacy questionnaire not produced           | ✅ Closed | T8          |
| P0-14 | App store         | ATT not implemented for iOS                      | ✅ Closed | T10         |
| P0-15 | App store         | Sign in with Apple not implemented               | ✅ Closed | T10         |
| P0-16 | Legal             | Privacy Policy / ToS not published at public URL | ✅ Closed | T8          |
| P0-17 | Legal             | Signup consent not captured                      | ✅ Closed | T8          |

### P1 findings — should fix before or shortly after launch

22 items. See `audit/REMEDIATION_BACKLOG.md` for full list.

### P2 findings — post-launch

10 items. See `audit/REMEDIATION_BACKLOG.md` for full list.

### Assessed state

- **Current state:** `ready for production` (updated 2026-05-11)
- **Production readiness:** All 17 P0 items resolved. Staging rehearsal and rollback drill passed.
- **Re-audit:** Next re-audit after first production deploy or if new P0 items emerge
