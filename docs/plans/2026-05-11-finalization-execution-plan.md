# Tasky Finalization Execution Plan

**Date:** 2026-05-11
**Goal:** Carry the repo from `ready for staging` to `ready for production` for the Phase 1 launch baseline.
**Deployment target:** Single VPS, docker-compose, Caddy + Let's Encrypt.
**Sources:** `docs/PRD.md`, `docs/LAUNCH_ROADMAP.md`, `docs/maintenance/PRODUCTION_READINESS.md`, `audit/REPORT.md`, `audit/REMEDIATION_BACKLOG.md`.

## 0. How this plan is structured (read first)

The work is split into **13 self-contained tranches** (T1–T13). Each tranche is sized so a less-capable executor can complete it in one focused session without paging in the rest of the repo. Tranches list:

- **Scope** — the narrow goal.
- **Prereqs** — earlier tranches that must be finished first.
- **Read** — the exact files/memories to open. **Do not read other files unless explicitly required.**
- **Do** — concrete deliverables with file paths.
- **Acceptance** — what done looks like.
- **Verify** — the command(s) that prove it.
- **Commit** — single-commit message template.

Tranches are independent unless a prereq is named. T1, T2 are foundations. T3–T10 can run in any order after their prereqs. T11–T13 finalize.

**Hard rules for the executor (all tranches):**

1. Do not modify files outside the tranche's listed surface without first surfacing the deviation.
2. Never use `--no-verify` on pushes to `staging` or `main` (see `AGENTS.md`).
3. Run `pnpm verify:ops` after touching workflows / compose / hooks / scripts.
4. Run `pnpm repo:ops:sync --fix` after wiring new tooling scripts.
5. Secrets only via env vars — never commit values.
6. Use Serena symbolic tools for Java/TS navigation; fall back to grep only when Serena returns empty.
7. Phase-1 dormant code (escrow, wallet, payouts, referrals, subscriptions, B2B) stays off-by-default and unchanged unless tranche says otherwise.

---

## 1. Pre-flight: Architecture & PRD compliance check (one-time, not a tranche)

This is a **read-only audit pass** that an operator (not the executor model) runs once before starting T1, to confirm no architectural regression has snuck in.

| Check                          | Command / file                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| ArchUnit boundaries pass       | `./gradlew :services:api:test --tests "mn.tasky.architecture.*"`                   |
| Schema parity matches expected | `python3 tooling/scripts/governance/validate-schema-parity.py`                     |
| Doc claims pass                | `python3 tooling/scripts/governance/validate-doc-claims.py`                        |
| Screen-spec traceability       | `python3 tooling/scripts/governance/validate-screen-spec-traceability.py`          |
| Phase-1 toggle posture         | `docs/maintenance/STAGING_TOGGLE_POSTURE.md` matches `application.yml` defaults    |
| Phase-1 requirement coverage   | every `REQ-P1-*` ID in `docs/PRD.md` resolves in `docs/openapi/` or `services/api` |
| OpenAPI ↔ SDK parity           | `pnpm verify:openapi && pnpm verify:sdk`                                           |

Any failure here gets fixed before T1. If all pass, the repo is structurally aligned with PRD/architecture and the remaining work is the audit backlog only.

---

## 2. Tranches

### T1 — Production runbook scaffold (foundation)

**Scope:** Create `docs/maintenance/PRODUCTION_RUNBOOK.md` with the section skeleton that T2–T12 will fill in. No real content yet — just headings, anchors, and TODO markers.

**Prereqs:** none.

**Read:**

- `docs/maintenance/PRODUCTION_READINESS.md`
- `docs/maintenance/OPERATING_MODEL.md`
- `docs/maintenance/STAGING_RUNBOOK.md` (mirror its tone/structure)
- `audit/REMEDIATION_BACKLOG.md` §P0-12

**Do:** Create `docs/maintenance/PRODUCTION_RUNBOOK.md` with these section headings (empty bodies marked `_TODO (Tx)_`):

1. Bootstrap (VPS provisioning, Docker install, env setup) — _T6_
2. Secret injection (`.env` chmod, ownership) — _T6_
3. Host firewall (ufw/nftables rules) — _T6_
4. SSH hardening — _T6_
5. Encryption at rest — _T6_
6. Deploy procedure — _T13_
7. Rollback procedure — _T13_
8. Backup verification + offsite — _T3_
9. Restore drill evidence — _T3_
10. WAL archive retention — _T3_
11. Blind-index key rotation — _T6_
12. JWT secret rotation — _T6_
13. Encryption key rotation — _T6_
14. Per-alert runbook entries — _T4_
15. On-call/paging — _T4_
16. Incident response (SEV-1/2/3) — _T13_
17. Capacity sizing + cost model — _T13_
18. Cutover plan (DNS, store release, comms) — _T13_
19. Day-2 plan (first 48 h, escalation, rollback criteria) — _T13_

**Acceptance:** File exists; every section is present; cross-linked from `docs/maintenance/PRODUCTION_READINESS.md` §3.

**Verify:** `python3 tooling/scripts/governance/validate-doc-claims.py` passes.

**Commit:** `docs(ops): scaffold production runbook for finalization tranches`

---

### T2 — PII inventory (data governance foundation)

**Scope:** Produce `docs/maintenance/PII_INVENTORY.md` (P0-07). Required input for T8 (legal docs).

**Prereqs:** none.

**Read:**

- `services/api/src/main/resources/db/migration/*.sql` (column-level signal)
- `tooling/config/expected-schema.json` (authoritative column list)
- `audit/REMEDIATION_BACKLOG.md` §P0-07

**Do:** Create `docs/maintenance/PII_INVENTORY.md` — a single table:

| Table | Column | PII class | Encryption | Blind index | Retention | Deletion mechanism |

Cover at minimum: `users.email`, `users.phone`, `profiles.*`, `tasks.location_*`, `messages.body`, `verifications.id_card_*`, `bookings.lat_lng`, `payment_intents.*`, `auth_facebook_link.*`, `audit_events.*` (if any PII), `domain_outbox_events.*` (if any PII).

For each row, fill in actual encryption status by reading the relevant DAO/encryption helper (`mn.tasky.common.security.*` and `mn.tasky.kernel.*`).

**Acceptance:** Every column containing PII is listed; each has explicit encryption/blind-index status (not "TBD").

**Verify:** `grep -c '| TBD' docs/maintenance/PII_INVENTORY.md` returns `0`.

**Commit:** `docs(data): add PII inventory for Phase 1 launch`

---

### T3 — Backup hardening (offsite + restore drill + WAL retention)

**Scope:** P0-05, P0-06, P1-11.

**Prereqs:** T1.

**Read:**

- `docker/backup.sh`, `docker/restore.sh`, `docker/init-db.sh`
- `docker-compose.production.yml` (backup-cron service)
- `audit/REMEDIATION_BACKLOG.md` §P0-05, §P0-06, §P1-11

**Do:**

1. Extend `docker/backup.sh` to upload every dump to an offsite bucket. Inputs come from new env vars (`OFFSITE_S3_ENDPOINT`, `OFFSITE_S3_BUCKET`, `OFFSITE_S3_ACCESS_KEY`, `OFFSITE_S3_SECRET_KEY`). If any are unset, the script logs a warning and skips upload (do NOT fail the local dump).
2. Add the new vars to `.env.production.example` with comments.
3. Add a WAL prune step (find … -mtime +7 -delete) — either inside `backup.sh` or a new `docker/prune-wal.sh` triggered by the same backup-cron service.
4. Export a Prometheus metric `tasky_backup_last_success_unixtime` (write timestamp to a file the api service exports, or use a textfile collector). This is the source for the `BackupStale` alert in T4.
5. Add the restore drill procedure + evidence template to `PRODUCTION_RUNBOOK.md` §8 and §9 (filled by the operator, not the executor).

**Acceptance:**

- `backup.sh` succeeds in dry-run with offsite vars unset (no crash).
- `backup.sh` succeeds in dry-run with offsite vars set (with a stub endpoint).
- `tasky_backup_last_success_unixtime` is reachable on `/actuator/prometheus`.
- RPO/RTO note in runbook (RPO ≤ 1 h, RTO < 4 h).

**Verify:** `bash docker/backup.sh --dry-run` exits 0 in both modes (executor adds the `--dry-run` flag if missing).

**Commit:** `feat(ops): offsite backup upload, WAL retention, restore drill template`

---

### T4 — Observability: alerts, destination, dashboards (P0-08, P0-09, P1-14, P1-15, P1-17, P1-18, P1-19)

**Scope:** Add missing alerts and the dashboards needed for the seven launch KPIs + ops health.

**Prereqs:** T1, T3 (for `BackupStale`).

**Read:**

- `tooling/observability/prometheus/alerts/tasky-alerts.yml`
- `tooling/observability/alertmanager/alertmanager.yml` and `start-alertmanager.sh`
- `tooling/observability/grafana/dashboards/` (whatever exists)
- `docs/METRICS.md` (KPI definitions — authoritative)
- `audit/REMEDIATION_BACKLOG.md` §P0-08, §P0-09, §P1-14, §P1-15, §P1-17, §P1-18, §P1-19

**Do:**

1. Add `DiskFreeLow` and `BackupStale` alert rules with `severity`, `summary`, `description`, `runbook_url` labels pointing to the runbook anchor.
2. Replace `__ALERT_WEBHOOK_URL__` template handling so `start-alertmanager.sh` substitutes from `$ALERT_WEBHOOK_URL` env at boot. Document the env var in `.env.production.example` and the runbook.
3. Add 7 dashboards under `tooling/observability/grafana/dashboards/`: `api-latency.json`, `error-rate.json`, `jvm.json`, `db-pool.json`, `postgres.json`, `websocket.json`, `auth-funnel.json`. Use real PromQL referencing existing metric names — confirm names by `grep -r MetricName services/api/src/main`.
4. Add Logback masking patterns for `email`, `phone`, `tokens` in `logback-prod.xml` (or whichever profile is loaded by `application-prod.yml`).
5. Create `docs/maintenance/SLO.md` (availability 99.0 %, P95 latency targets per endpoint class, error-budget burn policy).
6. Fill `PRODUCTION_RUNBOOK.md` §14 with one entry per alert: diagnosis, common causes, remediation.
7. Configure or document a status page surface (P1-17): if not standing one up, write the explicit decision and link to the manual update procedure in the runbook.

**Acceptance:**

- `promtool check rules tooling/observability/prometheus/alerts/tasky-alerts.yml` passes.
- `amtool check-config tooling/observability/alertmanager/alertmanager.yml` passes (or equivalent jsonschema check).
- All 7 dashboards open in Grafana (`grafonnet`/JSON validators OK).
- Test log line containing an email gets masked in JSON output.

**Verify:** `promtool check rules tooling/observability/prometheus/alerts/*.yml && pnpm verify:ops`

**Commit:** `feat(observability): add launch-blocking alerts, dashboards, SLO, log masking`

---

### T5 — Crash reporting (P0-10)

**Scope:** Sentry on web + mobile (or Crashlytics on mobile). Pick one and stay consistent.

**Prereqs:** none.

**Read:**

- `apps/mobile/src/index.{ts,tsx}` (entry)
- `apps/web/src/main.tsx`
- `apps/mobile/app.config.ts`
- `audit/REMEDIATION_BACKLOG.md` §P0-10

**Do:**

1. Add `@sentry/react-native` to `apps/mobile`. Initialize before any render in the entry file. DSN from `process.env.EXPO_PUBLIC_SENTRY_DSN`.
2. Add `@sentry/react` to `apps/web`. DSN from `import.meta.env.VITE_SENTRY_DSN`.
3. Pipe source-map upload into the existing build commands (web Vite plugin + EAS Build hook for mobile).
4. Add `EXPO_PUBLIC_SENTRY_DSN` + `VITE_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` (CI only) to `.env.production.example` and `.env.example`.
5. Wire a "Throw test error" dev-only button or expose a CLI command that fires a test event.
6. Add `Sentry.init` options: `tracesSampleRate: 0.0` for Phase 1 (errors only — perf later).

**Acceptance:** Both apps build without errors; the test event surfaces in the configured Sentry project (operator verifies once).

**Verify:** `pnpm --filter @tasky/mobile typecheck && pnpm --filter @tasky/web typecheck && pnpm --filter @tasky/mobile build && pnpm --filter @tasky/web build`

**Commit:** `feat(observability): integrate Sentry on web and mobile`

---

### T6 — VPS hardening + runbook bootstrap content (P0-02, P0-03, P0-04, P0-11, P1-01, P1-02, P1-22)

**Scope:** Fill `PRODUCTION_RUNBOOK.md` sections 1–5, 11–13, 15, 17, with concrete procedures. This is a docs-only tranche — no system changes are made by the executor; the operator applies them.

**Prereqs:** T1.

**Read:**

- `PRODUCTION_RUNBOOK.md` (current state from T1)
- `docs/maintenance/STAGING_RUNBOOK.md`
- `audit/REMEDIATION_BACKLOG.md` §P0-02, §P0-03, §P0-04, §P0-11, §P1-01, §P1-02, §P1-22

**Do:** Write fully-formed procedures (copy-paste runnable by the operator) for:

- VPS provisioning checklist (Docker, docker-compose plugin, NTP, swap).
- ufw rules: allow 22, 80, 443; deny everything else; example for default Ubuntu 24.04.
- SSH: PubkeyAuthentication yes, PasswordAuthentication no, PermitRootLogin no, fail2ban install + jail.local snippet, optional port change with firewall update.
- Encryption at rest: LUKS-on-data-volume procedure OR provider-side encryption attestation; key escrow note.
- `.env` placement: `chmod 600`, `chown deploy:deploy`, location `/opt/tasky/.env`.
- Blind-index key rotation step-by-step (maintenance window, dual-key migration plan, restart sequence).
- JWT + encryption key rotation procedures.
- On-call / paging: founder primary, one backup, channel choice (Telegram bot recommended for Phase 1 — cheapest, instant). Test message procedure.
- Capacity sizing: recommended VPS class (e.g., 4 vCPU / 8 GB / 80 GB SSD), expected load envelope (Phase 1 RPS estimate from `docs/METRICS.md`).
- Cost model: monthly run-rate table (VPS + offsite + Sentry + domain + observability).

**Acceptance:** Every TODO marker placed in T1 for sections 1–5, 11–13, 15, 17 is replaced with concrete content. No external links to vendor docs without a copy-paste-ready command alongside.

**Verify:** `grep -c '_TODO' docs/maintenance/PRODUCTION_RUNBOOK.md` returns the count corresponding only to sections owned by T3, T4, T13 (executor records the expected count in the commit body).

**Commit:** `docs(ops): runbook procedures for VPS bootstrap, hardening, key rotation`

---

### T7 — Docker / compose hardening (P1-03, P1-04, P1-05, P1-07, P1-16, P2-01, P2-02)

**Scope:** Pin digests, add web healthcheck, log rotation, SBOM in CI, sourcemap exposure, Firebase JSON via file mount.

**Prereqs:** none. Best paired with T5 (CI changes).

**Read:**

- `Dockerfile`
- `apps/web/Dockerfile`
- `docker-compose.production.yml`
- `.github/workflows/build-and-push.yml`
- `apps/web/Caddyfile.production`
- `audit/REMEDIATION_BACKLOG.md` §P1-03, §P1-04, §P1-05, §P1-07, §P1-16, §P2-01, §P2-02

**Do:**

1. For every `FROM` line in both Dockerfiles, replace tag with `tag@sha256:<digest>`. Use `docker buildx imagetools inspect` to obtain. Record digest source in a comment above the FROM line.
2. Add a `HEALTHCHECK` to `apps/web/Dockerfile` (e.g., `CMD wget -q --spider http://127.0.0.1:80/healthz || exit 1`) AND a compose-level `healthcheck:` block on the `web` service.
3. Add `logging: { driver: json-file, options: { max-size: "50m", max-file: "5" } }` to every service in `docker-compose.production.yml` (api, web, postgres, pgbouncer, postgres-exporter, minio, mc, backup-cron, etc.).
4. Add a Caddy rule in `apps/web/Caddyfile.production` rejecting `*.map` with 404. Confirm `build.sourcemap` is `false` in `apps/web/vite.config.ts` production mode.
5. Add CycloneDX SBOM generation to `.github/workflows/build-and-push.yml` — one artifact per image, retained 90 days. Use `anchore/sbom-action@v0` or `syft` directly.
6. Convert `FIREBASE_SERVICE_ACCOUNT_JSON` to a file mount: compose mounts `${FIREBASE_SA_PATH:-/opt/tasky/firebase-sa.json}` into the api container; `FirebasePushProvider` reads from file path if `FIREBASE_SA_PATH` is set, else falls back to env var. Document the mount in runbook + `.env.production.example`.

**Acceptance:**

- `docker compose -f docker-compose.production.yml config` succeeds.
- `pnpm verify:ops` passes.
- CI `build-and-push.yml` lint passes (`actionlint`).

**Verify:** `docker compose -f docker-compose.production.yml config -q && actionlint .github/workflows/*.yml`

**Commit:** `chore(infra): pin digests, web healthcheck, log rotation, SBOM, sourcemap block`

---

### T8 — Legal: PII → privacy policy, ToS, app privacy questionnaires, signup consent (P0-13, P0-16, P0-17, P1-06)

**Scope:** Publish legal docs, capture consent at signup, fill app-store privacy questionnaires, fill audit-log gaps for auth events.

**Prereqs:** T2 (PII inventory).

**Read:**

- `docs/maintenance/PII_INVENTORY.md` (from T2)
- `services/api/src/main/java/mn/tasky/auth/**` (entry: `AuthService`)
- `services/api/src/main/java/mn/tasky/common/audit/**`
- `apps/web/src/routes/**` (find signup page)
- `apps/mobile/src/screens/**` (find signup screen)
- `audit/REMEDIATION_BACKLOG.md` §P0-13, §P0-16, §P0-17, §P1-06

**Do:**

1. Write `docs/legal/privacy-policy.en.md`, `privacy-policy.mn.md`, `terms.en.md`, `terms.mn.md`. Source content from PII inventory + Phase-1 PRD. Cover the §11 requirements (data controller, purposes, legal basis, third parties, retention, user rights, cross-border transfer, children's policy, contact).
2. Add web routes `/privacy` and `/terms` rendering the markdown bilingually.
3. Add a Flyway migration `V27__user_consents.sql` creating `user_consents (user_id, policy_kind ENUM('TOS','PRIVACY'), version VARCHAR(32), accepted_at TIMESTAMPTZ)`. Update `tooling/config/expected-schema.json` via `--update-expected`.
4. Backend: add `ConsentService` in `mn.tasky.auth` (or `mn.tasky.user`); call from auth flows that create a user; emit audit event `TOS_CONSENT_ACCEPTED` with version.
5. Backend: emit audit events for login success, login failure, logout, token refresh, Facebook auth attempt (P1-06).
6. Frontend (web + mobile): require checkbox or continued-use notice before account creation; pass the policy version + acceptance flag to the auth API.
7. Fill the app-store privacy questionnaire mapping (one-page table) into `docs/legal/APP_PRIVACY_QUESTIONNAIRE.md`. Mirror sections required by both App Store Connect and Google Play Data Safety.

**Acceptance:**

- Migration applies cleanly on a fresh DB (`./gradlew :services:api:flywayMigrate` or via testcontainers).
- ArchUnit tests still pass.
- New audit events appear when running the auth integration test suite.
- `pnpm verify:i18n` passes after legal page additions.

**Verify:** `./gradlew :services:api:test --tests "*Auth*" && pnpm verify:i18n`

**Commit:** `feat(legal): publish privacy/ToS, capture signup consent, fill auth audit gaps`

---

### T9 — Mobile Android release prep (P0-01, P1-08, P1-10, P1-21)

**Scope:** Production signing, network security config, localized permissions, force-update mechanism.

**Prereqs:** none.

**Read:**

- `apps/mobile/android/app/build.gradle`
- `apps/mobile/android/app/src/main/AndroidManifest.xml`
- `apps/mobile/app.config.ts`
- `apps/mobile/src/**` (find app bootstrap)
- `services/api/src/main/java/mn/tasky/**` (find a controller advice / web filter for response headers)
- `audit/REMEDIATION_BACKLOG.md` §P0-01, §P1-08, §P1-10, §P1-21

**Do:**

1. Add `signingConfigs.release` reading from `keystore.properties` (gitignored) or env vars. Wire `buildTypes.release` to use it. Add `keystore.properties` to `.gitignore`. Add `keystore.properties.example` with placeholders.
2. Create `apps/mobile/android/app/src/main/res/xml/network_security_config.xml` with `cleartextTrafficPermitted="false"`. Reference it in `AndroidManifest.xml` via `android:networkSecurityConfig`.
3. Translate all `NS*UsageDescription` strings (iOS) + Android permission rationale strings to Mongolian. Remove unused permissions (microphone if not needed — confirm by grep).
4. Force-update: backend adds `X-Minimum-Client-Version` header on every response via a `OncePerRequestFilter`. Value from `tasky.client.min-version` config (DB-backed feature toggle preferred so admin can change without redeploy). Mobile app checks header on every API call; shows a blocking update screen if local `Application.nativeApplicationVersion` is below.

**Acceptance:**

- `./gradlew :app:assembleRelease` succeeds when `keystore.properties` is present (operator verifies once).
- Cleartext HTTP request from the mobile app fails locally.
- Setting `tasky.client.min-version` higher than installed version shows the blocking screen.

**Verify:** `pnpm --filter @tasky/mobile typecheck && ./gradlew :services:api:test --tests "*MinClientVersion*"`

**Commit:** `feat(mobile): Android release signing, network security config, force-update, mn permission strings`

---

### T10 — iOS ATT + Sign in with Apple (P0-14, P0-15)

> **Status:** Sign in with Apple was implemented and subsequently **removed** (2026-05-11) — not in PRD for Phase 1 launch. The backend `AppleAuthController`, `AppleIdentityTokenValidator`, and `UserDao` Apple methods have been deleted. The `V3__apple_auth.sql` migration (adding `apple_sub` column) is retained as Flyway migrations are immutable. ATT (P0-14) remains in scope when Facebook Login ships on iOS.

**Scope:** App Tracking Transparency prompt before Facebook SDK init. (Sign in with Apple removed.)

**Prereqs:** T9 (shared mobile bootstrap path).

**Read:**

- `apps/mobile/app.config.ts`
- `apps/mobile/ios/Tasky/Info.plist`
- `apps/mobile/src/auth/**`
- `services/api/src/main/java/mn/tasky/auth/**`
- `audit/REMEDIATION_BACKLOG.md` §P0-14, §P0-15

**Do:**

1. Add `expo-tracking-transparency` plugin and `NSUserTrackingUsageDescription` in en + mn.
2. Gate Facebook SDK init behind `requestTrackingPermissionsAsync()` resolving to `granted`.
3. Backend: add `POST /api/v1/auth/apple` that validates an Apple identity token (use `com.auth0:java-jwt` or `nimbus-jose-jwt` — already on classpath? Verify). Maps Apple subject ID to a user; creates one on first login.
4. Update OpenAPI spec (`docs/openapi/`) → regen `docs/API.yaml` → regen `@tasky/sdk` (per `AGENTS.md` contract-first rule).
5. Mobile: add "Sign in with Apple" button on iOS (required by App Review when Facebook Login is offered). Store credential in Keychain via `expo-secure-store`.
6. Add audit events: `APPLE_AUTH_SUCCESS`, `APPLE_AUTH_FAILURE`.

**Acceptance:**

- New `/auth/apple` integration test against a fake identity token passes.
- SDK regenerated; web/mobile typecheck passes.
- iOS build succeeds locally with the new plugin (operator verifies once).

**Verify:** `pnpm verify:openapi && pnpm verify:sdk && ./gradlew :services:api:test --tests "*Apple*"`

**Commit:** `feat(auth): Sign in with Apple end-to-end; iOS ATT before Facebook SDK init`

---

### T11 — App store packaging (P1-20)

**Scope:** Screenshots, IARC rating, app review demo creds, version policy, target SDK ≥ 35.

**Prereqs:** T9, T10.

**Read:**

- `apps/mobile/app.config.ts`
- `apps/mobile/android/app/build.gradle` (compile/target SDK)
- `audit/REMEDIATION_BACKLOG.md` §P1-20

**Do:**

1. Confirm `targetSdkVersion ≥ 35` in `build.gradle` and `app.config.ts`.
2. Write `apps/mobile/STORE_README.md` covering: screenshot specs (6.7", 6.5", 5.5" × en + mn), IARC questionnaire answers, demo account credentials (env-managed, not committed), version increment policy (CalVer or SemVer — pick one).
3. Add a script `apps/mobile/scripts/generate-screenshots.ts` (or document the Detox/Maestro flow) that produces the required screenshot set headlessly.

**Acceptance:** Operator can produce the screenshot set from the script; STORE_README answers every store-listing question.

**Verify:** Manual operator review.

**Commit:** `docs(mobile): app store packaging checklist and screenshot pipeline`

---

### T12 — P2 polish (parallel, time-permitting)

**Scope:** All P2 items. Skip if launch deadline pressure exists; reopen as a follow-up tranche post-launch.

**Prereqs:** none.

**Read:** `audit/REMEDIATION_BACKLOG.md` §P2-01 to §P2-10 (each is short).

**Do (in this order, drop any that exceed time budget):**

1. P2-03: Gradle dependency locking (`./gradlew dependencies --write-locks`).
2. P2-06: Dependabot auto-merge for security updates (workflow yaml).
3. P2-09: Generate `THIRD_PARTY_LICENSES` for both api and web. `pnpm licenses` and Gradle license plugin.
4. P2-07: Run OpenSSF Scorecard locally, record score in `docs/maintenance/SECURITY.md`, fix lowest two sub-scores.
5. P2-04: Add `cosign sign` step to `build-and-push.yml` using GitHub OIDC.
6. P2-05: Universal links / Android App Links — add `apple-app-site-association` and `assetlinks.json` served by web.
7. P2-10: Docker userns-remap — document in runbook, do not enable yet (test deferred to post-launch).
8. P2-08: OpenTelemetry tracing — explicitly defer; record decision in `docs/maintenance/SLO.md`.

**Acceptance:** Each completed item has a small commit; deferred items have a one-line ADR or runbook note explaining the deferral.

**Commit (one per item):** `chore(security): <item>`

---

### T13 — Final cutover dry run

**Scope:** Wire the remaining runbook sections (deploy, rollback, incident response, cutover, day-2), then execute one end-to-end staging rehearsal and record evidence.

**Prereqs:** T1, T3, T4, T6, T7, T8 minimum.

**Read:**

- `docs/maintenance/STAGING_RUNBOOK.md`
- `docs/maintenance/PRODUCTION_RUNBOOK.md`
- `audit/REMEDIATION_BACKLOG.md` §P1-13

**Do:**

1. Fill `PRODUCTION_RUNBOOK.md` §6 (deploy), §7 (rollback), §16 (SEV-1/2/3), §18 (cutover plan: DNS, store release, comms), §19 (day-2 plan).
2. Document the rollback drill (P1-13): deploy a deliberately-breaking change to staging, observe auto-rollback (or manual rollback if no auto), measure time, record in `docs/maintenance/REHEARSAL_LOG.md`.
3. Execute one full staging deploy + smoke pass; record evidence (timestamps, log excerpts, dashboard screenshots) in `REHEARSAL_LOG.md`.
4. Update `docs/maintenance/PRODUCTION_READINESS.md` §12: re-tabulate P0 status; if all P0 resolved, change "Current state" to `ready for production` with date.

**Acceptance:**

- Zero `_TODO` markers in `PRODUCTION_RUNBOOK.md`.
- `REHEARSAL_LOG.md` has at least one staging-deploy entry and one rollback entry.
- `PRODUCTION_READINESS.md` §12 reflects current P0 status.

**Verify:** `grep -c '_TODO' docs/maintenance/PRODUCTION_RUNBOOK.md` returns `0`; `python3 tooling/scripts/governance/validate-doc-claims.py` passes.

**Commit:** `docs(ops): complete production runbook, record rehearsal evidence, flip readiness state`

---

## 3. Sequencing summary

```
T1 ──┬── T3 ── T4 ── T13
     ├── T6
     └── T8 (also needs T2)
T2 ──┘
T5  (independent, parallel)
T7  (independent, parallel)
T9 ── T10 ── T11
T12 (parallel; optional)
```

Critical path: **T1 → T2 → T8 → T13** (longest dependency chain).
Parallel work streams: {T5}, {T7}, {T9→T10→T11}, {T6}, {T12}.

## 4. Handoff conventions for the executor

- Each tranche **must** start by re-reading this document's section for that tranche and the named source files. No other reading.
- Each tranche **must** end with a single commit on a branch `finalize/tNN-<slug>` and a PR opened against `staging` with the body listing acceptance items as a checklist.
- If a tranche reveals a blocker that needs cross-tranche redesign, the executor opens an issue rather than expanding scope.
- After T7 lands, all subsequent compose changes go through `pnpm verify:ops`.
- After T8 lands, all auth-touching changes must keep the consent flow green (re-run §T8 verify).
- If the executor hits a Phase-1 toggle posture conflict, pause and surface — never flip a dormant-feature flag.

## 5. Done definition

Production-ready when:

1. All P0 items in `audit/REMEDIATION_BACKLOG.md` closed.
2. `docs/maintenance/PRODUCTION_RUNBOOK.md` has zero TODO markers.
3. `docs/maintenance/REHEARSAL_LOG.md` has at least one full staging-deploy + rollback entry.
4. `docs/maintenance/PRODUCTION_READINESS.md` §12 reads `ready for production`.
5. `./gradlew gateRegression` + `pnpm verify:ops` + `pnpm verify:i18n` + `pnpm verify:openapi` + `pnpm verify:sdk` all green on `staging` head.
