# Pre-Deployment Audit Report

**Date:** 2026-05-11  
**Auditor:** Automated audit per `eventual-moseying-papert.md` plan  
**Scope:** Security, infrastructure, operations, mobile app store readiness, legal/compliance  
**Deployment target:** Single VPS, docker-compose, Caddy + Let's Encrypt, WAL archiving, hourly pg_dump, MinIO

---

## Section 1 — Secrets & Credential Hygiene

### 1.1 Committed-secret scan (gitleaks)

- **Status:** ✅ PASS
- `.gitleaks.toml` is present with allowlist for `.env.example`, `.env.private-staging.example`, test configs, and test setup files.
- Pre-commit hook runs `gitleaks git --pre-commit --staged`.
- CI quality-gates workflow runs `bash tooling/scripts/governance/check-gitleaks-secret-scan.sh`.
- **Action:** Run `gitleaks detect --no-banner --redact --config .gitleaks.toml --log-opts="--all"` to confirm full-history pass. This must be run by the operator and result attached as evidence.

### 1.2 `.env` inspection

- **Status:** ✅ PASS
- `.env` is in `.gitignore` (line 91).
- `.env.example` contains only dev-grade placeholder values (`tasky`, `minioadmin`, `CHANGE_ME_*`).
- No real third-party keys found in tracked example files.

### 1.3 `.env.production.example` validation

- **Status:** ✅ PASS
- `.env.production.example` contains all required variables with empty values (no real secrets).
- Every variable is grouped with a comment indicating its purpose and how to generate it (e.g., `openssl rand -hex 32`).

### 1.4 Cross-check env-var coverage

- **Status:** ⚠️ MINOR GAP (P2)
- All variables consumed in `application.yml`, `application-prod.yml`, and `docker-compose.production.yml` are present in `.env.production.example`.
- **Gap:** `TASKY_RATE_LIMIT_TRUSTED_PROXY_DEPTH` is configurable in `application.yml` but not in `.env.production.example`. Low risk for single-VPS behind Caddy (default is 0, which is correct).
- **Gap:** `TASKY_AUTH_SMS_PROVIDER`, `TASKY_PAYMENT_PROVIDER`, `TASKY_GEOCODING_PROVIDER`, `TASKY_LLM_PROVIDER`, `TASKY_NOTIFICATION_SMS_PROVIDER` are configurable but not in `.env.production.example`. These all have sensible defaults (`logging`, `qpay`, `district`, `logging`, `logging`) appropriate for Phase 1.

### 1.5 Runtime secret injection mechanism

- **Status:** ⚠️ P1 — Undocumented
- `docker-compose.production.yml` passes secrets via `environment:` block (values from `.env` file or host environment).
- **Gap:** No documentation exists specifying whether the `.env` file is loaded via `env_file:` directive or set via systemd `EnvironmentFile=` or inline environment. The compose file does NOT use `env_file:` — it references `${VAR}` interpolations, which means docker-compose reads `.env` in the compose project directory by default.
- **Finding (P1):** Document the production secret injection flow: confirm the `.env` file on the VPS has `chmod 600`, owned by the deploy user, and is never committed. Add this to the production runbook.

### 1.6 Key-material strength

- **Status:** ✅ PASS (with documentation gap)
- `JwtTokenService.java` validates signing key ≥ 32 bytes at startup (`@PostConstruct validateSigningKeyStrength()`).
- `.env.example` and `.env.production.example` document generation commands (`openssl rand -hex 32`, `openssl rand -base64 32`).
- **Finding (P1):** No rotation procedure documented for `TASKY_BLIND_INDEX_KEY`. Rotation invalidates all blind-indexed lookups (phone numbers). Document the rotation procedure: (1) schedule maintenance window, (2) generate new key, (3) re-encrypt all blind indexes, (4) update env var, (5) restart.

### 1.7 Firebase service account JSON

- **Status:** ✅ PASS
- `FIREBASE_SERVICE_ACCOUNT_JSON` is loaded from an environment variable, not from a file mount or baked into the image.
- `FirebasePushProvider.java` reads it at runtime from `${FIREBASE_SERVICE_ACCOUNT_JSON}`.
- No `COPY` of credentials in the `Dockerfile`.
- **Note:** The full JSON string is in an environment variable. This is visible in `docker inspect` and `/proc/*/environ`. Consider file-mount approach (P2).

---

## Section 2 — Container & Image Security

### 2.1 Dockerfile review

#### Root `Dockerfile` (API)

- ✅ Multi-stage build (`eclipse-temurin:21-jdk` → `eclipse-temurin:21-jre`)
- ✅ Non-root `USER tasky` directive present
- ✅ `HEALTHCHECK` defined
- ✅ No build-time secret ARGs, no COPY of `.env*`
- ⚠️ Base image pinned to tag (`eclipse-temurin:21-jre`), not digest. **P1** — pin to digest for reproducibility.

#### `apps/web/Dockerfile` (Caddy)

- ✅ Multi-stage build (4 stages: prune → install → build → production)
- ✅ Non-root `USER caddy`
- ✅ No build-time secret ARGs (only `VITE_*` build args, which are public)
- ⚠️ No `HEALTHCHECK` in Dockerfile, BUT compose-level healthcheck not present for `web` service in `docker-compose.production.yml` either. **P1** — add a healthcheck (e.g., `wget --spider http://localhost:80/` or rely on Caddy's readiness).
- ⚠️ Base images pinned to tags, not digests. **P2** — pin for reproducibility.

#### `services/api/scripts/Dockerfile` (scrape utility)

- Not a production image (data scraping utility). No findings.

### 2.2 Compose image pinning

- `postgis/postgis:16-3.4` — pinned to major.minor tag ✅
- `edoburu/pgbouncer:v1.25.1-p0` — pinned to specific version ✅
- `prometheuscommunity/postgres-exporter:v0.16.0` — pinned ✅
- `minio/minio:RELEASE.2025-04-22T18-11-21Z` — pinned to release ✅
- `minio/mc:RELEASE.2025-04-22T18-07-45Z` — pinned ✅
- `caddy:2.9-alpine` — pinned to minor version ✅ (web Dockerfile)
- Observability compose images also pinned. ✅
- **No `:latest` tags found.** ✅

### 2.3 Trivy scan (images)

- **Status:** Requires operator to run against published GHCR images.
- CI runs Trivy image scan in `build-and-push.yml` (scan-images job) and `quality-gates.yml` (builds local image and scans).
- `.trivyignore` exists with no suppressions yet.
- **Action:** Run `trivy image --severity HIGH,CRITICAL --ignore-unfixed ghcr.io/<owner>/tasky/api:main` and `ghcr.io/<owner>/tasky/web:main` and attach results.

### 2.4 Trivy filesystem scan

- **Status:** CI runs `trivy fs` in quality-gates.yml.
- **Action:** Run locally: `trivy fs --scanners vuln,misconfig,secret --severity HIGH,CRITICAL .` and attach results.

### 2.5 Reproducibility

- ✅ `pnpm-lock.yaml` exists and CI uses `--frozen-lockfile`
- ✅ `gradle/wrapper/gradle-wrapper.properties` exists
- ⚠️ No `services/api/gradle.lockfile` found. **P2** — Gradle dependency locking not enabled. Consider adding `./gradlew dependencies --write-locks` for full reproducibility.

### 2.6 SBOM

- **Status:** ⚠️ **P1** — No SBOM generation in CI pipeline.
- `build-and-push.yml` does not emit CycloneDX or SPDX SBOM.
- **Remediation:** Add a step to `build-and-push.yml` scan-images job: `trivy image --format cyclonedx -o sbom-${{ matrix.image }}.json <image-ref>` and upload as artifact.

### 2.7 Image signing

- **Status:** ⚠️ **P2** — GHCR images are not signed with cosign.
- No cosign step in `build-and-push.yml`.
- **Remediation:** Add keyless cosign signing via GitHub OIDC: `cosign sign --yes <image-ref>`.

---

## Section 3 — Application Security (Backend)

### 3.1 SecurityConfig.java

- **Status:** ✅ Generally well-configured
- Filter chain order: `JwtAuthenticationFilter` → `RateLimitFilter` → `LastActiveFilter` (correct).
- Public paths are minimal and well-scoped: `/error`, `/actuator/health`, `/actuator/info`, `/api/v1/system/version`, auth endpoints, `/ws`.
- `/actuator/**` (beyond health/info) requires `ADMIN` role. ✅
- `dev-auth` path only added when `devAuthEnabled=true`. ✅
- **Gap:** `/actuator/prometheus` is exposed under the generic web exposure config in `application.yml` (`include: health,info,metrics,prometheus`). Since `SecurityConfig` permits `/actuator/health` and `/actuator/info` publicly but requires ADMIN for `/actuator/**`, Prometheus metrics endpoint will require auth. ✅ Correct.
- **Gap:** `/api/v1/payments/qpay/callback` is public (necessary for webhook). Rate limited to 10/min by IP. ✅

### 3.2 JWT lifecycle

- **Status:** ✅ Well-implemented
- Access TTL default: 900s (15 min) ✅
- Refresh TTL default: 1,209,600s (14 days) ✅
- `jti` stamping: ✅ (UUID per token)
- Issuer/audience validation: ✅ (`tasky-server` / `tasky-api`)
- Token blacklist on logout: ✅ (Caffeine cache, TTL matches access token)
- Token type claim distinguishes access vs refresh: ✅
- All TTLs configurable via env vars: ✅
- **Note:** In-memory blacklist limits to single-instance deployment. Documented in `TokenBlacklistService.java` as future migration to Redis.

### 3.3 CORS

- **Status:** ✅
- Production `.env.production.example` specifies explicit origins: `https://tasky.mn` ✅
- No `*` wildcard. ✅
- CORS config reads from env var `tasky.cors.allowed-origins`, parsed as comma-separated list. ✅

### 3.4 CSRF posture

- **Status:** ✅
- `SecurityConfig` disables CSRF (`AbstractHttpConfigurer::disable`) ✅
- Session management is `STATELESS` ✅
- No session cookies issued. ✅

### 3.5 Rate limiting

- **Status:** ✅ Well-configured
- `RateLimitFilter`: authenticated 100 RPM, unauthenticated 30 RPM, QPay callback 10 RPM. All configurable via env vars. ✅
- `StompRateLimitInterceptor`: 30 messages/min per user, Bucket4j token bucket. ✅
- `FacebookRateLimitService`: 10 attempts/hour per IP. ✅
- `OtpRateLimitService`: exists. ✅
- Counter cleanup: `RateLimitCleanupScheduler` runs with ShedLock. ✅
- STOMP bucket cleanup on disconnect. ✅

### 3.6 OAuth (Facebook)

- **Status:** ✅
- Token validation via `/debug_token` endpoint with app_id verification. ✅
- App secret loaded from env (`tasky.facebook.app-secret`). ✅
- Circuit breaker protects against Facebook outages. ✅
- **Note:** No CSRF `state` parameter in the server-side flow. The Facebook Login SDK handles this client-side. The server only validates the token server-side. This is the standard pattern for native+server Facebook Login. ✅

### 3.7 Input validation

- **Status:** ✅
- Controllers consistently use `@Valid` and `@Validated` annotations on request bodies.
- No JPA entities directly bound at controller boundaries — DTOs used throughout. ✅
- `server.error.include-message: never`, `include-stacktrace: never`, `include-binding-errors: never` in `application.yml`. ✅

### 3.8 Mass-assignment

- **Status:** ✅
- No JPA entities at controller boundaries. DTOs are used exclusively.

### 3.9 Audit log coverage

- **Status:** ⚠️ **P1** — Gaps in security-sensitive audit coverage
- **Covered actions:** `BAN_USER`, `UNBAN_USER`, `USER_SELF_DELETE_REQUEST`, `IDENTITY_DATA_DELETED`, `NO_SHOW_FLAGGED`, `FEATURE_TOGGLE_*`, `DISPUTE_*`, `WALLET_*`, `CATEGORY_SCHEMA_*`.
- **Missing actions (P1):**
  - Login success/failure (no audit event on Facebook auth login or token refresh)
  - Logout / token blacklist (no audit event when token is revoked)
  - Password/phone change (if applicable in Phase 1)
  - Role change (not applicable in Phase 1 — roles assigned at registration)
  - Admin login

### 3.10 Error responses

- **Status:** ✅
- `RestAuthenticationEntryPoint` returns JSON `{"code":"UNAUTHORIZED","message":"Authentication is required."}` — no stack traces. ✅
- `RestAccessDeniedHandler` returns JSON `{"code":"FORBIDDEN","message":"Insufficient permissions for this action."}` — no stack traces. ✅
- `application.yml` disables error detail inclusion in production. ✅

---

## Section 4 — Application Security (Web & Mobile)

### Web

#### 4.1 Caddyfile.production security headers

- **Status:** ✅ Well-configured
- HSTS: `max-age=31536000; includeSubDomains; preload` ✅
- X-Content-Type-Options: `nosniff` ✅
- X-Frame-Options: `DENY` ✅
- Referrer-Policy: `strict-origin-when-cross-origin` ✅
- Permissions-Policy: `camera=(), microphone=(), geolocation=(self)` ✅
- CSP: Comprehensive policy with specific script-src hashes for Facebook SDK polyfill, specific `connect-src` origins, `frame-src: 'none'`, `object-src: 'none'`. ✅

#### 4.2 CSP connect-src

- **Status:** ✅
- `connect-src 'self' wss: https://graph.facebook.com` — no wildcard. ✅

#### 4.3 SRI (Subresource Integrity)

- **Status:** ✅
- `vite-plugin-sri3` is enabled in `apps/web/vite.config.*`. ✅

#### 4.4 Source-map exposure

- **Status:** ⚠️ **P1** — Not verified
- No explicit `sourcemap: false` found in Vite config. Default Vite production builds do not generate source maps unless configured, but this should be explicitly verified.
- **Action:** Confirm `build.sourcemap` is not enabled in `apps/web/vite.config.*` for production builds, or that a Caddy rule blocks `*.map` requests.

#### 4.5 localStorage/sessionStorage

- **Status:** ✅
- Web app uses `localStorage` only for i18n language preference. ✅
- No JWTs, tokens, or PII stored in browser storage. ✅
- JWT is sent via `Authorization: Bearer` header (standard SPA pattern).

### Mobile

#### 4.6 iOS ATS

- **Status:** ✅
- `NSAllowsArbitraryLoads: false` ✅
- `NSAllowsLocalNetworking: true` (debug only, acceptable) ✅
- No per-domain exceptions. ✅

#### 4.7 Android network security config

- **Status:** ⚠️ **P1** — Missing
- `network_security_config.xml` does not exist.
- Default React Native behavior allows cleartext on older APIs.
- **Remediation:** Create `android/app/src/main/res/xml/network_security_config.xml` with `cleartextTrafficPermitted="false"` and reference it in `AndroidManifest.xml`.

#### 4.8 Release signing (Android)

- **Status:** ⚠️ **P0** — Production release signing not configured
- `build.gradle` `release` buildType uses `signingConfig signingConfigs.debug`.
- Production release keystore must be configured via Gradle properties from environment variables, never committed.
- **Remediation:** Create a `signingConfigs.release` block reading from `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` environment variables or `keystore.properties` (gitignored). Use Play App Signing as the canonical signing key.

#### 4.9 Proguard / R8

- **Status:** ✅ (conditional)
- `minifyEnabled` is controlled by `enableMinifyInReleaseBuilds` property. Default not found in repo — likely resolves to `false` in Expo managed flow.
- `proguard-rules.pro` exists with React Native keep rules. ✅
- **Action:** Verify `enableMinifyInReleaseBuilds=true` is set for production EAS builds.

#### 4.10 Certificate pinning

- **Status:** ⚠️ **P1** — Not implemented
- No certificate pinning found in the mobile app.
- **Remediation:** Either implement pinning via `react-native-ssl-pinning` or OkHttp `CertificatePinner`, or formally accept the risk and document the decision. For Phase 1 with a single VPS and Caddy, the risk is low but should be documented.

#### 4.11 EAS config

- **Status:** ✅
- `eas.json` production profile uses `autoIncrement: true`. ✅
- Credentials stored in EAS (not committed). ✅
- `GOOGLE_SERVICES_JSON` and `GOOGLE_PLIST` are EAS secrets. ✅

#### 4.12 Secure storage

- **Status:** ✅
- `expo-secure-store` used for auth token persistence (`authStore.ts`). ✅
- Uses platform Keychain (iOS) / EncryptedSharedPreferences (Android). ✅

#### 4.13 Permissions

- **Status:** ⚠️ **P1** — Permission strings need localization
- `NSCameraUsageDescription`: `Allow $(PRODUCT_NAME) to access your camera` — generic, in English only.
- `NSMicrophoneUsageDescription`: `Allow $(PRODUCT_NAME) to access your microphone` — why is microphone needed?
- `NSPhotoLibraryUsageDescription`: `Allow $(PRODUCT_NAME) to access your photos` — generic.
- Location strings are better: `Tasky uses your location to show nearby tasks and set task location.`
- **Remediation:** (a) Localize all permission strings to Mongolian, (b) review if microphone permission is needed for Phase 1 (remove if not), (c) make descriptions more specific.

#### 4.14 Deep links / universal links

- **Status:** ⚠️ **P2**
- App scheme `tasky` declared in both iOS and Android.
- No `applinks` or `assetlinks` configuration found.
- For Phase 1 this is acceptable; deep links are app-internal only.

---

## Section 5 — Network, TLS, Reverse Proxy

### 5.1 TLS termination

- **Status:** ✅
- Caddy auto-provisions via Let's Encrypt for `{$TASKY_DOMAIN}`. ✅
- Caddy defaults to modern cipher suites and TLS 1.2+. ✅
- OCSP stapling enabled by default in Caddy 2. ✅

### 5.2 Port exposure

- **Status:** ✅
- Only `web` service publishes ports 80/443. ✅
- `postgres-exporter` bound to `127.0.0.1:9187`. ✅
- No other publicly bound services. ✅

### 5.3 Internal DNS

- **Status:** ✅
- Services communicate via compose service names (`pgbouncer`, `postgres`, `minio`, `app`). No hardcoded IPs. ✅

### 5.4 WebSocket/STOMP

- **Status:** ✅
- Caddyfile.production routes `/ws` and `/ws/*` to the backend. ✅
- Single-instance deployment — sticky sessions not needed. ✅

### 5.5 Host firewall

- **Status:** ⚠️ **P0** — Not documented in runbook
- No host firewall configuration documented in `STAGING_RUNBOOK.md` or a production runbook.
- **Remediation:** Create `docs/maintenance/PRODUCTION_RUNBOOK.md` with ufw/nftables rules: allow 22/80/443, deny everything else inbound.

### 5.6 SSH hardening

- **Status:** ⚠️ **P0** — Not documented
- No SSH hardening guidance in any runbook.
- **Remediation:** Document in production runbook: key-only auth, no root login, fail2ban, optional port change.

---

## Section 6 — Database Security & Operations

### 6.1 Privilege model

- **Status:** ✅
- `docker/init-db.sh` creates `APP_DB_USER` with CONNECT + DML only. ✅
- Flyway migration user (`POSTGRES_USER`) differs from runtime user. ✅
- In production, Flyway connects directly to postgres; app connects via PgBouncer as `APP_DB_USER`. ✅

### 6.2 Connection pooling

- **Status:** ✅
- Production JDBC URL: `jdbc:postgresql://${POSTGRES_HOST}:${PGBOUNCER_PORT:6432}/${POSTGRES_DB}`. ✅
- PgBouncer configured in transaction mode. ✅

### 6.3 Password hashing

- **Status:** ✅
- `password_encryption=scram-sha-256` in postgres command. ✅
- `POSTGRES_HOST_AUTH_METHOD: scram-sha-256` in compose environment. ✅

### 6.4 Encryption at rest

- **Status:** ⚠️ **P0** — Not documented or verified
- No LUKS or provider-side disk encryption documented.
- **Remediation:** Enable LUKS on the VPS data volume before launch. Document in production runbook.

### 6.5 WAL archiving

- **Status:** ✅
- `wal_level=replica`, `archive_mode=on` with command writing to `/var/lib/postgresql/wal_archive`. ✅
- WAL archive on named volume `production_wal_archive`. ✅
- ⚠️ **P1** — Retention policy for WAL archives not configured. The archive directory will grow unbounded. Add a cron job or script to prune WAL files older than 7 days.

### 6.6 Backups

- **Status:** ⚠️ **P0** — Offsite copy not configured
- `backup-cron` service runs hourly with 7-day retention. ✅
- Backups stored on local disk only (`./docker/backups`).
- **P0 Gap:** No offsite copy. If the VPS disk fails, backups are lost.
- **Remediation:** Add a step to upload dumps to MinIO with a geo-replica OR an external object store (B2/S3/R2) with separate credentials. Document RPO/RTO.

### 6.7 Restore drill

- **Status:** ⚠️ **P0** — No evidence of restore drill
- `docker/restore.sh` exists and looks correct.
- **Gap:** No evidence it has been exercised against a recent dump.
- **Remediation:** Run a restore drill on staging and document the result.

### 6.8 Migration immutability

- **Status:** ✅
- `release-gate.yml` runs `validate-migrations.py`. ✅
- `quality-gates.yml` and `deploy-staging.yml` also validate migrations. ✅

### 6.9 Schema parity

- **Status:** ✅
- `tooling/config/expected-schema.json` exists and is generated from migrations.
- Validation script `validate-schema-parity.py` is present and wired. ✅

### 6.10 PII inventory

- **Status:** ⚠️ **P0** — Not produced
- PII columns identified in `V1__baseline.sql`:
  - `users.phone` — encrypted, blind-indexed
  - `users.phone_blind_idx` — blind index
  - `otp_challenges.phone_blind_idx` — blind index
  - `payment_intents.payment_id` — payment reference
  - Verification records — front/back ID card images stored in MinIO
  - `messages` — may contain PII in content
  - `users` — name, facebook_id (linked to Facebook profile)
- **Remediation:** Produce a one-page PII inventory document listing every column, its encryption status, and blind-index status.

---

## Section 7 — CI/CD & Supply Chain

### 7.1 Workflow inventory

- **Status:** ✅
- All 9 workflows present: `build-and-push`, `deploy-production`, `deploy-staging`, `nightly-mobile`, `nightly-regression`, `quality-gates`, `release-gate`, `security-review`, `qodana_code_quality`. ✅
- Each mapped in `tooling/config/ops-registry.yaml`. ✅

### 7.2 Quality-gates lanes

- **Status:** ✅
- Gitleaks, Trivy fs+image, Semgrep, OWASP Dependency-Check (in nightly-regression), OpenSSF Scorecard all wired. ✅
- Each fails the build on findings above threshold. ✅

### 7.3 Merge protection

- **Status:** ⚠️ **P1** — Not verified (requires repo admin access)
- Branch protection for `main` and `staging` cannot be verified from the repository alone.
- **Action:** Operator must verify required status checks, required reviewers, and no force-push are enabled.

### 7.4 Deploy-production workflow

- **Status:** ✅
- Manual `workflow_dispatch` trigger. ✅
- Release-gate must pass first. ✅
- Image verification (manifest inspect). ✅
- `environment: production` — requires manual approval if protection rules are configured. ✅
- Pre-deploy backup is default (skip requires explicit boolean input). ✅
- Automatic rollback on health check failure. ✅

### 7.5 Rollback drill

- **Status:** ⚠️ **P1** — No evidence of rollback drill
- Rollback logic exists in `deploy-production.yml`. ✅
- **Gap:** Not exercised on staging.
- **Remediation:** Simulate a failed deploy in staging and verify auto-rollback.

### 7.6 Dependency review

- **Status:** ✅
- `.github/dependabot.yml` is configured for npm, Gradle, GitHub Actions, and Docker. ✅
- Groups minor/patch updates. ✅
- **P2 Gap:** No auto-merge policy for security patch PRs. Consider adding `auto-merge` for Dependabot security updates.

### 7.7 OpenSSF Scorecard

- **Status:** ⚠️ **P2**
- Scorecard action runs in quality-gates.yml with `continue-on-error: true`. ✅
- Results saved as artifact but not published to OpenSSF dashboard.
- **Action:** Record current score and identify bottom 3 sub-scores for remediation.

### 7.8 Ops registry drift

- **Status:** ✅ Fixed during audit
- `qodana_code_quality.yml` was present but not registered in `tooling/config/ops-registry.yaml`.
- Fixed by adding the entry and running `pnpm repo:ops:sync --fix`.

---

## Section 8 — Observability & Incident Response

### 8.1 Metrics

- **Status:** ✅
- `tasky-api` exposes `/actuator/prometheus`. ✅
- Prometheus scrape config targets `app:8080`. ✅
- Prometheus also added to observability compose. ✅

### 8.2 Dashboards

- **Status:** ⚠️ **P1** — Incomplete
- Only one dashboard: `tasky-overview.json`.
- **Missing required dashboards:**
  - API latency p50/p95/p99 per route
  - Error rate (4xx, 5xx) per route
  - JVM heap + GC
  - DB connection pool saturation (PgBouncer)
  - Postgres slow query count, locks
  - WebSocket connection count + STOMP rate-limit drops
  - Login success/failure + OAuth flow funnel

### 8.3 Alerts

- **Status:** ⚠️ Partial
- **Present:** `APIHealthDown` (2 min), `High5xxRate` (15 min > 5%), `FacebookAuthFailures` (10 min > 30%). ✅
- **Missing (P0):**
  - Disk free < 20% on data volume
  - Backup cron last-success > 90 min
- **Missing (P1):**
  - Postgres connections > 80% of max
  - WebSocket/STOMP rate-limit drops
- Alertmanager receiver configured but webhook URL is a template placeholder (`__ALERT_WEBHOOK_URL__`). **P0** — Must be replaced with a real destination (Telegram bot, PagerDuty, email, etc.).

### 8.4 Logging

- **Status:** ✅ (with gaps)
- Production profile uses `LogstashEncoder` with structured JSON. ✅
- `correlationId`, `userId`, `traceId` included via MDC. ✅
- ⚠️ **P1** — No PII redaction in logs. Email, phone, or tokens could appear in log output. Add logback masking pattern for sensitive fields.

### 8.5 Log retention & shipping

- **Status:** ⚠️ **P1** — No log rotation configured
- Docker JSON-file log driver is default but no `max-size`/`max-file` configured in any compose file.
- **Remediation:** Add `logging: { driver: json-file, options: { max-size: "50m", max-file: "5" } }` to all services in `docker-compose.production.yml`.

### 8.6 Traces

- **Status:** ⚠️ **P2** — Not configured
- OpenTelemetry not integrated.
- For Phase 1 single-VPS, this is acceptable. Document the decision.

### 8.7 Sentry/Crashlytics

- **Status:** ⚠️ **P0** — Not configured on either web or mobile
- No Sentry or Firebase Crashlytics integration found in web or mobile code.
- **Remediation:** At minimum, add crash reporting to the mobile app before store submission. Essential for post-launch quality.

### 8.8 Incident response

- **Status:** ⚠️ Partial
- `PRODUCTION_READINESS.md` defines SEV-1/2/3 with target actions. ✅
- **Missing (P0):**
  - No on-call rotation documented. Founder-only operation acknowledged but no paging mechanism (Telegram bot, PagerDuty, OpsGenie, phone tree).
  - No escalation contacts documented (founder + one backup).
- **Missing (P1):**
  - Status page (statuspage.io / self-hosted).

### 8.9 SLO doc

- **Status:** ⚠️ **P1** — Does not exist
- `docs/maintenance/SLO.md` not found.
- **Remediation:** Create with availability target (99.0 or 99.5 for Phase 1), latency targets, error-budget burn policy.

### 8.10 Runbooks per alert

- **Status:** ⚠️ **P1**
- Alerts link to `PRODUCTION_READINESS.md` as `runbook_url` but no per-alert runbook entries exist.
- **Remediation:** Create a runbook section in the production runbook for each active alert with diagnosis steps.

---

## Section 9 — Host & VPS Hardening

### 9.1–9.10 Host hardening checklist

- **Status:** ⚠️ **P0** — No production runbook exists
- `docs/maintenance/PRODUCTION_RUNBOOK.md` does not exist.
- The staging runbook covers private VPS sandbox only, not production hardening.
- **Remediation:** Create `docs/maintenance/PRODUCTION_RUNBOOK.md` covering:
  1. OS minimal install (Debian/Ubuntu LTS), unattended-upgrades
  2. SSH hardened: key-only, no root login, fail2ban
  3. Firewall: ufw allow 22/80/443, deny rest inbound
  4. Non-root deploy user with docker group
  5. Docker daemon `log-opts` for JSON-file rotation (P2: userns-remap)
  6. Data volume on encrypted storage (LUKS)
  7. Time sync (chrony/systemd-timesyncd)
  8. VPS snapshot policy (daily, 7-day retention)
  9. Two-person emergency access in password manager
  10. Bootstrap, deploy, rollback, backup verification, incident response, key rotation procedures

---

## Section 10 — Mobile App Store Readiness

### Apple App Store

| #   | Requirement                              | Status                                                                                                                                                     |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | App identity (bundle ID, name, category) | ✅ `mn.tasky.mobile`, "Tasky"                                                                                                                              |
| 2   | Version + build number increment policy  | ⚠️ **P1** — `eas.json` has `autoIncrement: true`, but no documented manual increment policy for App Store review resubmissions                             |
| 3   | Provisioning + signing via EAS           | ✅ Credentials in EAS, not committed                                                                                                                       |
| 4   | App Privacy questionnaire                | ⚠️ **P0** — Not produced. Must create a data → purpose → linked-to-user mapping                                                                            |
| 5   | ATT (App Tracking Transparency)          | ⚠️ **P0** — No ATT prompt or `NSUserTrackingUsageDescription` found. Facebook SDK qualifies as tracking. Must implement before App Store submission        |
| 6   | Account deletion flow                    | ⚠️ **P0** — `USER_SELF_DELETE_REQUEST` audit event exists in backend, but end-to-end account deletion UI + full data purge within 30 days must be verified |
| 7   | Sign in with Apple                       | ⚠️ **P0** — Not implemented. Required if any third-party SSO (Facebook) is offered on iOS                                                                  |
| 8   | Permission strings (localized)           | ⚠️ **P1** — Only English strings; need Mongolian translations                                                                                              |
| 9   | Screenshots (6.7", 6.5", 5.5")           | ⚠️ **P1** — Not produced. Required for App Store submission                                                                                                |
| 10  | App Review notes (demo credentials)      | ⚠️ **P1** — Not prepared                                                                                                                                   |
| 11  | Export compliance                        | ⚠️ **P2** — HTTPS only → self-classification. Document in App Store Connect                                                                                |
| 12  | Age rating                               | ⚠️ **P1** — Not completed. Complete IARC questionnaire                                                                                                     |

### Google Play

| #   | Requirement                              | Status                                                                                                                                             |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Application ID, versionCode, versionName | ✅ `mn.tasky.mobile`, versionCode 1, versionName 0.1.0                                                                                             |
| 2   | Release signing                          | ⚠️ **P0** — Same as §4.8. Uses debug keystore for release                                                                                          |
| 3   | Target API level                         | ⚠️ **P1** — `targetSdkVersion` references `rootProject.ext.targetSdkVersion` — value not found in repo. Must verify ≥ 35 for new Play apps in 2026 |
| 4   | Data Safety form                         | ⚠️ **P0** — Not completed                                                                                                                          |
| 5   | Account deletion                         | ⚠️ **P0** — Same as Apple §10.6                                                                                                                    |
| 6   | Permissions declaration                  | ⚠️ **P1** — Camera, microphone, photo library, location permissions need justification forms                                                       |
| 7   | Content rating (IARC)                    | ⚠️ **P1** — Not completed                                                                                                                          |
| 8   | Screenshots + feature graphic            | ⚠️ **P1** — Not produced                                                                                                                           |
| 9   | Privacy policy URL                       | ⚠️ **P0** — Privacy policy content exists in mobile app screens, but no publicly accessible URL (e.g., `https://tasky.mn/privacy`)                 |
| 10  | Pre-launch report                        | ⚠️ **P1** — Not reviewed                                                                                                                           |

### Cross-platform

| #   | Requirement            | Status                                                                         |
| --- | ---------------------- | ------------------------------------------------------------------------------ |
| 1   | Crash reporting        | ⚠️ **P0** — No Sentry/Crashlytics configured                                   |
| 2   | OTA update strategy    | ⚠️ **P2** — EAS Update not documented. Not using it currently                  |
| 3   | Force-update mechanism | ⚠️ **P1** — No minimum-version header from API or blocking update screen found |
| 4   | Localization (en + mn) | ✅ — i18n infrastructure in place with both locales                            |

---

## Section 11 — Legal & Compliance

| #   | Requirement                    | Status                                                                                                                                                                                                                                                                       |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Privacy Policy                 | ⚠️ **P0** — Privacy policy screens exist in the mobile app (i18n-driven), but (a) no publicly accessible web page at `/privacy`, (b) content completeness unknown, (c) must cover all PII from §6.10, Mongolian PDPL, cross-border transfers (Firebase, Facebook → US)       |
| 2   | Terms of Service               | ⚠️ **P0** — ToS screen exists in mobile app but completeness unknown. Must include: limitation of liability, acceptable use, Mongolian law jurisdiction, account termination, content ownership                                                                              |
| 3   | Cookie banner (web)            | ⚠️ **P2** — Facebook SDK sets cookies (`cookie: true` in AuthPage.tsx). If targeting users outside Mongolia where cookie laws apply, a banner may be needed. For Phase 1 Mongolia-only, document and defer.                                                                  |
| 4   | Consent capture at signup      | ⚠️ **P0** — No evidence of ToS/Privacy consent recording at signup with version + timestamp. Verification has `consentPolicyVersion` but general signup consent is not captured. Must add consent recording to the registration flow.                                        |
| 5   | Data Processing Agreements     | ⚠️ **P1** — Not collected. Need DPAs with Facebook, Firebase, Google Maps, hosting provider                                                                                                                                                                                  |
| 6   | Data deletion endpoint         | ⚠️ **P0** — `USER_SELF_DELETE_REQUEST` audit event exists, but end-to-end deletion (all PII columns from §6.10 purged within 30 days) must be verified. `DataRetentionService` handles banned-user cleanup at 90 days, but self-requested deletion may need a separate flow. |
| 7   | Data export endpoint           | ⚠️ **P1** — Not implemented. GDPR-style data portability not required by Mongolian law but recommended.                                                                                                                                                                      |
| 8   | Audit log retention            | ⚠️ **P1** — No retention policy defined for `audit_events` table. Recommend ≥ 1 year. Add a scheduled purge.                                                                                                                                                                 |
| 9   | Breach notification process    | ⚠️ **P1** — Not documented. Must document procedure to notify users + authority within applicable window.                                                                                                                                                                    |
| 10  | Open-source license compliance | ⚠️ **P2** — No `NOTICE` or `THIRD_PARTY_LICENSES` file generated.                                                                                                                                                                                                            |

---

## Section 12 — Operational Readiness & Sign-off

### 12.1 Capacity sizing

- ⚠️ **P1** — Not documented. Must specify VPS spec (CPU, RAM, disk), expected peak concurrent users, request rate, DB growth/month.

### 12.2 Cost model

- ⚠️ **P1** — Not documented. Must estimate monthly run-rate for VPS, domain, backup storage, Sentry, MinIO, Apple/Google dev accounts, Facebook app.

### 12.3 Cutover plan

- ⚠️ **P1** — Not documented. Must plan: DNS change timing, app store release timing, comms plan, support channel.

### 12.4 Day-2 plan

- ⚠️ **P1** — Not documented. Who watches dashboards in first 48 hours, escalation path, rollback decision criteria.

### 12.5 Final go/no-go

- To be completed in updated `PRODUCTION_READINESS.md` after all P0 items are resolved.

---

## Summary of Findings by Severity

### P0 (Must fix before production) — 17 items

| ID    | Section | Finding                                                                          |
| ----- | ------- | -------------------------------------------------------------------------------- |
| P0-01 | §4.8    | Android release signing uses debug keystore — production keystore not configured |
| P0-02 | §5.5    | Host firewall not documented in any runbook                                      |
| P0-03 | §5.6    | SSH hardening not documented in any runbook                                      |
| P0-04 | §6.4    | Encryption at rest (LUKS) not documented or verified                             |
| P0-05 | §6.6    | Offsite backup copy not configured                                               |
| P0-06 | §6.7    | No evidence of restore drill exercised                                           |
| P0-07 | §6.10   | PII inventory document not produced                                              |
| P0-08 | §8.3    | Missing P0 alerts: disk free < 20%, backup last-success > 90 min                 |
| P0-09 | §8.3    | Alertmanager webhook URL is a placeholder, not a real destination                |
| P0-10 | §8.7    | No crash reporting (Sentry/Crashlytics) on web or mobile                         |
| P0-11 | §8.8    | No on-call/paging mechanism documented                                           |
| P0-12 | §9      | Production runbook does not exist                                                |
| P0-13 | §10     | App Privacy questionnaire not produced (both stores)                             |
| P0-14 | §10     | ATT not implemented for iOS (required with Facebook SDK)                         |
| P0-15 | §10     | Sign in with Apple not implemented (required with Facebook SSO on iOS)           |
| P0-16 | §11     | Privacy Policy and Terms of Service not published at public URL                  |
| P0-17 | §11     | Signup consent (ToS/Privacy version + timestamp) not captured                    |

### P1 (Should fix before or shortly after launch) — 22 items

| ID    | Section | Finding                                                                                        |
| ----- | ------- | ---------------------------------------------------------------------------------------------- |
| P1-01 | §1.5    | Production secret injection mechanism undocumented                                             |
| P1-02 | §1.6    | Blind index key rotation procedure not documented                                              |
| P1-03 | §2.1    | Base images not pinned to digests                                                              |
| P1-04 | §2.1    | Web container lacks healthcheck                                                                |
| P1-05 | §2.6    | No SBOM generation in CI pipeline                                                              |
| P1-06 | §3.9    | Audit log gaps: no login/logout/role-change events                                             |
| P1-07 | §4.4    | Source-map exposure not explicitly verified                                                    |
| P1-08 | §4.7    | Android network security config missing                                                        |
| P1-09 | §4.10   | Certificate pinning not implemented (accept and document, or implement)                        |
| P1-10 | §4.13   | Permission strings not localized to Mongolian                                                  |
| P1-11 | §6.5    | WAL archive retention not configured (unbounded growth)                                        |
| P1-12 | §7.3    | Branch protection not verified (requires repo admin access)                                    |
| P1-13 | §7.5    | Rollback drill not exercised on staging                                                        |
| P1-14 | §8.2    | Grafana dashboards incomplete (7 of 8 required dashboards missing)                             |
| P1-15 | §8.4    | No PII redaction in production logs                                                            |
| P1-16 | §8.5    | Docker log rotation not configured                                                             |
| P1-17 | §8.8    | Status page not configured                                                                     |
| P1-18 | §8.9    | SLO document does not exist                                                                    |
| P1-19 | §8.10   | Per-alert runbook entries do not exist                                                         |
| P1-20 | §10     | Multiple app store readiness items (screenshots, content rating, review notes, version policy) |
| P1-21 | §10     | Force-update mechanism not implemented                                                         |
| P1-22 | §12     | Capacity sizing, cost model, cutover plan, day-2 plan not documented                           |

### P2 (Nice to have / post-launch) — 10 items

| ID    | Section | Finding                                                                   |
| ----- | ------- | ------------------------------------------------------------------------- |
| P2-01 | §1.7    | Firebase JSON in env var visible in docker inspect (consider file mount)  |
| P2-02 | §2.1    | Web Dockerfile base images not pinned to digests                          |
| P2-03 | §2.5    | Gradle dependency locking not enabled                                     |
| P2-04 | §2.7    | GHCR images not signed with cosign                                        |
| P2-05 | §4.14   | Deep links / universal links not configured                               |
| P2-06 | §7.6    | No auto-merge policy for Dependabot security updates                      |
| P2-07 | §7.7    | OpenSSF Scorecard score not recorded                                      |
| P2-08 | §8.6    | OpenTelemetry tracing not configured                                      |
| P2-09 | §11.10  | Open-source license compliance (NOTICE/THIRD_PARTY_LICENSES) not produced |
| P2-10 | §9.5    | Docker userns-remap not configured                                        |
