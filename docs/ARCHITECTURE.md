# Architecture Specification: Tasky

Quick navigation: start with `docs/ARCHITECTURE_INDEX.md` to choose canonical docs by topic; use this file as the
deep technical baseline.

## 1. Executive Summary

**System Type:** Modular Monolith
**Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL, React/React Native
**Key Constraint:** "Trust-First" (Graceful degradation)

This document defines the technical architecture for Tasky. It serves as the blueprint for implementation and ensures
all engineering efforts align with the `AGENTS.md` doctrine and `PRD.md` requirements.

---

## 2. System Context & Boundaries

### 2.1 High-Level Context

Tasky acts as a trusted intermediary between **Customers** (Demand) and **Taskers** (Supply).

* **External Systems**:
    * **QPay (Phase 2+)**: Credit pack purchases in Phase 2 and escrow settlement rails in Phase 3+.
  * **SMS Gateway (Phase 2+)**: OTP delivery and critical fallback notifications.
    * **Google Maps / Mapbox**: Geocoding and static maps.
    * **Push Provider (Firebase Cloud Messaging)**: Mobile notifications via FCM for Android; FCM → APNs bridge for iOS. Expo Push relay is explicitly not used.
  * **LLM Provider (Phase 3+ optional)**: Async task scope summary polish only; never blocking task posting.

### 2.2 Modular Monolith Structure

The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication
occurs via internal service interfaces (Java method calls), not network calls, to preserve simplicity.

**Logical domains and their Java packages** (`mn.tasky.<package>`):

| Domain | Packages | Responsibility |
|---|---|---|
| **identity** | `auth`, `user`, `security`, `verification` | Auth (Facebook OAuth, OTP), user profiles, JWT filter, KYC/verification queue |
| **marketplace** | `task`, `category`, `booking` | Task posting & intake schemas, category management, booking state machine, applications |
| **wallet** *(Phase 2+)* | `wallet`, `payment` | Credit ledger (Phase 2), internal wallet/escrow/payouts (Phase 3+), QPay integration |
| **communication** | `messaging`, `notification` | In-app WebSocket messaging, push notifications (FCM), SMS fallback |
| **support** | `dispute`, `review`, `admin`, `analytics` | Disputes & evidence, review enforcement, admin tools, analytics event tracking |
| **common** | `common` | Cross-cutting: security filters, pagination, error handling, crypto, outbox, health, storage |

Cross-domain communication uses internal Java method calls only — no network hops between domains.

---

## 3. Technology Decisions

### 3.1 Backend Stack

* **Language**: Java 21 (LTS)
* **Framework**: Spring Boot 3.x
* **Persistence**: **JDBI 3** (SQL Object API)
    * *Rationale*: We prefer explicit SQL control over JPA magic for performance and predictability.
    * *Migration*: Flyway
* **Database**: PostgreSQL 16 + PostGIS (for geospatial queries)
* **Auth**: Spring Security + JWT (Stateless)

### 3.2 Frontend Stack

* **Web**: React 18, Vite, TailwindCSS, TanStack Query, Radix UI primitives + Tailwind (shadcn file conventions; not CLI-managed).
* **Mobile**: React Native (Expo), NativeWind, React Navigation, token-driven native component library (Radix/shadcn not used on mobile).
* **API Client**: TypeScript SDK generated from OpenAPI.

### 3.3 Infrastructure Services (AWS & Containers)

* **Containerization**: All services (App, DB, MinIO) must be defined in `docker-compose.yml` for local dev.
* **File Storage**:
    * **Local**: MinIO (S3 compatible) running in Docker.
    * **Production**: AWS S3.
    * **Pattern**: Clients request a "Presigned Upload URL" from the backend, then upload files directly to S3/MinIO.
      Backend stores the key/URL only.
    * **Security**: Buckets must be private. Public access is blocked. Downloads for sensitive data (IDs) use Presigned
      GET URLs.
* **Push Notifications (FCM)**:
    * **Provider**: Firebase Cloud Messaging (FCM) via Firebase Admin SDK on the backend. Expo Push relay is not used.
    * **Mobile**: `@react-native-firebase/messaging` for token acquisition and topic subscriptions; `@notifee/react-native` for local notification display and Android channels. `expo-notifications` is retained only for permission requests.
    * **Individual delivery**: `FirebasePushProvider` calls `FirebaseMessaging.send()` per device token stored in `device_tokens`.
    * **Topic fan-out** (Phase 1+): Subscribe devices server-side via Firebase Admin SDK on Tasker profile save. Topic taxonomy:
        * `taskers.district.{slug}` — all Taskers in a geo district
        * `taskers.category.{slug}` — all Taskers in a skill category
        * `taskers.district.{slug}.{category}` — compound precision targeting (primary supply activation topic)
        * `taskers.concierge-pool` — founder-operated concierge dispatch
        * `customers.churned.{category}` — inactive Customer reactivation
        * `platform.all` — system-wide announcements
    * **Configuration**: `FIREBASE_SERVICE_ACCOUNT_JSON` env var; `tasky.push.provider=firebase` activates `FirebasePushProvider`.
    * **Current state**: `FirebasePushProvider` is the active production provider. Expo push relay is removed from runtime use and retained only as historical context in ADR-0002.
* **Async Processing**:
    * **Mechanism**: Spring `@Async` + `ApplicationEventPublisher` for decoupling.
    * **Persistence**: For critical tasks (e.g., notifications, payouts), the `domain_outbox_events` table provides at-least-once delivery with retry logic (`DomainEventOutboxProcessor`).
* **Geospatial**:
    * **Engine**: PostGIS running in the Postgres container.
    * **Indexing**: GiST index on `tasks.location_point` is mandatory.
    * **Query**: Use `ST_DWithin` for radius searches (e.g., "Tasks within 5km").

### 3.4 Frontend Design System Architecture

* **Component Source of Truth (Web)**:
    * Base primitives are hand-authored Radix UI + Tailwind components in `apps/web/src/components/ui`, following shadcn file conventions. The shadcn CLI is not in use.
    * Product-level components are composed from those primitives in feature folders.
    * Additional third-party UI frameworks (MUI, Ant, Chakra, etc.) are forbidden for web runtime components.
* **Token Source of Truth (Cross-Platform)**:
    * Canonical design tokens live in a shared package (recommended: `packages/design-tokens`).
    * Web consumes tokens via Tailwind/theme variables.
    * Mobile consumes the same tokens through a React Native adapter layer.
* **Parity Contract (Web <-> Mobile)**:
    * Each shared UX pattern (Button, Input, Select, Modal/Sheet, Toast, Form Field, Empty State) has a parity record
      defining states, spacing, typography, and interaction behavior.
    * Mobile keeps native rendering patterns while matching token values and state semantics.
  * Canonical parity baseline table: see §7.2 below.
* **Accessibility Baseline**:
    * Web components must preserve Radix/shadcn accessibility defaults and satisfy keyboard navigation + WCAG AA
      contrast.

---

## 4. Data Architecture

### 4.1 Core Schema (ERD)

#### Identity Module

* `users`: `id (UUID)`, `facebook_id (nullable, UK)`, `phone (nullable, UK)`, `primary_auth` (FACEBOOK, PHONE_OTP),
  `role`, `status` (PENDING, ACTIVE, VERIFIED, SUSPENDED, BANNED), `suspension_end_at`, `created_at`, `updated_at`
* `profiles`: `user_id (FK)`, `full_name`, `avatar_url`, `rating_avg`
* `verifications`: `user_id (FK)`, `id_card_front_key`, `id_card_back_key`, `status`, `admin_notes`, `submitted_at`,
  `reviewed_at`, `consent_policy_version`, `consent_accepted_at`, `dan_reference` (nullable)
  — columns store S3/MinIO object keys, not URLs; download links are generated via presigned GET URLs on demand

#### Marketplace Module

* `tasks`: `id`, `customer_id`, `category_id (FK)`, `description`, `budget`, `location_point (GEOMETRY)`,
  `location_text`, `status` (OPEN, ASSIGNED, COMPLETED, CANCELLED, NO_SHOW), `scheduled_at`, `intake_answers_json`
  (JSONB), `intake_schema_version`, `scope_summary_source` (TEMPLATE, USER_EDITED, LLM),
  `business_account_id (FK, nullable)` *(Phase 2+ B2B Lite — tags task as belonging to a business account)*
* `task_drafts`: `id`, `customer_id`, `category_id`, `intake_answers_json (JSONB)`, `intake_schema_version`,
  `summary_draft`, `created_at`, `expires_at`
* `task_photos`: `id`, `task_id (FK)`, `storage_key`, `sort_order`
* `categories`: `id`, `name`, `name_mn`, `icon_url`, `is_active`, `sort_order`, `intake_enabled`,
  `intake_schema_version`, `intake_schema_json (JSONB)`, `last_known_good_schema_version`
* `category_schema_versions`: `id`, `category_id`, `version`, `schema_json (JSONB)`, `status` (DRAFT, CANARY, ACTIVE,
  ROLLED_BACK), `is_last_known_good`, `created_by`, `created_at`, `activated_at`
* `task_applications`: `task_id`, `tasker_id`, `status` (APPLIED, SELECTED, ACCEPTED, DECLINED, EXPIRED),
  `relevance_score`, `recommended`, `selected_at`, `respond_by_at`, `created_at`
* `instant_match_offers` *(Phase 3+ — not yet created)*: `id`, `task_id`, `tasker_id`, `offer_rank`, `expires_at`, `status`
  (PENDING, ACCEPTED, DECLINED, EXPIRED), `created_at`
* `bookings`: `id`, `task_id`, `tasker_id`, `status` (ASSIGNED, COMPLETED, CANCELLED, NO_SHOW), `price`,
  `confirmed_scheduled_at`, `liability_disclaimer_accepted`, `liability_disclaimer_accepted_at`, `settlement_mode`
  (DIRECT, LEAD_UNLOCK, ESCROW), `late_cancel_incident`, `created_at`
* `booking_schedule_events`: `id`, `booking_id`, `actor_user_id`, `event_type` (REQUESTED, ACCEPTED, DECLINED, EXPIRED),
  `proposed_scheduled_at`, `reason`, `created_at`
* `booking_timeline_events`: `id`, `booking_id`, `event_type`, `actor_user_id`, `metadata_json (JSONB)`, `created_at`
* `task_rescue_events`: `id`, `task_id`, `triggered_at`, `trigger_window` (DAYTIME, OFF_HOURS), `actions_json` (JSONB),
  `created_at`
* `booking_reviews`: `id`, `booking_id`, `reviewer_id`, `reviewee_id`, `quality_rating`, `punctuality_rating`,
  `communication_rating`, `clarity_rating`, `respectfulness_rating`, `comment`, `created_at`
* `tasker_reliability_scores`: `tasker_id`, `score`, `completion_rate`, `punctuality_rate`, `cancellation_rate`,
  `review_avg`, `window_days`, `computed_at`
* `tasker_badges`: `tasker_id`, `badge_type` (PRO), `assigned_at`, `revoked_at`

#### Wallet Module *(Phase 2+)*

* `credit_balances`: `tasker_id (PK)`, `balance`, `total_purchased`, `total_spent`, `total_refunded`, `updated_at`
* `credit_transactions`: `id`, `tasker_id`, `amount`, `type` (PURCHASE, SPEND, REFUND, SIGNUP_BONUS), `reference_id`,
  `idempotency_key`, `created_at`
* `credit_packs`: `id`, `name`, `credit_count`, `price_mnt`, `is_active`
* `lead_unlock_prices`: `id`, `category_id`, `district_id`, `credits_required`, `effective_from`, `effective_to`,
  `updated_by`
* `wallets` *(Phase 3+)*: `user_id (PK)`, `available_balance_mnt`, `pending_balance_mnt`, `updated_at`
* `ledger_entries` *(Phase 3+)*: `id`, `wallet_id`, `amount`, `type` (DEPOSIT, FEE, PAYOUT, REFUND), `reference_id`,
  `created_at`
* `payout_requests` *(Phase 3+)*: `id`, `user_id`, `amount`, `bank_account`, `status`, `requested_at`, `processed_at`,
  `processed_by`
* `tasker_subscriptions` *(Phase 3+)*: `id`, `tasker_id`, `status`, `started_at`, `expires_at`, `plan_code`
* `business_accounts` *(Phase 2+)*: `id`, `owner_user_id (FK)`, `name`, `plan_code`, `billing_cycle_day`,
  `status` (TRIAL, ACTIVE, SUSPENDED, CHURNED), `created_at`
* `business_locations` *(Phase 2+)*: `id`, `business_account_id (FK)`, `label`, `address_text`,
  `location_point (GEOMETRY)`, `is_active`
* `business_members` *(Phase 2+)*: `id`, `business_account_id (FK)`, `user_id (FK)`, `role` (OWNER, MANAGER),
  `joined_at`, UNIQUE(`business_account_id`, `user_id`)

#### Communication Module

* `conversations`: `id`, `task_id (FK)`, `customer_id (FK)`, `tasker_id (FK)`, `created_at`
* `messages`: `id`, `conversation_id (FK)`, `sender_id (FK)`, `content`, `phone_number_flagged`, `content_hash`,
  `created_at`
* `device_tokens`: `user_id (FK)`, `token`, `platform` CHECK (IOS, ANDROID, WEB), `created_at`
* `notification_log`: `id`, `user_id`, `type`, `channel` (PUSH, SMS), `status`, `event_key`, `provider_message_id`,
  `error_code`, `created_at`

#### Support Module

* `disputes`: `id`, `booking_id (FK)`, `raised_by (FK)`, `reason`, `status`, `resolution_action` (RESOLVE_CUSTOMER,
  RESOLVE_TASKER, ESCALATE, REFUND, RELEASE), `wrongful_party_user_id`, `resolution_notes`, `created_at`
* `dispute_evidence`: `id`, `dispute_id (FK)`, `type` (CHAT_EXCERPT, PHOTO, WRITTEN_TIMELINE), `storage_key`,
  `text_payload`, `created_at`
* `tasker_strikes`: `id`, `user_id (FK)`, `booking_id (FK)`, `reason`, `created_at`
* `referrals`: `id`, `referrer_id`, `referred_id`, `conversion_event`, `converted_at`, `reward_type`, `reward_applied`
* `referral_rewards`: `id`, `referral_id`, `phase`, `reward_type`, `reward_value`, `applied_at`
* `review_enforcement_cases`: `id`, `booking_id`, `user_id`, `reason_code`, `status`, `triggered_at`, `resolved_at`
* `audit_events`: `id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `metadata_json (JSONB)`,
  `created_at`

#### Infrastructure Tables

* `domain_outbox_events`: `id`, `type`, `payload (JSONB)`, `status` (PENDING, PROCESSING, PROCESSED, FAILED), `attempts`, `last_error`, `available_at`, `created_at`
  — full outbox pattern with retry and scheduling; processed by `DomainEventOutboxProcessor`
* `feature_toggles`: `id`, `feature_name`, `is_enabled`, `activated_at`, `deactivated_at`, `updated_by`
  — six toggles are seeded at migration time: `escrow_enabled` (Phase 3+, gated in wallet/payment/payout controllers),
  `lead_fee_enabled` (Phase 2, seeded for readiness — no code consumer yet), `subscription_enabled` (Phase 3+, seeded
  for readiness — no code consumer yet), `ai_scope_summary_enabled` (Phase 3+ optional, seeded for readiness — no code
  consumer yet), `promoted_listings_enabled` (Phase 2, gated in task feed sort and QPay purchase flow),
  `b2b_enabled` (Phase 2+, gated in business account CRUD and B2B task tagging)

### 4.2 Data Flow Patterns

1. **Structured Task Intake & Posting Flow**:
    * Client loads active category schema (`intake_schema_json`, `intake_schema_version`).
    * Draft is created with bound schema version (`task_drafts`) and validated against that same version at submit.
    * Server generates deterministic scope summary from answers; if template rendering fails, server falls back to
      canonical key-value summary and logs failure.
    * `POST /tasks` writes `tasks` row with `intake_answers_json`, `intake_schema_version`, `scope_summary_source`.
2. **Task & Booking Flow** (Dual-status model):
    * `POST /tasks` → `tasks.status=OPEN`.
    * `POST /tasks/{id}/applications` → creates `task_applications`.
    * `POST /tasks/{id}/applications/{appId}/accept` → customer accepts Tasker + liability disclaimer; creates
      `bookings.status=ASSIGNED`; updates `tasks.status=ASSIGNED`.
    * In Phase 2+, booking confirmation/contact reveal requires successful lead-unlock debit (`LEAD_UNLOCK_ACCEPTED`)
      before customer phone reveal.
    * `POST /bookings/{id}/complete` → `bookings.status=COMPLETED`; `tasks.status=COMPLETED`.
    * **No-show adjudication path (REQ-BOOK-11)**:
        * Scheduler emits reminder at `confirmed_scheduled_at +10m` and writes `booking_timeline_events` (
          `NO_SHOW_REMINDER_SENT`).
        * Either party may call `POST /bookings/{id}/no-show/flag` at/after `+15m`.
        * Eligibility check uses canonical schedule (latest accepted in-app reschedule; otherwise booking confirmed
          time).
        * Request is rejected unless all are true: booking is `ASSIGNED`; no accepted future reschedule supersedes
          current
          schedule; no status/check-in events from either party in trailing 30 minutes.
        * On success, one DB transaction updates `bookings.status=NO_SHOW` and `tasks.status=NO_SHOW`, then appends
          immutable `booking_timeline_events` (`NO_SHOW_CONFIRMED`) plus `audit_events` with actor and rule snapshot.
        * Endpoint is idempotent: duplicate/retry requests for same booking return existing terminal state.
3. **Reschedule & Timer Authority Flow**:
    * Reschedule request/accept/decline/expiry writes to `booking_schedule_events`.
    * Canonical schedule timers (late-cancel/no-show) reference only latest accepted in-app schedule.
    * Chat-only schedule mentions do not mutate enforcement timers.
4. **Ranking, Repeat Booking, and Instant Match Flow**:
    * Applicant ranking uses category match, proximity, reliability score, completion rate, and review quality.
    * Repeat booking pre-fills a new task from a completed booking in the same category.
    * Phase 3+ instant match uses `instant_match_offers` with 5-minute offer window and fallback to application flow
      after 3 declines/timeouts.
5. **Monetization Flow** *(Phased by PRD)*:
    * Phase 0-1: direct settlement only (`DIRECT`), no platform fee transactions.
    * Phase 2: credit pack purchase via QPay; selected Tasker lead unlock consumes credits before customer contact
      reveal.
    * Phase 2 lead-unlock pricing resolves from `lead_unlock_prices` by category/district/effective window.
    * Signup bonus credits are granted once per tasker via idempotent transaction key.
    * Phase 3+: escrow payment initiation/callback, wallet crediting, and payout processing are feature-toggled.
6. **No-Applicant Rescue Flow**:
    * If a task has zero eligible applicants for 120 minutes during 08:00-22:00 local time, enqueue rescue actions.
    * Rescue actions include: budget/schedule adjustment prompt, broadened push fanout, and concierge queue placement.
    * Persist trigger and executed actions in `task_rescue_events`.
7. **Messaging Flow** (WebSocket + REST fallback):
    * Conversation is created when Tasker applies to a task.
    * Real-time delivery via Spring WebSocket + STOMP.
    * WebSocket: `SUBSCRIBE /topic/conversations/{id}`, `SEND /app/conversations/{id}/messages`.
    * REST fallback: `POST /conversations/{id}/messages`.
    * Message scanning flags phone-sharing patterns for advisory/admin workflows; `content_hash` supports tamper-evident
      dispute investigation.
8. **Identity, Consent, and Outage Posture Flow**:
    * Phase 0-1: Facebook OAuth primary login; Phase 2+ OTP primary with migration of existing users.
    * During OAuth outage, new login/signup fails closed, while existing valid sessions continue until expiry.
    * Identity upload is blocked until consent is captured (`consent_policy_version`, timestamp).
    * Outage state is surfaced to clients and audit/ops events are emitted.
9. **Reviews, Disputes, and Enforcement Flow**:
    * Booking completion triggers bilateral review prompt + reminders at 24h and 72h.
    * Hard lock is created only for configured risk cases and stored in `review_enforcement_cases`.
    * Dispute creation requires at least one evidence artifact, or enters 24-hour evidence grace before auto-close.
    * Tasker cancellation/no-show incidents are rolled into strike review and reliability-score recomputation.
    * Pro badge assignment is auto-evaluated from completion/rating thresholds and stored in `tasker_badges`.
10. **Category Lifecycle & Referral Flow**:
    * Category deactivation blocks new drafts and new tasks while preserving lifecycle for existing tasks.
    * Phase 2+ referral attribution is persisted at signup and finalized on first completed booking conversion.
    * Monthly referral reward caps and threshold breaches emit manual-review alerts.
    * Referral rewards are phase-aware and persisted in `referral_rewards`.
11. **Payout and Legal-Guard Flow**:
    * Payout processing enforces Tuesday/Friday execution window in platform timezone.
    * System tracks cumulative tasker engagement duration and emits legal-review alerts before 2-year threshold.

---

## 5. API Design Guidelines

### 5.1 Standards

* **Protocol**: REST over HTTP/2.
* **Format**: JSON.
* **Spec**: OpenAPI 3.0.3 (Source of Truth).
* **Versioning**: URI Versioning (`/api/v1/...`).
* **Breaking-change policy**: Contract-breaking API updates require version bump and migration notes in the same
  release.

### 5.2 Error Handling

Standardized error response:

```json
{
  "code": "TASK_ALREADY_BOOKED",
  "message": "This task has already been assigned to another tasker.",
  "trace_id": "abc-123"
}
```

### 5.3 Security

* **Authentication**: `Authorization: Bearer <JWT>` header.
* **Authorization**:
    * **Banned User Check**: Security Filter MUST check `users.status` in DB (or Redis cache) on *every* request. Banned
      users must be rejected immediately, even if JWT is valid.
  * **Contact/Address Reveal Rules**:
      * Tasker phone is never exposed to customers in API responses.
      * Customer phone is masked until selected Tasker completes lead unlock in paid phases.
      * Exact task address is hidden pre-confirmation (and pre-payment commitment in escrow phases).
      * **Phase 0-1 current behavior**: `GET /tasks/{id}` reveals `location_text` (exact address) to any tasker
        whose booking is in `ASSIGNED`, `PAID`, or `COMPLETED` status. No payment gate exists because Phase 0-1
        uses direct settlement only.
      * **Phase 2 activation gap**: When `lead_fee_enabled` is turned on, `TaskController.getTask()` must be updated
        to gate address reveal behind a successful lead-unlock event. This is a required Phase 2 activation work item.
  * **OAuth Outage Posture (Phase 0-1)**: Login/signup endpoints fail closed when OAuth provider is down; existing
    already-issued valid tokens remain usable until expiry.
  * **Liability Disclaimer Contract**: applicant accept endpoint rejects requests without
    `liability_disclaimer_accepted=true`; accepted disclaimer is persisted on booking.
* **Rate Limiting**:
    * **OTP Endpoints**: Config-defined per phone and per request-source limits with lockout on repeated failed OTP
      verification attempts.
    * **General API**: Sliding window (1-minute window), DB-backed via `rate_limit_counters` table (`RateLimitFilter`). Defaults: 100 rpm authenticated, 30 rpm unauthenticated. Configurable per environment.
* **Data Privacy**:
    * **Gov IDs**: Stored in a strict **Private S3 Bucket**. API never exposes public links. Admin viewing uses
      short-lived Presigned GET URLs.
    * **Location**: Exact coords in DB. API exposes `approximate_lat/lng` only for `PublicTask`.
  * **Intake Answers**: Stored as structured JSON; retained/deleted per platform data retention policy and access is
    role-scoped.
* **Monetization Security (Phase 2+)**:
    * **Callbacks**: QPay Webhook MUST verify the HMAC signature using a server-side secret key.
    * **Idempotency**: Enforced on all financial endpoints when monetization is enabled.
* **AI Safety (Phase 0-2)**:
    * Runtime LLM is not on the task-posting critical path.
    * If optional async LLM summary polish is enabled in Phase 3+, deterministic summary remains source of truth on
      failures/timeouts.
* **Input Validation**: JSR-380 (Bean Validation) on all DTOs.

### 5.4 File Upload Pattern (Presigned URLs)

1. Client requests a presigned upload URL:
    * `POST /tasks/photos/upload-url` (task photos before task creation)
    * `POST /tasks/{id}/photos/upload-url` (task photos after task creation)
    * `POST /verification/upload-url` (ID verification images)
    * `POST /users/me/avatar/upload-url` (avatar)
2. Backend generates a presigned URL (S3/MinIO) and returns it with a `storage_key`.
    * *Security*: Backend MUST enforce `Content-Type` in the signed URL signature.
3. Client uploads file directly to S3/MinIO using the presigned URL.
4. Backend stores only the `storage_key` in the database.

### 5.5 Pagination Pattern (Cursor-Based)

All list endpoints use cursor-based pagination. Response envelope:

```json
{
  "data": [],
  "cursor": {
    "next": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

Query parameters: `cursor` (opaque string), `limit` (default 20, max 100).

### 5.6 Internationalization (i18n)

* **Development language**: All source code, comments, API field names, and log messages are in English.
* **Default locale**: Mongolian (`mn-MN`). The app ships with Mongolian as the default user-facing language.
* **String management**:
    * **Backend**: API error messages and notification templates use keyed message bundles (`messages_en.properties`,
      `messages_mn.properties`) resolved via Spring `MessageSource`.
    * **Web**: JSON translation files per locale (`en.json`, `mn.json`) loaded by `react-i18next`.
    * **Mobile**: Same JSON files bundled via `react-i18next` + Expo localization.
* **Translation workflow**: English is the source-of-truth locale. Mongolian strings are machine-translated from
  English, then reviewed before release. Translation files live under `src/main/resources/i18n/` (backend) and
  `locales/` (clients).
* **Database content**: User-generated content (task descriptions, reviews) is stored as-is. Admin-managed content (
  category names) has explicit `name` (English) and `name_mn` (Mongolian) columns.
* **API contract**: The API returns server-driven strings (error messages, notification text) localized based on the
  `Accept-Language` header. If the requested locale is unavailable, the server falls back to `mn`.

### 5.7 Task Intake and Booking Contracts

* **Category Intake Contract**:
    * `GET /categories` (or category detail) must expose `intake_enabled`, `intake_schema_version`, and active schema
      payload for task-posting clients.
* **Draft Contract**:
    * Draft create/update APIs must persist `intake_schema_version` bound at start.
    * Final task submit validates against bound schema version and rejects missing required answers with field-level
      error codes.
* **Summary Contract**:
    * Task submit pipeline performs deterministic scope summary generation.
    * On summary generation failure, server returns success with canonical fallback summary and logs failure event.
* **Booking Contract**:
    * Applicant acceptance endpoint requires `liability_disclaimer_accepted=true`.
    * In paid phases, booking confirmation/contact reveal must be gated by successful lead-unlock debit event.
    * Applicant list supports ranked ordering (`relevance_score`) while preserving customer free selection.
    * Selected-applicant confirmation timeout is phase-driven (15m in Phase 2, 5m for Phase 3 instant-match offers).
    * Repeat-booking endpoint must only allow rebook from completed bookings and same-category prefill.
    * No-show policy is deterministic: reminder at `+10m`, no-show flag eligibility at `+15m`, dual inactivity check on
      trailing 30 minutes, and accepted reschedule precedence over prior schedule.
    * Status transitions must enforce `OPEN -> ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW` for tasks and
      `ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW` for bookings.
* **Monetization Contract**:
    * Credit debits are valid only for `LEAD_UNLOCK_ACCEPTED` events.
    * Application cap defaults to 10 and is config-driven per category.
    * Price resolution for lead unlock must use active `lead_unlock_prices` row by category/district/effective time.
    * Signup bonus (5 credits) must be one-time per eligible tasker and enforced idempotently.
* **Dispute and Review Contract**:
    * Dispute creation from `ASSIGNED` or within 24h of `COMPLETED` requires at least one evidence artifact or enters
      24h grace before auto-close.
    * Review reminders follow immediate +24h +72h cadence; hard lock applies only for configured risk triggers.
    * Notification fallback events (`HIRED`, `BOOKING_CONFIRMED`) are idempotent via `notification_log.event_key`.
* **Trust Scoring Contract**:
    * Reliability score is recomputed on cancellation/no-show/completion signals and consumed by applicant ranking.
    * Pro badge assignment is deterministic from completion/rating thresholds and evaluated in background jobs.
* **Admin Contract**:
    * Admin user search supports exact normalized phone lookup plus name and Facebook ID criteria with cursor pagination.
    * Category management supports intake schema create/update/activate/version/rollback with audit logs.
    * Feature toggles (lead fee, subscription, escrow) must be runtime-switchable without redeploy and fully audited.

---

## 6. Non-Functional Requirements Implementation

### 6.1 Reliability

* **Idempotency**: Critical irreversible state-changing endpoints must accept an `Idempotency-Key` header.
    * Minimum MVP scope: application accept, booking cancel/complete, dispute creation/resolution.
  * Phase 2+ monetization scope: lead-unlock credit spending, payment initiation/callback handling, and payout
    processing.
* **Schema Safety (Structured Intake)**:
    * Category schema activation runs lint + preview validation before activation.
    * Rollout supports canary activation and instant rollback to last-known-good schema version.
    * Task drafts bind schema version at form start to prevent submit-time drift.
* **Offline Support**: Mobile app caches active "My Tasks" locally (AsyncStorage) for read-only viewing when offline.
  This is limited to previously fetched data; no offline mutations are supported in MVP.
* **Policy Guards**:
    * Enforce Tuesday/Friday payout processing window in platform timezone.
    * Enforce no-show and late-cancel timers against latest accepted in-app schedule only.

### 6.2 Observability

* **Logs**: Structured JSON logs with `trace_id` and `user_id`.
* **Metrics**: Prometheus endpoint exposing JVM, HikariCP, and HTTP latency metrics.
* **Product Events**:
    * Must emit: `task_intake_started`, `task_intake_completed`, `intake_schema_render_failed`,
      `intake_validation_failed`, `scope_summary_generation_failed_fallback`, `job_scope_summary_edited`,
      `task_posted`, `application_submitted`, `tasker_accepted`, `booking_confirmed`, `booking_completed`,
      `dispute_raised`, `review_prompted`, `review_reminder_sent`, `review_hard_lock_applied`,
      `lead_unlock_debited`, `lead_unlock_refunded`, `verification_submitted`, `verification_reviewed`,
      `referral_reward_applied`.
    * Intake-related events must include `category_id`, `intake_schema_version`, and `client_app_version`.
    * Funnel events must include `locale` and `platform` dimensions.
* **Product Metrics (Required)**:
    * Leakage indicators: phone-sharing flag rate, repeat contact-sharing attempts, booking-to-repost ratio.
    * Verification queue metrics: submissions/day, median approval time, SLA breach count.
    * Review completion rate by cohort (target > 85%).
    * Monetization adoption metrics by active phase: lead-unlock payment rate, subscription conversion, escrow opt-in.
    * Payment rail telemetry (Phase 4): per-rail checkout success/failure for QPay, SocialPay, and bank transfer.
    * Referral fraud signals: monthly successful referrals per user and cap-breach attempts.
    * Matching quality metrics: instant-match timeout/decline fallback rate and rescue-trigger rate by
      category/district.
* **Operational Alerts**:
    * Alert on scope-clarity regression when median pre-booking clarification messages per `ASSIGNED` booking exceeds
      2.0 for two consecutive weeks.
    * Alert on verification SLA breaches and OAuth outage active windows.
    * Monitor review completion rate and leakage-signal ratio per trailing 28-day window.
    * Alert when open-task feed p95 latency breaches performance SLO budget.

### 6.3 Performance and Legal Compliance

* **Feed Performance Budget**:
    * Open-task feed should meet <1s median response under representative 4G client conditions.
    * Track backend API p95 and end-to-end client render timing separately.
* **Regulatory and Legal Controls**:
    * Identity and contact data handling must align with Mongolia Personal Information law and documented retention
      policy.
    * Connector liability disclaimer text/version must be versioned and auditable.
    * Track cumulative tasker engagement duration and alert operations before 2-year continuous activity threshold.

---

## 7. Frontend Architecture

### 7.1 Implementation Rules

#### Web (`apps/web`)

* Framework: React + Vite + Tailwind CSS.
* **Primitives (Atoms):** Always use the Radix UI + Tailwind components in `apps/web/src/components/ui/`. Do not introduce Material UI, Chakra, or any other third-party UI framework.
* Styling pipeline: components use Tailwind utility classes pulling values from `@tasky/design-tokens`.
* State management: standard React hooks + Tailwind state variants (`hover:`, `focus:`, `disabled:`).
* Accessibility: visible focus states and minimum AA contrast on all touched flows.

#### Mobile (`apps/mobile`)

* Framework: React Native + Expo.
* **Primitives (Atoms):** Always build native component equivalents. Never import `shadcn/ui` into the mobile app.
* Styling pipeline: React Native `StyleSheet.create` or inline styles using constants from `@tasky/design-tokens`.
* If a component exists in `apps/web/src/components/ui/` (e.g., `Button`), a functionally and visually parallel
  component **must** exist in `apps/mobile/src/components/ui/`.

#### Building Composite Components

1. Check if required primitive Atoms (Button, Badge, Input, Label, Card) exist in `components/ui/`.
2. If not, create them first according to the platform rules above.
3. Assemble Molecules/Organisms exclusively from those Atoms using spacing/layout variables from `@tasky/design-tokens`.

### 7.2 UI Parity Baseline

| Primitive   | Web Source (`apps/web/src/components/ui`) | Mobile Source (`apps/mobile/src/components/ui`) | Required States                              | Notes                                     |
|-------------|-------------------------------------------|-------------------------------------------------|----------------------------------------------|-------------------------------------------|
| Button      | `button.tsx`                              | `Button.tsx`                                    | default, secondary, ghost, disabled, loading | Loading disables press on both platforms. |
| Input       | `input.tsx`                               | `Input.tsx`                                     | default, focus, invalid, disabled            | Invalid state uses danger border token.   |
| Form Field  | composition (`label` + input + message)   | `FormField.tsx`                                 | default, helper, error                       | Error message replaces helper text.       |
| Modal/Sheet | dialog/sheet pattern                      | `ModalSheet.tsx`                                | open, close, backdrop-dismiss                | Backdrop dismiss is enabled by default.   |
| Toast       | toast/badge pattern                       | `Toast.tsx`                                     | info, success, error                         | Alert role for accessibility semantics.   |

**Token contract:** All parity components consume tokens from `packages/design-tokens/tokens.ts` (typed source),
`packages/design-tokens/tokens.css` (web CSS variables), and `apps/mobile/src/design/tokenAdapter.ts` (mobile adapter).

**Validation:** `TID-TASK-070-WEB-*` validates web primitives and token usage. `TID-TASK-071-MOBILE-*` validates mobile
token adapter, component parity, and this table.

### 7.3 File Structure

```
apps/web/src/components/
  ui/       ← Radix UI + Tailwind primitive components (shadcn conventions)
  feature/  ← domain-specific components composed of UI primitives

apps/mobile/src/components/
  ui/       ← native atomic components matching web primitives
  feature/  ← domain-specific mobile components
```

### 7.4 Delivery Phases

#### Phase 1 — Web Design Foundation (TASK-070)

1. Establish and standardize Radix UI + Tailwind primitive components in `apps/web/src/components/ui/`.
2. Define token source of truth and wire to Tailwind/theme variables.
3. Implement at least one feature screen using primitives only.

Exit criteria: web primitives are reusable; no additional UI frameworks introduced; tests cover primitive usage and
token binding.

#### Phase 1.5 — i18n Foundation

1. Install `i18next` and `react-i18next` for web and mobile.
2. Define locale dictionaries (`en`, `mn`) loaded dynamically.
3. Integrate `i18next-browser-languagedetector` for web; `expo-localization` for mobile.

Exit criteria: `t("key")` translations work on both platforms; language switcher (EN/MN) is implemented; mobile defaults
to `mn`.

#### Phase 2 — Mobile Parity Base (TASK-071)

1. Add mobile token adapter consuming shared tokens.
2. Implement core component equivalents: Button, Input, FormField, Modal/Sheet, Toast.
3. Publish parity matrix (§7.2) with states and interaction rules.

Exit criteria: shared tokens used on mobile; state semantics match parity matrix; tests verify token + state behavior.

#### Phase 3 — Accessibility and Parity Gate (TASK-072)

1. Add web keyboard navigation checks for touched flows.
2. Add WCAG 2.1 AA contrast checks for touched flows.
3. Add cross-platform parity checks against token and state contracts.

Exit criteria: a11y checks pass in CI for affected web flows; parity checks pass for shared components; ticket AC
evidence includes `TID-*` test IDs.

### 7.5 Test Location and TID Naming

| Platform | Test type      | Location                                                                |
|----------|----------------|-------------------------------------------------------------------------|
| Web      | Unit/component | `apps/web/src/**/*.test.tsx` or `apps/web/tests/**/*.test.tsx` (Vitest) |
| Web      | E2E            | `apps/web/e2e/**/*.test.ts` (Playwright)                                |
| Mobile   | Unit/component | `apps/mobile/__tests__/**/*.test.tsx` (Jest)                            |

**Critical rule:** Every test block must include its `TID-*` identifier directly in the `it()` or `test()` description
string — bare, with no brackets or decorators. The self-verification script discovers AC coverage by scanning for this
string in test runner output.

```typescript
it('TID-TASK-080-WEB-AUTH-OAUTH-FLOW should allow user to continue with Facebook and redirect to feed', async () => {
    // test logic
});
```

### 7.6 Structured Intake Renderer Contract (MVP)

1. **Renderer Input Contract**:
    * Task-post UI loads `intake_schema_json` + `intake_schema_version` from category metadata.
    * Supported field primitives in Phase 0-2: single-select, multi-select, dropdown, yes/no toggle, numeric counter.
2. **Draft Binding Contract**:
    * Client binds draft to schema version on form start.
    * Submit endpoint validates answers against bound version, not latest activated version.
3. **Summary Contract**:
    * Deterministic template summary is generated before submit and prefilled into editable description.
    * On deterministic summary failure, fallback key-value summary is generated and posting continues.
4. **AI Optionality Contract** *(Phase 3+ only)*:
    * Async summary polish can run behind feature toggle.
    * Posting success cannot depend on LLM availability.
    * LLM output cannot mutate structured intake answers.

---

## 8. Development Workflow

1. **Pick up a task**: Run `scripts/task.sh next` and read the task file.
2. **Design**: Update `docs/API.yaml` first (contract-first).
3. **Generate**: Run `pnpm sdk:generate` to regenerate TypeScript SDK types from the contract.
4. **Implement**: Write controller implementations and JDBI repositories.
5. **Test**: Write tests for every "Done When" criterion. Run `./gradlew --no-daemon test`.
6. **Verify**: Run `./gradlew openApiValidate`, `pnpm -r typecheck`, `pnpm -r test`.
7. **Commit**: Commit code and tests together.
8. **PR + CI**: Push branch, open PR. CI runs backend tests, frontend checks, and security scans.
9. **Review + Merge**: Merge after human review and passing CI.

---

## 9. PRD Traceability (Implementability Gate)

This section is the architecture-to-PRD alignment checklist. A PRD requirement is considered architecturally covered
only when mapped to schema, flow, security/ops policy, and test strategy below.

| PRD Capability Area                                               | Architecture Coverage                                                                                                                  |
|-------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Phase 0-1 Facebook OAuth + outage posture                         | §4.1 `users` identity model, §4.2 identity/outage flow, §5.3 auth outage policy, §7.5 test rule                                        |
| Structured intake forms (Phase 0-2)                               | §4.1 `categories` + `category_schema_versions` + `task_drafts` + `tasks`, §4.2 intake flow, §6.1 schema safety, §7.6 renderer contract |
| Deterministic scope summary + fail-open                           | §4.1 `tasks.scope_summary_source`, §4.2 intake flow, §5.3 AI safety, §7.6 summary contract                                             |
| Task/Booking lifecycle with NO_SHOW                               | §4.1 `tasks.status`, `bookings.status`, `booking_timeline_events`; §4.2 task/booking flow                                              |
| Reschedule authority + timer integrity                            | §4.1 `booking_schedule_events`, §4.2 reschedule flow                                                                                   |
| Repeat booking + instant match fallback logic                     | §4.1 `instant_match_offers`, §4.2 ranking/repeat/instant-match flow, §5.7 booking contract                                             |
| No-applicant rescue flow                                          | §4.1 `task_rescue_events`, §4.2 rescue flow                                                                                            |
| Information controls (contact/address reveal)                     | §5.3 authorization reveal rules, §4.2 monetization/message flow                                                                        |
| Phase 0-1 direct settlement + legal disclaimer persistence        | §4.1 `bookings.settlement_mode` + disclaimer fields, §4.2 monetization flow, §5.3 liability contract                                   |
| Phase 2 lead-unlock pricing and debit policy                      | §4.1 `lead_unlock_prices`, `credit_transactions`, §5.7 monetization contract                                                           |
| Phase 3 subscription and escrow walleting                         | §4.1 wallet + subscription tables, §4.2 monetization flow, §6.1 idempotency                                                            |
| Phase 2 B2B Lite and Phase 4 alternate rails preparedness         | §4.1 `business_accounts`/`business_locations`/`business_members`, §4.2 monetization flow, §6.2 per-rail telemetry                      |
| Mandatory bilateral reviews                                       | §4.1 `booking_reviews` + `review_enforcement_cases`, §4.2 reviews/disputes flow                                                        |
| Reliability score and Pro badge automation                        | §4.1 `tasker_reliability_scores` + `tasker_badges`, §4.2 reviews/disputes flow, §5.7 trust scoring contract                            |
| Disputes with evidence                                            | §4.1 `disputes` + `dispute_evidence`, §6.1 idempotency scope                                                                           |
| Messaging default with tamper-evident retention                   | §4.1 `messages.content_hash`, §4.2 messaging flow                                                                                      |
| Notifications with SMS fallback idempotency                       | §4.1 `notification_log.event_key`, §5.7 dispute/review contract                                                                        |
| Verification and admin auditability                               | §4.1 `verifications`, `audit_events`, §6.2 operational alerts                                                                          |
| Admin operations (category lifecycle, feature toggles, concierge) | §4.1 `categories`/`category_schema_versions`/`feature_toggles`/`audit_events`, §4.2 rescue + category lifecycle flows                  |
| Category deactivation + existing-task continuity                  | §4.2 category lifecycle flow, §7.6 draft/submit contract                                                                               |
| Referral tracking, phase-aware rewards, and conversion            | §4.1 `referrals` + `referral_rewards`, §4.2 category/referral flow                                                                     |
| Referral fraud caps and ops review                                | §4.2 referral flow alerts, §6.2 fraud/threshold observability                                                                          |
| Frontend design system and cross-platform parity                  | §3.4 design-system governance, §7.1-§7.5 parity/file/test contracts                                                                    |
| NFR security/privacy + retention + consent                        | §4.1 verification consent fields, §5.3 privacy controls, §6.3 legal controls                                                           |
| NFR performance                                                   | §6.3 feed performance budget + §6.2 latency alerting                                                                                   |
| NFR localization/i18n                                             | §5.6 i18n contract                                                                                                                     |
| NFR API/versioning/pagination/error envelope                      | §5.1, §5.2, §5.5, §5.7                                                                                                                 |
| NFR reliability + offline cache                                   | §6.1 idempotency/policy guards/offline support                                                                                         |
| MVP observability and scope-clarity gate                          | §6.2 product events + required dimensions + alerts                                                                                     |

**Gate rule:** Any PRD delta touching Section 7 functional requirements must update this section and the corresponding
schema/flow/security blocks in the same PR.
