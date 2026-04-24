# Tasky Architecture — Common Baseline

This document covers the shared technical baseline for Tasky. Backend specifics live in `api.md`; frontend parity in `shared-frontend.md`; per-surface rules live in `web.md` and `mobile.md`.

## 1. Executive Summary

**System Type:** Modular Monolith
**Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL, React/React Native
**Key Constraint:** "Trust-First" (Graceful degradation)

This document defines cross-cutting technical architecture for Tasky: system context, shared technology decisions,
runtime patterns, non-functional baselines, and development workflow. Product behavior is defined in `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, and the relevant maintenance policy docs.

## 1.1 Interpretation Rule

Use the governance docs in this order when reading shared architecture:

1. `docs/PRD.md` defines the active Phase 1 product contract.
2. `docs/STRATEGY.md` defines launch posture and operating discipline.
3. `docs/ROLLOUT_PHASES.md` defines the intended sequencing for deferred capabilities beyond Phase 1.
4. Maintenance policies define toggle posture, activation readiness, and staging discipline.
5. This document describes the shared technical baseline that supports those rules.

If a deferred integration appears in code or infrastructure before its planned phase, keep it labeled dormant. Its existence does not make it part of the active runtime contract.

---

## 2. System Context & Boundaries

### 2.1 High-Level Context

Tasky acts as a trusted intermediary between **Customers** (Demand) and **Taskers** (Supply).

- **External Systems**:
  - **Facebook OAuth**: the only launch login provider for new sessions.
  - **SMS Gateway**: critical fallback notifications such as reminders and completion nudges. OTP is not part of the Phase 1 launch baseline.
  - **Google Maps / Mapbox**: geocoding and static maps.
  - **Push Provider (Firebase Cloud Messaging)**: mobile notifications via FCM for Android and the FCM → APNs bridge for iOS. Expo Push relay is explicitly not used.
  - **Object Storage (MinIO / S3)**: private storage for uploads such as verification artifacts and images.

Deferred payment, escrow, payout, alternate-auth, and runtime-LLM integrations are not part of the launch baseline even if dormant scaffolding exists in code or schema.

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
  - **Individual delivery**: `FirebasePushProvider` sends to device tokens stored in `device_tokens`.
  - **Topic fan-out**: subscribe devices server-side for launch-relevant targeting such as category and district/category combinations.
  - **Configuration**: `FIREBASE_SERVICE_ACCOUNT_JSON` env var; `tasky.push.provider=firebase` activates `FirebasePushProvider`.
  - `FirebasePushProvider` is the active production provider.

```claim env-var
name: FIREBASE_SERVICE_ACCOUNT_JSON
```

```claim config-key
key: tasky.push.provider
```

```claim symbol-exists
class: mn.tasky.notification.provider.FirebasePushProvider
```

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

- `DomainEventOutboxService` persists events to `domain_outbox_events` and publishes them through the broker path when broker mode is enabled.
- `OutboxRelayScheduler` and `OutboxRelayService` recover failed or pending publishes and provide the at-least-once delivery path.
- `EventWorkerConsumer` dispatches automation events to registered handlers.
- Handler-level idempotency is enforced through `WorkflowIdempotencyGuard`.
- Events carry correlation and actor context (`correlation_id`, `causation_id`, `command_id`, `workflow_id`, `actor_id`, `locale`, `platform`) so request context survives the async boundary.
- The outbox is used for launch-critical side effects such as notifications, reminders, analytics emission, and recovery workflows.

```claim symbol-exists
class: mn.tasky.common.outbox.OutboxRelayService
```

### 4.2 Internationalization Baseline

- **Development language**: All source code, comments, API field names, and log messages are in English.
- **Default locale**: Mongolian (`mn-MN`). The app ships with Mongolian as the default user-facing language.
- **String management**:
  - **Backend**: API error messages and notification templates use keyed message bundles (`messages_en.properties`,
    `messages_mn.properties`) resolved via Spring `MessageSource`.
  - **Web**: App-owned JSON translation files under `apps/web/src/locales/{en,mn}/translation.json` loaded by
    `react-i18next`.
  - **Mobile**: App-owned JSON translation files under `apps/mobile/src/locales/{en,mn}/translation.json` loaded by
    `react-i18next` + Expo localization.
- **Translation workflow**: English remains the technical source for keys, code, and fallback structure. Mongolian
  copy must be authored and reviewed so it reads naturally in Mongolian rather than as machine-translated English.
  Translation files live under `src/main/resources/i18n/` (backend) and each client's `src/locales/` directory. Web
  and mobile locale files are not shared artifacts; they are validated together by `pnpm verify:i18n` for key parity
  within each app, placeholder parity, missing used keys, empty values, and disallowed `t(...)` fallback strings.
- **Database content**: User-generated content (task descriptions, reviews) is stored as-is. Admin-managed content (
  category names) has explicit `name` (English) and `name_mn` (Mongolian) columns.
- **API contract**: The API returns server-driven strings (error messages, notification text) localized based on the
  `Accept-Language` header. If the requested locale is unavailable, the server falls back to `mn`.

---

## 5. Non-Functional Baseline

### 5.1 Reliability

- **Idempotency**: Critical irreversible state-changing endpoints must accept an `Idempotency-Key` header.
  - Minimum Phase 1 scope: application accept, booking cancel, booking completion, and dispute creation/resolution.
- **Schema Safety (Structured Intake)**:
  - Category schema activation runs lint + preview validation before activation.
  - Rollout supports canary activation and instant rollback to last-known-good schema version.
  - Task drafts bind schema version at form start to prevent submit-time mismatch.
- **Offline Support**: Mobile app caches active "My Tasks" locally (AsyncStorage) for read-only viewing when offline.
  This is limited to previously fetched data; no offline mutations are supported in MVP.
- **Policy Guards**:
  - Enforce no-show and late-cancel timers against the latest accepted in-app schedule only.
  - Keep intervention and assisted-distribution outcomes measurable so self-serve KPI reporting stays truthful.

### 5.2 Observability

- **Logs**: Structured JSON logs with `trace_id` and `user_id`.
- **Metrics**: Prometheus endpoint exposing JVM, HikariCP, and HTTP latency metrics.
- **Product Events**:
  - Must support backend-exported business metrics aligned to the governing KPI model:
    `eligible_task`, `qualified_application`, `confirmed_booking`, `completed_booking`, `intervention`,
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
| Frontend test naming             | `shared-frontend.md` §7                                |
| Intake renderer contract         | `shared-frontend.md` §8                                |
| Web structural contract          | `web.md`                                               |
| Mobile structural contract       | `mobile.md`                                            |
| OpenAPI contracts                | `docs/openapi/AGENTS.md`, `docs/openapi/openapi.yaml`  |
| PRD requirements                 | `docs/PRD.md`                                          |
| Rollout sequencing               | `docs/ROLLOUT_PHASES.md`                               |
| PRD-to-architecture traceability | `docs/PRD.md` functional requirements and KPI sections |
| Launch readiness                 | `docs/maintenance/PRODUCTION_READINESS.md`             |
| Feature activation policy        | `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`        |
| Observability                    | `docs/OBSERVABILITY.md`                                |
| Metrics                          | `docs/METRICS.md`                                      |
