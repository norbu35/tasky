# Phase 0-1 Launch Completion — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Goal:** Get Tasky backend production-ready for Phase 0-1 controlled pilot with zero monetization.

---

## 1. Context

A deep gap analysis of the Tasky backend against PRD v1.3, Architecture spec, and API.yaml revealed that the database schema is ~60% complete for Phase 0-1 and several core features are unimplemented. The product's core differentiator — structured intake forms — has no backend implementation. Multiple existing tables have column mismatches or wrong enum values.

The founder operates as concierge backstop for the first ~30 bookings (10h/week ops budget), which means certain automation (NO_SHOW adjudication, review enforcement, rescue flow) can be deferred to post-launch fast-follow while the core booking flow is made solid.

## 2. Scope

### In Scope (ship before first user)

1. Fix all DB schema mismatches blocking the core task → apply → accept → complete → review flow (including bookings table missing columns)
2. Implement structured intake system (task drafts, category schema versioning, scope summary generation)
3. Add `feature_toggles` table and admin management endpoints
4. Fix review schema to granular 5-category ratings
5. Fix application status enum to documented lifecycle (APPLIED/SELECTED/ACCEPTED/DECLINED/EXPIRED)
6. Fix conversations schema (customer_id/tasker_id instead of generic participants)
7. Add message content_hash and phone_number_flagged columns
8. Add consent tracking for verification uploads
9. Rename and restructure audit_log → audit_events
10. Fix Pro Badge threshold (6 → 15 completed tasks)
11. Add notification_log idempotency columns (event_key, provider_message_id, error_code)
12. Add missing columns to users (primary_auth), verifications (consent fields, dan_reference), tasks (intake columns)
13. Fix dispute schema (raised_by, wrongful_party_user_id, resolution_action enum alignment)

### Out of Scope (deferred — see Section 7)

- NO_SHOW status and adjudication flow
- Reschedule request/accept/decline flow
- Booking timeline events audit trail
- Review enforcement soft/hard gates
- Dispute evidence upload and 24h auto-close
- No-applicant rescue flow
- Repeat booking shortcut
- Task rescue events persistence
- Reliability score computation
- Phone number leak detection in messages
- Actual FCM/APNs push notification integration
- Actual SMS sending integration
- Facebook OAuth circuit breaker / outage posture
- Identity data lifecycle / deletion
- Verification access audit logging
- Tasker badges table

## 3. Execution Strategy

**Migration-first, then parallel features.** Fix the database foundation in one batch, align all DAOs/DTOs, then build features on correct ground in parallel streams.

### Layer 1: Database Migration (V10)

A single Flyway migration that fixes the entire foundation. Since this is pre-production with no live data, the migration can use destructive operations (DROP + recreate) where needed.

#### Schema Fixes (existing tables)

| # | Table | Change |
|---|---|---|
| 1 | `users` | Add `primary_auth TEXT NOT NULL DEFAULT 'FACEBOOK'`, `updated_at TIMESTAMPTZ DEFAULT now()` |
| 2 | `verifications` | Add `consent_policy_version TEXT`, `consent_accepted_at TIMESTAMPTZ`, `dan_reference TEXT` |
| 3 | `tasks` | Add `intake_answers_json JSONB`, `intake_schema_version INT`, `scope_summary_source TEXT CHECK (scope_summary_source IN ('TEMPLATE', 'USER_EDITED', 'LLM'))` |
| 4 | `categories` | Add `intake_enabled BOOLEAN NOT NULL DEFAULT true`, `intake_schema_version INT`, `intake_schema_json JSONB`, `last_known_good_schema_version INT` |
| 5 | `task_applications` | Replace status CHECK to `(APPLIED, SELECTED, ACCEPTED, DECLINED, EXPIRED)`. Add `relevance_score DOUBLE PRECISION`, `recommended BOOLEAN`, `selected_at TIMESTAMPTZ`, `respond_by_at TIMESTAMPTZ` |
| 6 | `reviews` | Rename to `booking_reviews`. Replace `rating INT` with `quality_rating INT CHECK (1-5)`, `punctuality_rating INT CHECK (1-5)`, `communication_rating INT CHECK (1-5)`, `clarity_rating INT CHECK (1-5)`, `respectfulness_rating INT CHECK (1-5)`. Rename `author_id` → `reviewer_id`, `target_user_id` → `reviewee_id` |
| 7 | `conversations` | Rename `participant1_id` → `customer_id`, `participant2_id` → `tasker_id`. Update unique constraint. |
| 8 | `messages` | Add `phone_number_flagged BOOLEAN NOT NULL DEFAULT false`, `content_hash TEXT` |
| 9 | `notification_log` | Add `event_key TEXT`, `provider_message_id TEXT`, `error_code TEXT` |
| 10 | `disputes` | Rename `raiser_id` → `raised_by`. Add `wrongful_party_user_id UUID REFERENCES users(id)`. Drop `outcome` column (consolidate into `resolution_action`). Add `resolution_action TEXT CHECK (resolution_action IN ('RESOLVE_CUSTOMER', 'RESOLVE_TASKER', 'ESCALATE', 'REFUND', 'RELEASE'))`. Update status CHECK to `(OPEN, RESOLVED, CLOSED_INSUFFICIENT_EVIDENCE)`. Drop `resolved_by` column (use `audit_events` for actor tracking instead). |
| 11 | `audit_log` | Rename to `audit_events`. Restructure columns: `actor_user_id UUID`, `action TEXT`, `resource_type TEXT`, `resource_id UUID`, `metadata_json JSONB`, `created_at TIMESTAMPTZ` |
| 12 | `tasker_strikes` | Add `booking_id UUID REFERENCES bookings(id)` |
| 13 | `bookings` | Add `confirmed_scheduled_at TIMESTAMPTZ`, `settlement_mode TEXT NOT NULL DEFAULT 'DIRECT' CHECK (settlement_mode IN ('DIRECT', 'LEAD_UNLOCK', 'ESCROW'))`, `late_cancel_incident BOOLEAN NOT NULL DEFAULT false`, `liability_disclaimer_accepted_at TIMESTAMPTZ` |
| 14 | `tasks` | Update status CHECK to include `NO_SHOW`: `(OPEN, ASSIGNED, COMPLETED, CANCELLED, NO_SHOW)` (logic deferred, constraint added now to avoid future migration) |
| 15 | `bookings` | Update status CHECK: remove legacy `PAID`, add `NO_SHOW`: `(ASSIGNED, COMPLETED, CANCELLED, NO_SHOW)` |

#### New Tables

| # | Table | Columns |
|---|---|---|
| 16 | `task_drafts` | `id UUID PK`, `customer_id UUID FK→users`, `category_id UUID FK→categories`, `intake_answers_json JSONB`, `intake_schema_version INT NOT NULL`, `summary_draft TEXT`, `created_at TIMESTAMPTZ`, `expires_at TIMESTAMPTZ` |
| 17 | `category_schema_versions` | `id UUID PK`, `category_id UUID FK→categories`, `version INT NOT NULL`, `schema_json JSONB NOT NULL`, `status TEXT CHECK (DRAFT, CANARY, ACTIVE, ROLLED_BACK)`, `is_last_known_good BOOLEAN DEFAULT false`, `created_by UUID`, `created_at TIMESTAMPTZ`, `activated_at TIMESTAMPTZ`. Unique on `(category_id, version)` |
| 18 | `feature_toggles` | `id UUID PK`, `feature_name TEXT UNIQUE NOT NULL`, `is_enabled BOOLEAN NOT NULL DEFAULT false`, `activated_at TIMESTAMPTZ`, `deactivated_at TIMESTAMPTZ`, `updated_by UUID`, `updated_at TIMESTAMPTZ DEFAULT now()` |

#### Seed Data

- Feature toggles: `lead_fee_enabled=false`, `subscription_enabled=false`, `escrow_enabled=false`, `ai_scope_summary_enabled=false`
- Intake schemas for 3 launch categories (Cleaning, Handyman, Moving) per PRD Appendix §14.2.4 (Intake Schema Baseline Examples)

### Layer 2: Code Changes (4 Parallel Streams)

#### Stream A: DAO/DTO Alignment (prerequisite for all other streams)

Update all DAOs and DTOs to match the new schema. Mechanical but foundational.

1. Update `UserDao` / `AuthUser` — add `primaryAuth` and `updatedAt` fields
2. Update `VerificationDao` / `VerificationDetail` — add consent fields, `danReference`
3. Update `TaskDao` / `TaskState` / `CreateTask` — add intake columns, `scopeSummarySource`
4. Update `CategoryDao` / `CategoryState` — add intake columns
5. Update `TaskApplicationDao` / `TaskApplicationState` — new status enum values, relevance/recommended fields
6. Replace `ReviewDao` / `Review` / `ReviewRequest` — table name `booking_reviews`, 5-category ratings, renamed columns
7. Update `ConversationDao` / `Conversation` — `customerId` / `taskerId`
8. Update `MessageDao` / `Message` — `phoneNumberFlagged`, `contentHash`
9. Update `NotificationLogDao` / `NotificationLog` — `eventKey`, `providerMessageId`, `errorCode`
10. Update `DisputeDao` / `Dispute` — `raisedBy`, `wrongfulPartyUserId`, `resolutionAction` enum
11. Rename `AuditLogDao` → `AuditEventDao` with new column structure; update all callers
12. Update `StrikeDao` — add `bookingId` field
13. Update `BookingDao` / `BookingState` — add `confirmedScheduledAt`, `settlementMode`, `lateCancelIncident`, `liabilityDisclaimerAcceptedAt`
14. Create `TaskDraftDao` + `TaskDraft` DTO
15. Create `CategorySchemaVersionDao` + `CategorySchemaVersion` DTO
16. Create `FeatureToggleDao` + `FeatureToggle` DTO

#### Stream B: Structured Intake System

The product's core differentiator. New feature.

1. **`CategorySchemaVersionService`** — Create, activate, and rollback schema versions. Validate schema structure (3-5 fields, supported primitives: single_select, multi_select, dropdown, yes_no, numeric_counter). Canary activation support. Link category to active schema version on activation.
2. **`TaskDraftService`** — Create/update/delete drafts. Bind draft to `intake_schema_version` at creation. Validate category is active and intake-enabled. Enforce draft expiration.
3. **`ScopeSummaryGenerator`** — Deterministic template-based summary from intake answers keyed by schema field labels. On template failure, generate canonical key-value fallback summary and log failure event. Return summary text + source (TEMPLATE or fallback).
4. **Update `TaskService.createTask()`** — Validate `intake_answers` against bound schema version (check required fields, validate field types/options). Generate scope summary via `ScopeSummaryGenerator`. Persist `intake_answers_json`, `intake_schema_version`, `scope_summary_source` on task row. Reject tasks for inactive or intake-disabled categories.
5. **Update `TaskController`** — Add draft CRUD endpoints (`POST /tasks/drafts`, `GET /tasks/drafts/{id}`, `PUT /tasks/drafts/{id}`). Integrate intake validation into `POST /tasks`.
6. **Update `CategoryController` / admin endpoints** — Add schema version management (`GET /admin/categories/{id}/schemas`, `POST /admin/categories/{id}/schemas`, `POST /admin/categories/{id}/schemas/{version}/activate`).
7. **Seed intake schemas** for 3 launch categories using PRD §14.2.4 baseline examples (Cleaning: 4 fields, Moving: 4 fields, Handyman: 3 fields derived from Plumbing example adapted).

#### Stream C: Trust & Identity Fixes

1. **Update verification submit flow** — Require `consent_policy_version` and `consent_accepted=true` in `VerificationController.submitVerification()`. Persist `consent_policy_version` and `consent_accepted_at` on verification record. Reject submission if consent not provided.
2. **Fix Pro Badge threshold** — Change `AuthService.toProfile()` from `completedTasks >= 6` to `completedTasks >= 15`.
3. **Update `ReviewService`** — Accept 5 category ratings (quality, punctuality, communication, clarity, respectfulness). All 5 columns exist on the `booking_reviews` table, but **validation is role-specific per PRD REQ-SAFE-02**: Customer reviewing Tasker must provide quality + punctuality + communication (clarity and respectfulness stored as NULL). Tasker reviewing Customer must provide clarity + respectfulness + punctuality (quality and communication stored as NULL). Compute average from the provided ratings only (3-field average per direction). Update target user's `rating_avg` on profile.
4. **Update `ReviewController`** — New `ReviewRequest` DTO with 5 rating fields (each 1-5, **nullable**) + optional comment. Validation logic enforces role-specific required fields (3 per direction). New `Review` response DTO with all 5 ratings (some nullable). **Note:** This requires an API.yaml update to make the non-common rating fields nullable rather than required.
5. **Update `AuthService.updateUserStats()`** — Recalculate `rating_avg` from stored granular ratings across all reviews for the user.
6. **Add content_hash** in `MessagingService` — On message creation, compute SHA-256 of `(conversationId + senderId + content + timestamp)` and persist as `content_hash`.

#### Stream D: Infrastructure & Admin

1. **`FeatureToggleService`** — Read all toggles, read by name, update toggle (enable/disable). On update: set `activated_at` or `deactivated_at` timestamp, set `updated_by` to actor user ID, write audit event.
2. **`FeatureToggleController`** (admin) — `GET /admin/features/toggles` returns all toggles. `PUT /admin/features/toggles` updates a single toggle by feature_name.
3. **Update `DisputeService` / `DisputeController`** — Align field names with new schema (`raisedBy`, `wrongfulPartyUserId`, `resolutionAction`). Update dispute create/resolve logic to use corrected column names. Update `DisputeResponseMapper`.
4. **Refactor `AuditLogDao` → `AuditEventDao`** — New column structure (`actorUserId`, `action`, `resourceType`, `resourceId`, `metadataJson`). Update all callers (ban/unban in AuthService, verification approve/reject, dispute resolve, feature toggle changes).
5. **Migrate existing feature-gate checks** — Replace `@Value("${tasky.features.monetization-enabled}")` config reads with `featureToggleService.isEnabled("lead_fee_enabled")` (and similar) so toggles are runtime-switchable without redeploy.

### Stream Dependencies

```
Layer 1: Migration V10
    └── Stream A: DAO/DTO Alignment
            ├── Stream B: Structured Intake (independent)
            ├── Stream C: Trust & Identity (independent)
            └── Stream D: Infrastructure & Admin (independent)
```

Stream A must complete before B/C/D begin. Streams B, C, D have no dependencies on each other.

## 4. Test Strategy

Follow existing codebase patterns (Spring Boot integration tests with Testcontainers PostgreSQL).

### Stream A
- Update all existing integration tests that break due to renamed tables/columns. No new tests required.

### Stream B
- **Intake flow integration test:** Create draft → validate answers → generate summary → submit task with intake metadata → verify task persists intake_answers_json + intake_schema_version + scope_summary_source.
- **Summary fallback test:** Verify that when template rendering fails, fallback key-value summary is generated and task creation still succeeds.
- **Schema version binding test:** Create draft with version N, activate version N+1, submit task — verify validation uses version N (the bound version).
- **Schema validation test:** Verify rejection of tasks missing required intake answers with field-level error codes.

### Stream C
- Update `ReviewIntegrationTests` for 5-category ratings. Test that single-rating submissions are rejected. Test that Pro badge triggers at 15 completed tasks (not before).
- Test consent rejection: verification submit without `consent_accepted=true` returns 400.

### Stream D
- Feature toggle CRUD integration test: create, read, update, verify audit event is written.
- Test that monetization endpoints still return 503 when toggle is disabled (existing behavior, new backing store).

## 5. Production Readiness Checklist

Before first real user:

- [ ] V10 migration runs cleanly on fresh database
- [ ] V10 migration runs cleanly on existing dev database (data preservation where possible)
- [ ] 3 seed category intake schemas deployed and validated
- [ ] Feature toggles seeded (all monetization = false)
- [ ] Full existing test suite green after all changes
- [ ] New intake flow tests green
- [ ] Review rating tests green with 5-category schema
- [ ] Feature toggle tests green
- [ ] Docker Compose local dev environment works end-to-end
- [ ] Admin can: create/approve verification, manage categories + schemas, resolve disputes, toggle features
- [ ] Core flow manual walkthrough: post task with intake → tasker applies → customer accepts → booking completes → both submit granular reviews

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| V10 migration breaks existing dev data | Medium | Pre-production, no real users. Migration can be destructive. Back up dev DB before running. |
| Renamed tables break DAO mappings silently | High | Stream A updates all DAOs before features. Full test suite run after Stream A validates alignment. |
| Intake schema validation too strict for launch | Medium | Start with lenient validation (required field presence only). Tighten post-launch with real category data. |
| Feature toggle DB reads add latency | Low | Toggle values change rarely. Add in-memory cache with short TTL (60s) if needed post-launch. |
| Renamed audit_log breaks existing audit queries | Low | No external consumers yet. Internal-only table. |
| `users.status` has ACTIVE not in Architecture spec | Low | Retain ACTIVE in CHECK for now — existing code depends on it. Document as tech debt for post-launch cleanup. |
| Concierge dispatch endpoint may not exist | Low | Verify `AdminModerationController` or `TaskController` has manual assign. If missing, add minimal endpoint in Stream D. REQ-ADMIN-07 requires this for Phase 0-1. |

## 7. Deferred Items Roadmap

Every item below is deferred from this launch. Each has a trigger condition (not a calendar date) for when it should be built.

### Tier 1 — Fast-Follow Week 1-2

Build as soon as live traffic reveals the need. Founder manually handles these cases until then.

| Item | PRD Requirement | Trigger |
|---|---|---|
| NO_SHOW status + adjudication | REQ-BOOK-11, REQ-TASK-02 | First reported no-show incident |
| Dispute evidence upload + 24h auto-close | REQ-SAFE-10 | First dispute where chat logs are insufficient |
| Review enforcement soft gates (reminders) | REQ-SAFE-02, REQ-SAFE-11 | Review completion rate drops below 70% |

### Tier 2 — Fast-Follow Week 3-4

Build once core flow is stable and founder ops patterns are established.

| Item | PRD Requirement | Trigger |
|---|---|---|
| Reschedule request/accept/decline flow | REQ-BOOK-12, REQ-BOOK-13 | First customer-reported scheduling conflict |
| Booking timeline events (immutable audit) | REQ-BOOK-13 | Needed alongside reschedule flow |
| No-applicant rescue flow (120min detection) | REQ-BOOK-09 | >3 tasks with zero applicants in a week |
| Phone leak detection in messages | REQ-LEAK-04 | Baseline leakage rate measurement begins |
| Repeat booking shortcut | REQ-BOOK-07 | First repeat customer (30-day cohort data) |

### Tier 3 — Pre-Phase-2

Build before Phase 2 monetization gate (200+ completed bookings, 40% repeat customer rate).

| Item | PRD Requirement | Trigger |
|---|---|---|
| Reliability score computation | REQ-SAFE-06 | Needed for Phase 2 algorithm-assisted ranking |
| Tasker badges table (persistent Pro badge) | REQ-SAFE-04 | >15 taskers eligible for Pro badge |
| Facebook OAuth circuit breaker | REQ-AUTH-09, REQ-AUTH-10 | First Facebook outage incident |
| Verification access audit logging | REQ-SAFE-08 | Before first compliance review |
| Identity data lifecycle / deletion | REQ-SAFE-09 | Before first user deletion request or compliance review |
| Actual FCM/APNs push integration | REQ-NOTIF-01 | Before scaling beyond founder's personal outreach |
| Actual SMS sending integration | REQ-NOTIF-02 | Phase 2 OTP requirement |
| Task rescue events persistence | REQ-BOOK-09 | Alongside rescue flow |
| Review enforcement hard locks | REQ-SAFE-02 | Review rate still below 85% after soft gates |
