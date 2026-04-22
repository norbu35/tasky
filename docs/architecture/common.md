# Tasky Architecture — Common Baseline

Status: derived cross-cutting baseline. Backend specifics live in `api.md`; frontend parity in `shared-frontend.md`; per-surface rules in `web.md` / `mobile.md`.

## 1. Executive Summary

**System Type:** Modular Monolith
**Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL, React/React Native
**Key Constraint:** "Trust-First" (Graceful degradation)

This document defines cross-cutting technical architecture for Tasky: system context, shared technology decisions,
runtime patterns, non-functional baselines, and development workflow. Intended product truth lives in `docs/PRD.md`,
`docs/STRATEGY.md`, and relevant maintenance policy docs.

---

## 2. System Context & Boundaries

### 2.1 High-Level Context

Tasky acts as a trusted intermediary between **Customers** (Demand) and **Taskers** (Supply).

- **External Systems**:
  - **QPay (Phase 2+)**: Credit pack purchases in Phase 2 and escrow settlement rails in Phase 3+.
  - **SMS Gateway (Phase 2+)**: OTP delivery and critical fallback notifications.
    - **Google Maps / Mapbox**: Geocoding and static maps.
    - **Push Provider (Firebase Cloud Messaging)**: Mobile notifications via FCM for Android; FCM → APNs bridge for iOS. Expo Push relay is explicitly not used.
  - **LLM Provider (Phase 3+ optional)**: Async task scope summary polish only; never blocking task posting.

### 2.2 Modular Monolith Structure

The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication occurs via internal service interfaces (Java method calls), not network calls, to preserve simplicity.

For the full package-to-domain mapping, see `api.md` §2.

---

## 3. Shared Tech Decisions

### 3.1 Language & Runtime Versions

- **Backend**: Java 21 (LTS), Spring Boot 3.x — see `api.md` §6.1 for stack details.
- **Web**: React 19, Vite 8, Tailwind CSS 4, TanStack Query, Radix UI primitives + Tailwind (shadcn file conventions; not CLI-managed).
- **Mobile**: React Native (Expo) with Expo Router-owned navigation chrome, NativeWind-first styling, and a layered token contract — see `mobile.md` for structural rules.
- **API Client**: TypeScript SDK generated from OpenAPI.
- **Database**: PostgreSQL 16 + PostGIS (for geospatial queries).

### 3.2 Shared Infrastructure Services

- **File Storage**:
  - **Local**: MinIO (S3 compatible) running in Docker.
  - **Production**: AWS S3.
  - **Pattern**: Clients request a "Presigned Upload URL" from the backend, then upload files directly to S3/MinIO.
    Backend stores the key/URL only.
  - **Security**: Buckets must be private. Public access is blocked. Downloads for sensitive data (IDs) use Presigned
    GET URLs.
- **Push Notifications (FCM)**:
  - **Provider**: Firebase Cloud Messaging (FCM) via Firebase Admin SDK on the backend. Expo Push relay is not used.
  - **Mobile**: `@react-native-firebase/messaging` for token acquisition and topic subscriptions; `@notifee/react-native` for local notification display and Android channels. `expo-notifications` is retained only for permission requests.
  - **Individual delivery**: `FirebasePushProvider` calls `FirebaseMessaging.send()` per device token stored in `device_tokens`.
  - **Topic fan-out** (Phase 1+): Subscribe devices server-side via Firebase Admin SDK on Tasker profile save. Topic taxonomy:
    - `taskers.district.{slug}` — all Taskers in a geo district
    - `taskers.category.{slug}` — all Taskers in a skill category
    - `taskers.district.{slug}.{category}` — compound precision targeting (primary supply activation topic)
    - `taskers.concierge-pool` — founder-operated concierge dispatch
    - `customers.churned.{category}` — inactive Customer reactivation
    - `platform.all` — system-wide announcements
  - **Configuration**: `FIREBASE_SERVICE_ACCOUNT_JSON` env var; `tasky.push.provider=firebase` activates `FirebasePushProvider`.
  - **Current state**: `FirebasePushProvider` is the active production provider. Expo push relay is removed from runtime use and retained only as historical context in ADR-0002.
- **Geospatial**:
  - **Engine**: PostGIS running in the Postgres container.
  - **Indexing**: GiST index on `tasks.location_point` is mandatory.
  - **Query**: Use `ST_DWithin` for radius searches (e.g., "Tasks within 5km").

### 3.3 Containerization & Local Dev

- All services (App, DB, MinIO) must be defined in `docker-compose.yml` for local dev.
- Runtime DB uses `APP_DB_USER`, not `POSTGRES_USER`.
- Do not bypass PgBouncer for runtime connections.

---

## 4. Runtime Patterns

### 4.1 Event / Outbox / Async

- **Mechanism (retired):** The old `@Async` + `ApplicationEventPublisher` + polling relay mechanism is
  **retired**. The previous polling-based outbox relay is also retired.
- **Mechanism (current — two-path publish):** `DomainEventOutboxService` persists events to
  `domain_outbox_events` and, when `tasky.automation.broker.enabled=true`, directly publishes to RabbitMQ
  via `EventRelayPublisher`. On successful direct publish, the row is marked `PROCESSED` immediately.
  Rows that fail to publish remain `PENDING` for relay recovery.
- **Relay recovery:** `OutboxRelayScheduler` runs every 10 s (ShedLock-guarded), delegating to
  `OutboxRelayService`. Recovery loop: `claimBatch` (PENDING/FAILED rows) → `publish` →
  `markProcessed` / `markFailed`. Failed events receive exponential backoff (30 s base, 1 h max)
  with configurable max attempts (default 10). Events exceeding max attempts remain `FAILED` with a 24-hour permanent backoff — they are not promoted to a different status but will not be retried aggressively. Admin replay can reset `FAILED` → `PENDING` for reprocessing.
- **At-least-once delivery:** The system provides true at-least-once semantics — direct publish on the
  happy path, relay recovery for failures. Handler-level idempotency via `WorkflowIdempotencyGuard`
  handles duplicate deliveries.
- **Persistence:** The `domain_outbox_events` table provides the durability guarantee. The outbox row is
  written first; broker publish is attempted synchronously afterward. Broker failure does **not** roll back
  the domain transaction because the row already exists.
- **Admin replay:** `OutboxReplayController` resets `FAILED` → `PENDING`; the relay scheduler picks up
  replayed events on the next cycle. Replay now works end-to-end.
- **Health:** `OutboxHealthIndicator` correctly reports health — events transition out of `PENDING`
  (via direct publish or relay), so stale-PENDING false-negatives no longer occur.
- **Consumption:** `EventWorkerConsumer` (RabbitMQ listener) dispatches to registered `EventHandler`
  implementations by event type, with retry routing (x-death headers) and DLQ fallback after max retries.
- Events carry context propagation fields (`correlation_id`, `causation_id`, `command_id`, `workflow_id`,
  `actor_id`, `locale`, `platform`).

### 4.2 Internationalization Baseline

- **Development language**: All source code, comments, API field names, and log messages are in English.
- **Default locale**: Mongolian (`mn-MN`). The app ships with Mongolian as the default user-facing language.
- **String management**:
  - **Backend**: API error messages and notification templates use keyed message bundles (`messages_en.properties`,
    `messages_mn.properties`) resolved via Spring `MessageSource`.
  - **Web**: JSON translation files per locale (`en.json`, `mn.json`) loaded by `react-i18next`.
  - **Mobile**: Same JSON files bundled via `react-i18next` + Expo localization.
- **Translation workflow**: English remains the technical source for keys, code, and fallback structure. Mongolian
  copy must be authored and reviewed so it reads naturally in Mongolian rather than as machine-translated English.
  Translation files live under `src/main/resources/i18n/` (backend) and `locales/` (clients).
- **Database content**: User-generated content (task descriptions, reviews) is stored as-is. Admin-managed content (
  category names) has explicit `name` (English) and `name_mn` (Mongolian) columns.
- **API contract**: The API returns server-driven strings (error messages, notification text) localized based on the
  `Accept-Language` header. If the requested locale is unavailable, the server falls back to `mn`.

---

## 5. Non-Functional Baseline

### 5.1 Reliability

- **Idempotency**: Critical irreversible state-changing endpoints must accept an `Idempotency-Key` header.
  - Minimum MVP scope: application accept, booking cancel/complete, dispute creation/resolution.
  - Phase 2+ monetization scope: lead-unlock credit spending, payment initiation/callback handling, and payout
    processing.
- **Schema Safety (Structured Intake)**:
  - Category schema activation runs lint + preview validation before activation.
  - Rollout supports canary activation and instant rollback to last-known-good schema version.
  - Task drafts bind schema version at form start to prevent submit-time drift.
- **Offline Support**: Mobile app caches active "My Tasks" locally (AsyncStorage) for read-only viewing when offline.
  This is limited to previously fetched data; no offline mutations are supported in MVP.
- **Policy Guards**:
  - Enforce Tuesday/Friday payout processing window in platform timezone.
  - Enforce no-show and late-cancel timers against latest accepted in-app schedule only.

### 5.2 Observability

- **Logs**: Structured JSON logs with `trace_id` and `user_id`.
- **Metrics**: Prometheus endpoint exposing JVM, HikariCP, and HTTP latency metrics.
- **Product Events**:
  - Must support backend-exported business metrics aligned to the governing KPI model:
    `pilot_eligible_task`, `qualified_application`, `confirmed_booking`, `completed_booking`, `intervention`,
    `out_of_area_post_attempted`, `out_of_area_waitlist_joined`.
  - Intake-related events must include `category_id`, `intake_schema_version`, and `client_app_version`.
  - Funnel events must include `locale` and `platform` dimensions.
- **Product Metrics (Required)**:
  - Required launch KPIs are the seven metrics defined in `docs/METRICS.md`.
  - Category is the primary slice; district is drilldown.
  - Native self-serve reporting must exclude both system-assisted and manual-assisted outcomes.
- **Operational Alerts**:
  - Alert on the four hard-gate KPI families defined in `docs/METRICS.md`.
  - Alert on verification SLA breaches and OAuth outage active windows.
  - Alert when open-task feed p95 latency breaches performance SLO budget.

### 5.3 Performance and Legal Compliance

- **Feed Performance Budget**:
  - Open-task feed should meet <1s median response under representative 4G client conditions.
  - Track backend API p95 and end-to-end client render timing separately.
- **Regulatory and Legal Controls**:
  - Identity and contact data handling must align with Mongolia Personal Information law and documented retention
    policy.
  - Connector liability disclaimer text/version must be versioned and auditable.
  - Track cumulative tasker engagement duration and alert operations before 2-year continuous activity threshold.

---

## 6. Development Workflow

1. **Pick up a task**: Use the active issue, ticket, or approved execution brief.
2. **Design**: Update `docs/openapi/**` first (contract-first) when the API changes, then regenerate `docs/API.yaml`.
3. **Generate**: Run `pnpm sdk:generate` to regenerate TypeScript SDK types from the contract.
4. **Implement**: Write controller implementations and JDBI repositories.
5. **Test**: Write tests for every "Done When" criterion. Run `./gradlew --no-daemon test`.
6. **Verify**: Run `./gradlew openApiValidate`, `pnpm -r typecheck`, `pnpm -r test`.
7. **Commit**: Commit code and tests together.
8. **PR + CI**: Push branch, open PR. CI runs backend tests, frontend checks, and security scans.
9. **Review + Merge**: Merge after human review and passing CI.

---

## 7. Cross-Reference Index

| Concern                          | Authority                                              |
| -------------------------------- | ------------------------------------------------------ |
| **Foundational design patterns** | **`api.md` §1.1**                                      |
| Backend module layout            | `api.md` §2                                            |
| Request-path architecture        | `api.md` §3                                            |
| Data schemas and flows           | `api.md` §4                                            |
| API design and security          | `api.md` §5                                            |
| Backend runtime and testing      | `api.md` §6–§8                                         |
| Design tokens and parity         | `shared-frontend.md` §2–§4                             |
| Accessibility baseline           | `shared-frontend.md` §5                                |
| Frontend file structure          | `shared-frontend.md` §6                                |
| TID test naming                  | `shared-frontend.md` §7                                |
| Intake renderer contract         | `shared-frontend.md` §8                                |
| Web structural contract          | `web.md`                                               |
| Mobile structural contract       | `mobile.md`                                            |
| OpenAPI contracts                | `docs/openapi/AGENTS.md`, `docs/openapi/openapi.yaml`  |
| PRD requirements                 | `docs/PRD.md`                                          |
| PRD-to-architecture traceability | `docs/PRD.md` functional requirements and KPI sections |
| Architecture decision records    | `docs/adr/**`                                          |
| Launch readiness                 | `docs/maintenance/PRODUCTION_READINESS.md`             |
| Feature activation policy        | `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`        |
| Observability                    | `docs/OBSERVABILITY.md`                                |
| Metrics                          | `docs/METRICS.md`                                      |
