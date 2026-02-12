# Architecture Specification: Tasky

## 1. Executive Summary
**System Type:** Modular Monolith
**Stack:** Java 21, Spring Boot 3, JDBI, PostgreSQL, React/React Native
**Key Constraint:** "Trust-First" (Graceful degradation)

This document defines the technical architecture for Tasky. It serves as the blueprint for implementation and ensures all engineering efforts align with the `AGENTS.md` doctrine and `PRD.md` requirements.

---

## 2. System Context & Boundaries

### 2.1 High-Level Context
Tasky acts as a trusted intermediary between **Customers** (Demand) and **Taskers** (Supply).
*   **External Systems**:
    *   **QPay**: Payment collection (Customer -> Tasky).
    *   **SMS Gateway**: OTP delivery.
    *   **Google Maps / Mapbox**: Geocoding and static maps.
    *   **Push Provider (FCM/Expo)**: Mobile notifications.

### 2.2 Modular Monolith Structure
The backend is a single deployable unit (`tasky-server`) organized by business domains. Cross-domain communication occurs via internal service interfaces (Java method calls), not network calls, to preserve simplicity.

**Modules:**
1.  **`identity`**: Auth, User Profiles, KYC/Verification.
2.  **`marketplace`**: Task Posting, Search, Booking State Machine.
3.  **`wallet`**: Internal Ledger, QPay Integration, Payouts.
4.  **`communication`**: Notifications (Push/SMS), In-app Messaging.
5.  **`support`**: Disputes, Moderation, Admin Tools.

---

## 3. Technology Decisions

### 3.1 Backend Stack
*   **Language**: Java 21 (LTS)
*   **Framework**: Spring Boot 3.x
*   **Persistence**: **JDBI 3** (SQL Object API)
    *   *Rationale*: We prefer explicit SQL control over JPA magic for performance and predictability.
    *   *Migration*: Flyway
*   **Database**: PostgreSQL 16 + PostGIS (for geospatial queries)
*   **Auth**: Spring Security + JWT (Stateless)

### 3.2 Frontend Stack
*   **Web**: React 18, Vite, TailwindCSS, TanStack Query, `shadcn/ui` (built on Radix primitives).
*   **Mobile**: React Native (Expo), NativeWind, React Navigation, token-driven native component library (no direct `shadcn` runtime usage).
*   **API Client**: TypeScript SDK generated from OpenAPI.

### 3.3 Infrastructure Services (AWS & Containers)
*   **Containerization**: All services (App, DB, MinIO) must be defined in `docker-compose.yml` for local dev.
*   **File Storage**:
    *   **Local**: MinIO (S3 compatible) running in Docker.
    *   **Production**: AWS S3.
    *   **Pattern**: Clients request a "Presigned Upload URL" from the backend, then upload files directly to S3/MinIO. Backend stores the key/URL only.
    *   **Security**: Buckets must be private. Public access is blocked. Downloads for sensitive data (IDs) use Presigned GET URLs.
*   **Async Processing**:
    *   **Mechanism**: Spring `@Async` + `ApplicationEventPublisher` for decoupling.
    *   **Persistence**: For critical tasks (e.g., SMS, Payouts), use a simple Postgres-backed queue table (`job_queue`) to ensure at-least-once delivery if the app restarts.
*   **Geospatial**:
    *   **Engine**: PostGIS running in the Postgres container.
    *   **Indexing**: GiST index on `tasks.location_point` is mandatory.
    *   **Query**: Use `ST_DWithin` for radius searches (e.g., "Tasks within 5km").

### 3.4 Frontend Design System Architecture
*   **Component Source of Truth (Web)**:
    *   Base primitives are generated/managed via `shadcn/ui` in `apps/web/src/components/ui`.
    *   Product-level components are composed from those primitives in feature folders.
    *   Additional third-party UI frameworks (MUI, Ant, Chakra, etc.) are forbidden for web runtime components.
*   **Token Source of Truth (Cross-Platform)**:
    *   Canonical design tokens live in a shared package (recommended: `packages/design-tokens`).
    *   Web consumes tokens via Tailwind/theme variables.
    *   Mobile consumes the same tokens through a React Native adapter layer.
*   **Parity Contract (Web <-> Mobile)**:
    *   Each shared UX pattern (Button, Input, Select, Modal/Sheet, Toast, Form Field, Empty State) has a parity record defining states, spacing, typography, and interaction behavior.
    *   Mobile keeps native rendering patterns while matching token values and state semantics.
*   **Accessibility Baseline**:
    *   Web components must preserve Radix/shadcn accessibility defaults and satisfy keyboard navigation + WCAG AA contrast.

---

## 4. Data Architecture

### 4.1 Core Schema (ERD)

#### Identity Module
*   `users`: `id (UUID)`, `phone (UK)`, `role`, `status` (PENDING, VERIFIED, BANNED, SUSPENDED), `suspension_end_at`, `created_at`
*   `profiles`: `user_id (FK)`, `full_name`, `avatar_url`, `rating_avg`
*   `verifications`: `user_id (FK)`, `id_card_front`, `id_card_back`, `status`, `admin_notes`

#### Marketplace Module
*   `tasks`: `id`, `customer_id`, `category_id (FK)`, `description`, `budget`, `location_point (GEOMETRY)`, `location_text`, `status` (OPEN, ASSIGNED, COMPLETED, CANCELLED), `scheduled_at`
*   `task_photos`: `id`, `task_id (FK)`, `storage_key`, `sort_order`
*   `categories`: `id`, `name`, `name_mn`, `icon_url`, `is_active`, `sort_order`
*   `task_applications`: `task_id`, `tasker_id`, `status`, `created_at`
*   `bookings`: `id`, `task_id`, `tasker_id`, `status` (PENDING_PAYMENT, PAID, COMPLETED, CANCELLED), `price`, `payment_provider_id` (Indexed)

#### Wallet Module
*   `wallets`: `user_id (PK)`, `balance_mnt`, `updated_at`
*   `ledger_entries`: `id`, `wallet_id`, `amount`, `type` (DEPOSIT, FEE, PAYOUT, REFUND), `reference_id`, `created_at`
*   `payout_requests`: `id`, `user_id`, `amount`, `bank_account`, `status`

#### Communication Module
*   `conversations`: `id`, `task_id (FK)`, `customer_id (FK)`, `tasker_id (FK)`, `created_at`
*   `messages`: `id`, `conversation_id (FK)`, `sender_id (FK)`, `content`, `created_at`
*   `device_tokens`: `user_id (FK)`, `token`, `platform` (IOS, ANDROID, WEB), `created_at`
*   `notification_log`: `id`, `user_id`, `type`, `channel` (PUSH, SMS), `status`, `created_at`

#### Support Module
*   `disputes`: `id`, `booking_id (FK)`, `raised_by (FK)`, `reason`, `status`, `resolution_notes`, `created_at`
*   `tasker_strikes`: `id`, `user_id (FK)`, `booking_id (FK)`, `reason`, `created_at`

#### Infrastructure Tables
*   `job_queue`: `id`, `type`, `payload (JSONB)`, `status`, `attempts`, `next_run_at`, `created_at`

### 4.2 Data Flow Patterns
1.  **Task & Booking Flow** (Dual-status model):
    *   `POST /tasks` → Writes to `tasks` table (Status: OPEN).
    *   `POST /tasks/{id}/applications` → Tasker applies, creates `task_applications` record.
    *   `POST /tasks/{id}/applications/{appId}/accept` → Customer accepts Tasker, creates `bookings` record (Status: PENDING_PAYMENT).
    *   `POST /payments/bookings/{id}/initiate` → Generates QPay payment link/QR.
    *   `POST /payments/qpay/callback` → Updates `bookings` (Status: PAID), updates `tasks` (Status: ASSIGNED), creates `ledger_entries` (Deposit).
    *   `POST /bookings/{id}/complete` → Updates `bookings` (Status: COMPLETED), updates `tasks` (Status: COMPLETED), credits Tasker wallet minus platform fee.
2.  **Payout Flow** (Processed on Tuesdays and Fridays):
    *   **Settlement Rule**: Funds from a `COMPLETED` job are only available for payout 24 hours after completion (to allow for the Dispute window).
    *   **Calculation**: `Available Balance = SUM(Credits older than 24h) - SUM(Pending Payouts)`.
    *   Tasker requests payout → Creates `payout_requests`.
    *   Admin processes on next Tue/Fri → Updates `payout_requests` → Creates `ledger_entries` (Payout) → Decrements `wallets`.

3.  **Messaging Flow** (WebSocket + REST fallback):
    *   Conversation created when Tasker applies to a task.
    *   Real-time delivery via Spring WebSocket + STOMP protocol.
    *   WebSocket: `SUBSCRIBE /topic/conversations/{id}`, `SEND /app/conversations/{id}/messages`.
    *   REST fallback: `POST /conversations/{id}/messages` for clients that cannot maintain WebSocket.
    *   Messages persisted to `messages` table on send.
4.  **Identity Role Transition Flow**:
    *   User authenticates via OTP and starts as `CUSTOMER`.
    *   User requests Tasker role via `POST /users/me/role/tasker`.
    *   System updates role to `TASKER` while verification status remains pending until admin decision.

---

## 5. API Design Guidelines

### 5.1 Standards
*   **Protocol**: REST over HTTP/2.
*   **Format**: JSON.
*   **Spec**: OpenAPI 3.0.3 (Source of Truth).
*   **Versioning**: URI Versioning (`/api/v1/...`).

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
*   **Authentication**: `Authorization: Bearer <JWT>` header.
*   **Authorization**:
    *   **Banned User Check**: Security Filter MUST check `users.status` in DB (or Redis cache) on *every* request. Banned users must be rejected immediately, even if JWT is valid.
*   **Rate Limiting**:
    *   **OTP Endpoints**: Strict limit (e.g., 3 requests / hour / IP) to prevent SMS pumping. **Brute Force**: Max 5 failed verification attempts per OTP; invalidate logic thereafter.
    *   **General API**: Token bucket (e.g., 100 req / min).
*   **Data Privacy**:
    *   **Gov IDs**: Stored in a strict **Private S3 Bucket**. API never exposes public links. Admin viewing uses short-lived Presigned GET URLs.
    *   **Location**: Exact coords in DB. API exposes `approximate_lat/lng` only for `PublicTask`.
*   **Payment Security**:
    *   **Callbacks**: QPay Webhook MUST verify the HMAC signature using a server-side secret key.
    *   **Idempotency**: Enforced on all financial endpoints.
*   **Input Validation**: JSR-380 (Bean Validation) on all DTOs.

### 5.4 File Upload Pattern (Presigned URLs)
1.  Client requests a presigned upload URL:
    *   `POST /tasks/photos/upload-url` (task photos before task creation)
    *   `POST /tasks/{id}/photos/upload-url` (task photos after task creation)
    *   `POST /verification/upload-url` (ID verification images)
    *   `POST /users/me/avatar/upload-url` (avatar)
2.  Backend generates a presigned URL (S3/MinIO) and returns it with a `storage_key`.
    *   *Security*: Backend MUST enforce `Content-Type` in the signed URL signature.
3.  Client uploads file directly to S3/MinIO using the presigned URL.
4.  Backend stores only the `storage_key` in the database.

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
*   **Development language**: All source code, comments, API field names, and log messages are in English.
*   **Default locale**: Mongolian (`mn-MN`). The app ships with Mongolian as the default user-facing language.
*   **String management**:
    *   **Backend**: API error messages and notification templates use keyed message bundles (`messages_en.properties`, `messages_mn.properties`) resolved via Spring `MessageSource`.
    *   **Web**: JSON translation files per locale (`en.json`, `mn.json`) loaded by `react-i18next`.
    *   **Mobile**: Same JSON files bundled via `react-i18next` + Expo localization.
*   **Translation workflow**: English is the source-of-truth locale. Mongolian strings are machine-translated from English, then reviewed before release. Translation files live under `src/main/resources/i18n/` (backend) and `locales/` (clients).
*   **Database content**: User-generated content (task descriptions, reviews) is stored as-is. Admin-managed content (category names) has explicit `name` (English) and `name_mn` (Mongolian) columns.
*   **API contract**: The API returns server-driven strings (error messages, notification text) localized based on the `Accept-Language` header. If the requested locale is unavailable, the server falls back to `mn`.

---

## 6. Non-Functional Requirements Implementation

### 6.1 Reliability
*   **Idempotency**: All payment endpoints and critical irreversible state-changing endpoints must accept an `Idempotency-Key` header.
    *   Minimum scope: payment initiation, payout requests, booking cancel/complete, dispute creation/resolution, and payout processing.
*   **Offline Support**: Mobile app caches active "My Tasks" locally (AsyncStorage) for read-only viewing when offline. This is limited to previously fetched data; no offline mutations are supported in MVP.

### 6.2 Observability
*   **Logs**: Structured JSON logs with `trace_id` and `user_id`.
*   **Metrics**: Prometheus endpoint exposing JVM, HikariCP, and HTTP latency metrics.

---

## 7. Development Workflow
1.  **Classify Risk**: Determine `low|medium|high` per `AGENTS.md` quality policy.
2.  **Design**: Update `API.yaml` (contract-first).
3.  **Generate**: Run `openapi-generator` to update DTOs and interfaces.
4.  **Implement**: Write controller implementations and JDBI repositories.
5.  **Test**: Add/Update required tests for the selected risk tier using `./gradlew --no-daemon` for Java checks.
6.  **Self-Verify**: Run `scripts/self-verify.sh` and produce `artifacts/self-verify.json`.
7.  **Work Log**: Ensure `docs/agent/WORK_LOG.md` receives the appended execution entry from `scripts/agent-log.sh`.
8.  **Commit**: Commit code, tests, and self-verification artifact together.
9.  **PR + CI**: CI re-runs self-verification and performs parity checks.
10. **Review + Merge**: Merge only after required approvals and passing gates.
