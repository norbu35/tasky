# Remediation Backlog

**Generated:** 2026-05-11  
**Source:** `audit/REPORT.md` pre-deployment audit  
**Deployment target:** Single VPS, docker-compose, Phase 1 launch baseline

---

## P0 — Must Fix Before Production (17 items)

### P0-01: Configure Android production release signing

- **Section:** §4.8
- **Owner:** Mobile developer / operator
- **Acceptance criteria:**
  1. `android/app/build.gradle` has a `signingConfigs.release` block reading from environment variables or a gitignored `keystore.properties`
  2. Debug keystore is NOT used for release builds
  3. Play App Signing is configured in Google Play Console
  4. Production keystore is stored in a password manager with rotation policy documented
- **Estimated effort:** S (1–2 hours)
- **Files:** `apps/mobile/android/app/build.gradle`, new `apps/mobile/android/keystore.properties` (gitignored)

### P0-02: Document host firewall configuration

- **Section:** §5.5, §9
- **Owner:** Operator
- **Acceptance criteria:**
  1. `docs/maintenance/PRODUCTION_RUNBOOK.md` exists
  2. Contains ufw/nftables rules: allow 22/80/443, deny everything else inbound
  3. Operator has applied rules on the production VPS
- **Estimated effort:** S (1–2 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md` (new)

### P0-03: Document SSH hardening

- **Section:** §5.6, §9
- **Owner:** Operator
- **Acceptance criteria:**
  1. Production runbook documents: key-only auth, no root login, fail2ban installed, optional port change
  2. Operator has applied settings on the production VPS
- **Estimated effort:** S (1–2 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md`

### P0-04: Enable and document encryption at rest

- **Section:** §6.4
- **Owner:** Operator
- **Acceptance criteria:**
  1. LUKS enabled on VPS data volume, OR provider-side encryption confirmed
  2. Documented in production runbook with encryption type and key management
- **Estimated effort:** M (2–4 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md`

### P0-05: Configure offsite backup copy

- **Section:** §6.6
- **Owner:** Operator
- **Acceptance criteria:**
  1. `backup-cron` or a separate script uploads each dump to an offsite destination (MinIO geo-replica, B2, S3, or R2)
  2. Offsite credentials are separate from VPS credentials
  3. RPO/RTO documented: RPO ≤ 1 hour (hourly dumps + WAL), RTO < 4 hours
  4. Offsite restore tested at least once
- **Estimated effort:** M (3–5 hours)
- **Files:** `docker/backup.sh` (update), `docs/maintenance/PRODUCTION_RUNBOOK.md`

### P0-06: Execute and document restore drill

- **Section:** §6.7
- **Owner:** Operator
- **Acceptance criteria:**
  1. A recent dump is restored to a clean environment or test container
  2. Application connects to the restored database and serves requests
  3. Result documented with timestamp, dump file used, and time taken
- **Estimated effort:** S (1–2 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md` (add drill evidence section)

### P0-07: Produce PII inventory document

- **Section:** §6.10
- **Owner:** Backend developer
- **Acceptance criteria:**
  1. One-page document listing every column containing PII (email, phone, address, lat/lng, payment IDs, Facebook ID, ID card images, messages)
  2. Each column has its encryption/blind-index status noted
  3. Document is in `docs/maintenance/PII_INVENTORY.md`
- **Estimated effort:** S (1–2 hours)
- **Files:** `docs/maintenance/PII_INVENTORY.md` (new)

### P0-08: Add missing operational alerts

- **Section:** §8.3
- **Owner:** Backend developer / operator
- **Acceptance criteria:**
  1. `tooling/observability/prometheus/alerts/tasky-alerts.yml` adds:
     - `DiskFreeLow`: data volume free < 20% for 5 min
     - `BackupStale`: backup cron last success > 90 min (requires backup success metric export)
  2. Each alert has severity label, summary, description, and runbook_url
- **Estimated effort:** S (1–2 hours)
- **Files:** `tooling/observability/prometheus/alerts/tasky-alerts.yml`

### P0-09: Configure real alert destination

- **Section:** §8.3
- **Owner:** Operator
- **Acceptance criteria:**
  1. `tooling/observability/alertmanager/alertmanager.yml` has a real webhook URL (Telegram bot, PagerDuty, OpsGenie, or email)
  2. `__ALERT_WEBHOOK_URL__` template is replaced with the actual URL at runtime via the `start-alertmanager.sh` script
  3. Test alert fires and reaches the destination
- **Estimated effort:** S (1–2 hours)
- **Files:** `tooling/observability/alertmanager/alertmanager.yml`, env var configuration

### P0-10: Add crash reporting (Sentry or Firebase Crashlytics)

- **Section:** §8.7
- **Owner:** Frontend/mobile developer
- **Acceptance criteria:**
  1. Sentry or Firebase Crashlytics SDK integrated in mobile app
  2. Source maps uploaded for web app (if Sentry)
  3. DSN/key loaded from environment, not committed
  4. Test crash event visible in dashboard
- **Estimated effort:** M (3–5 hours)
- **Files:** `apps/mobile/package.json`, `apps/mobile/src/`, `apps/web/` (if adding Sentry to web)

### P0-11: Document on-call/paging mechanism

- **Section:** §8.8
- **Owner:** Operator
- **Acceptance criteria:**
  1. Production runbook documents escalation contacts (founder + one backup)
  2. A paging channel exists and is tested (Telegram bot, PagerDuty, OpsGenie, or phone tree)
  3. Alertmanager routes critical alerts to this channel
- **Estimated effort:** S (1–2 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md`

### P0-12: Create production runbook

- **Section:** §9
- **Owner:** Operator
- **Acceptance criteria:**
  1. `docs/maintenance/PRODUCTION_RUNBOOK.md` exists and covers:
     - Bootstrap (VPS provisioning, Docker install, env setup)
     - Deploy procedure (manual or CI/CD trigger)
     - Rollback procedure
     - Backup verification
     - Incident response (SEV-1/2/3 procedures)
     - Key rotation (JWT secret, encryption key, blind index key)
  2. Operator has reviewed and approved
- **Estimated effort:** L (5–8 hours)
- **Files:** `docs/maintenance/PRODUCTION_RUNBOOK.md` (new)

### P0-13: Produce App Privacy questionnaire (both stores)

- **Section:** §10 (Apple + Google)
- **Owner:** Product / operator
- **Acceptance criteria:**
  1. One-page mapping: data type → collection purpose → linked to user → encrypted in transit → deletion mechanism
  2. Covers: name, phone, email, Facebook ID, location, ID card images, device info, photos, messages
  3. Completed in App Store Connect and Google Play Console Data Safety form
- **Estimated effort:** M (2–4 hours)

### P0-14: Implement ATT for iOS (App Tracking Transparency)

- **Section:** §10
- **Owner:** Mobile developer
- **Acceptance criteria:**
  1. `expo-tracking-transparency` or equivalent plugin added
  2. `NSUserTrackingUsageDescription` added to Info.plist with user-facing string in English + Mongolian
  3. ATT prompt shown before any Facebook SDK initialization
  4. Facebook SDK only initialized after user grants tracking permission
- **Estimated effort:** S (2–3 hours)
- **Files:** `apps/mobile/app.config.ts`, `apps/mobile/ios/Tasky/Info.plist`, `apps/mobile/src/`

### P0-15: Implement Sign in with Apple

> **DEFERRED** — Not in PRD for Phase 1. Apple Sign-In was implemented and then removed (2026-05-11 security remediation) after audit found 3 Critical vulnerabilities in the implementation. Revisit only when PRD explicitly includes this feature. ATT (P0-14) remains in scope when Facebook Login ships on iOS.

### P0-16: Publish Privacy Policy and Terms of Service at public URL

- **Section:** §11
- **Owner:** Product / legal / operator
- **Acceptance criteria:**
  1. Privacy Policy published at `https://tasky.mn/privacy` (or equivalent)
  2. Terms of Service published at `https://tasky.mn/terms` (or equivalent)
  3. Content covers all required sections per §11 (data controller, purposes, legal basis, third parties, retention, user rights, cross-border transfer, children's policy, contact)
  4. Content available in English + Mongolian
  5. URL linked from app store listings and from mobile app legal screens
  6. Privacy policy based on PII inventory from P0-07
- **Estimated effort:** L (5–8 hours)
- **Files:** Web legal pages, mobile app legal screens, store listing metadata

### P0-17: Capture signup consent (ToS/Privacy version + timestamp)

- **Section:** §11
- **Owner:** Backend + frontend developer
- **Acceptance criteria:**
  1. Registration/login flow records user consent to ToS and Privacy Policy with version string and timestamp
  2. Consent record stored in database (new `user_consents` table or column in `users`)
  3. Audit event emitted: `TOS_CONSENT_ACCEPTED` with policy version
  4. Frontend presents ToS/Privacy acceptance checkbox or continued-use notice before account creation
- **Estimated effort:** M (3–5 hours)
- **Files:** Backend: auth flow, new migration. Mobile: signup screen. Web: signup page.

---

## P1 — Should Fix Before or Shortly After Launch (22 items)

### P1-01: Document production secret injection mechanism

- **Section:** §1.5
- **Acceptance criteria:** Production runbook documents: `.env` file with chmod 600, owned by deploy user, never committed. Or systemd EnvironmentFile mechanism.
- **Effort:** S (30 min)

### P1-02: Document blind index key rotation procedure

- **Section:** §1.6
- **Acceptance criteria:** Production runbook documents rotation steps: (1) maintenance window, (2) generate new key, (3) re-encrypt blind indexes, (4) update env, (5) restart.
- **Effort:** S (1 hour)

### P1-03: Pin Docker base images to digests

- **Section:** §2.1
- **Acceptance criteria:** All `FROM` lines in Dockerfiles use `@sha256:...` digest pinning.
- **Effort:** S (1 hour)

### P1-04: Add healthcheck to web container

- **Section:** §2.1
- **Acceptance criteria:** `apps/web/Dockerfile` or `docker-compose.production.yml` web service has a `HEALTHCHECK` or `healthcheck:` block.
- **Effort:** S (30 min)

### P1-05: Add SBOM generation to CI pipeline

- **Section:** §2.6
- **Acceptance criteria:** `build-and-push.yml` generates CycloneDX SBOM artifacts for api and web images.
- **Effort:** S (1–2 hours)

### P1-06: Fill audit log gaps (login, logout, auth events)

- **Section:** §3.9
- **Acceptance criteria:** Audit events emitted for: login success/failure, logout, token refresh, Facebook auth attempt.
- **Effort:** M (3–4 hours)

### P1-07: Verify source-map exposure is disabled

- **Section:** §4.4
- **Acceptance criteria:** Confirm `build.sourcemap` is false in production builds, or add a Caddy rule to block `*.map` requests.
- **Effort:** S (30 min)

### P1-08: Add Android network security config

- **Section:** §4.7
- **Acceptance criteria:** `android/app/src/main/res/xml/network_security_config.xml` exists with `cleartextTrafficPermitted="false"`. Referenced in `AndroidManifest.xml`.
- **Effort:** S (30 min)

### P1-09: Document certificate pinning decision

- **Section:** §4.10
- **Acceptance criteria:** Production runbook documents the decision: either pinning implemented via OkHttp/CertificatePinner, or risk accepted with rationale for Phase 1 single-VPS deployment.
- **Effort:** S (30 min, or M if implementing)

### P1-10: Localize permission strings to Mongolian

- **Section:** §4.13
- **Acceptance criteria:** All `NS*UsageDescription` strings have Mongolian translations. Remove unnecessary permissions (microphone if not needed).
- **Effort:** S (1 hour)

### P1-11: Add WAL archive retention policy

- **Section:** §6.5
- **Acceptance criteria:** Cron job or script prunes WAL files older than 7 days from `/var/lib/postgresql/wal_archive`.
- **Effort:** S (30 min)

### P1-12: Verify branch protection rules

- **Section:** §7.3
- **Acceptance criteria:** `main` and `staging` branches require status checks, required reviewers, no force-push. Document in `OPERATING_MODEL.md`.
- **Effort:** S (30 min, requires repo admin)

### P1-13: Exercise rollback drill on staging

- **Section:** §7.5
- **Acceptance criteria:** Deploy a breaking change to staging, observe auto-rollback on health check failure, document result.
- **Effort:** M (2–3 hours)

### P1-14: Complete Grafana dashboards

- **Section:** §8.2
- **Acceptance criteria:** 7 missing dashboards added under `tooling/observability/grafana/dashboards/`: API latency, error rate, JVM, DB pool, Postgres, WebSocket, auth funnel.
- **Effort:** L (5–8 hours)

### P1-15: Add PII redaction to production logs

- **Section:** §8.4
- **Acceptance criteria:** Logback production profile includes masking patterns for email, phone, and token values in JSON output.
- **Effort:** S (1–2 hours)

### P1-16: Configure Docker log rotation

- **Section:** §8.5
- **Acceptance criteria:** All services in `docker-compose.production.yml` have `logging: { driver: json-file, options: { max-size: "50m", max-file: "5" } }`.
- **Effort:** S (30 min)

### P1-17: Set up status page

- **Section:** §8.8
- **Acceptance criteria:** Status page live at `status.tasky.mn` (or equivalent) showing system health. Configured to auto-update from Alertmanager or manual updates.
- **Effort:** S (1–2 hours)

### P1-18: Create SLO document

- **Section:** §8.9
- **Acceptance criteria:** `docs/maintenance/SLO.md` exists with availability target (99.0 or 99.5), latency targets per endpoint class, error-budget burn policy.
- **Effort:** S (1–2 hours)

### P1-19: Write per-alert runbook entries

- **Section:** §8.10
- **Acceptance criteria:** Production runbook has a section for each active alert with diagnosis steps, common causes, and remediation actions.
- **Effort:** M (3–4 hours)

### P1-20: Complete app store readiness items

- **Section:** §10
- **Acceptance criteria:** Screenshots (6.7", 6.5", 5.5") in en + mn produced. IARC/age rating questionnaire completed. App Review demo credentials prepared. Version increment policy documented. Target SDK ≥ 35 verified.
- **Effort:** M (4–6 hours)

### P1-21: Implement force-update mechanism

- **Section:** §10
- **Acceptance criteria:** API returns `X-Minimum-Client-Version` header. Mobile app checks on launch and shows blocking update screen if below minimum. Admin can configure minimum version.
- **Effort:** M (3–5 hours)

### P1-22: Document operational readiness

- **Section:** §12
- **Acceptance criteria:** Production runbook includes capacity sizing (VPS spec, expected load), cost model (monthly run-rate), cutover plan (DNS, store release, comms), day-2 plan (first 48 hours, escalation, rollback criteria).
- **Effort:** M (3–4 hours)

---

## P2 — Nice to Have / Post-Launch (10 items)

### P2-01: Move Firebase JSON from env var to file mount

- **Effort:** S (1 hour)

### P2-02: Pin web Dockerfile base images to digests

- **Effort:** S (30 min)

### P2-03: Enable Gradle dependency locking

- **Effort:** S (1 hour)

### P2-04: Add cosign image signing to CI

- **Effort:** S (1–2 hours)

### P2-05: Configure universal links / deep links

- **Effort:** M (2–3 hours)

### P2-06: Add auto-merge for Dependabot security updates

- **Effort:** S (30 min)

### P2-07: Record OpenSSF Scorecard score and remediate bottom sub-scores

- **Effort:** M (2–4 hours)

### P2-08: Integrate OpenTelemetry tracing

- **Effort:** L (6–10 hours)

### P2-09: Generate open-source license compliance (NOTICE/THIRD_PARTY_LICENSES)

- **Effort:** S (1 hour)

### P2-10: Configure Docker userns-remap

- **Effort:** M (2–3 hours)

---

## Effort Summary

| Severity  | Count  | Estimated Total Effort |
| --------- | ------ | ---------------------- |
| P0        | 17     | ~50–70 hours           |
| P1        | 22     | ~45–60 hours           |
| P2        | 10     | ~15–25 hours           |
| **Total** | **49** | **~110–155 hours**     |

## Recommended Execution Order (P0 only)

1. P0-12: Create production runbook (foundation for documenting everything else)
2. P0-02/P0-03/P0-04/P0-11: VPS hardening + documentation (parallel, operator tasks)
3. P0-01: Android release signing
4. P0-05/P0-06: Offsite backup + restore drill
5. P0-07: PII inventory (prerequisite for P0-13, P0-16)
6. P0-08/P0-09: Alerts + alerting destination
7. P0-10: Crash reporting
8. P0-13/P0-16: Privacy questionnaire + publish legal docs
9. P0-17: Signup consent capture
10. P0-14/P0-15: ATT + Sign in with Apple (parallel, mobile work)
