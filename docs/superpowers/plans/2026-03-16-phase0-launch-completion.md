# Phase 0-1 Launch Completion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Tasky backend to production-ready Phase 0-1 by fixing schema mismatches, implementing structured intake, and aligning trust/identity/infrastructure with the spec.

**Architecture:** Migration-first (one V10 Flyway migration fixes all schema gaps), then DAO/DTO alignment as prerequisite, then 3 parallel feature streams (Intake, Trust, Infrastructure). Pre-production with no live data — destructive migration operations are acceptable.

**Tech Stack:** Java 21, Spring Boot 3.4, JDBI 3, PostgreSQL 16 + PostGIS, Flyway, Testcontainers, JUnit 5

**Spec:** `docs/superpowers/specs/2026-03-16-phase0-launch-completion-design.md`

**Key Reference Docs:**
- `docs/PRD.md` — Product requirements (Phase 0-1 scope)
- `docs/ARCHITECTURE.md` — Data model (§4.1), API guidelines (§5), flows (§4.2)
- `docs/API.yaml` — OpenAPI contract (source of truth for endpoints/schemas)

---

## Chunk 1: Foundation (Migration + DAO/DTO Alignment)

### Task 1: Write V10 Flyway Migration

**Files:**
- Create: `src/main/resources/db/migration/V10__phase0_schema_alignment.sql`

This is the single most important task. Every subsequent task depends on this migration.

- [ ] **Step 1: Create the migration file**

Write the complete V10 migration SQL. This migration is pre-production safe — uses ALTER TABLE ADD COLUMN where possible, DROP + recreate for tables needing major restructuring (reviews, audit_log, disputes).

```sql
-- V10__phase0_schema_alignment.sql
-- Phase 0-1 schema alignment: fix mismatches, add missing columns, create new tables.
-- Pre-production migration — destructive operations used where simpler than ALTER chains.

-- ============================================================
-- 1. users: add primary_auth, updated_at
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_auth TEXT NOT NULL DEFAULT 'FACEBOOK';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 2. verifications: add consent + DAN fields
-- ============================================================
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS consent_policy_version TEXT;
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS dan_reference TEXT;

-- ============================================================
-- 3. tasks: add intake columns + update status CHECK for NO_SHOW
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS intake_answers_json JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS intake_schema_version INT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scope_summary_source TEXT;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));
ALTER TABLE tasks ADD CONSTRAINT tasks_scope_summary_source_check
    CHECK (scope_summary_source IS NULL OR scope_summary_source IN ('TEMPLATE', 'USER_EDITED', 'LLM'));

-- ============================================================
-- 4. categories: add intake columns
-- ============================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS intake_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS intake_schema_version INT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS intake_schema_json JSONB;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_known_good_schema_version INT;

-- ============================================================
-- 5. task_applications: replace status enum, add ranking columns
-- ============================================================
ALTER TABLE task_applications DROP CONSTRAINT IF EXISTS task_applications_status_check;
-- Migrate existing data BEFORE adding new constraint (old values would violate it)
UPDATE task_applications SET status = 'APPLIED' WHERE status = 'PENDING';
UPDATE task_applications SET status = 'DECLINED' WHERE status = 'REJECTED';
ALTER TABLE task_applications ADD CONSTRAINT task_applications_status_check
    CHECK (status IN ('APPLIED', 'SELECTED', 'ACCEPTED', 'DECLINED', 'EXPIRED'));
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS relevance_score DOUBLE PRECISION;
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS recommended BOOLEAN;
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS selected_at TIMESTAMPTZ;
ALTER TABLE task_applications ADD COLUMN IF NOT EXISTS respond_by_at TIMESTAMPTZ;

-- ============================================================
-- 6. reviews → booking_reviews: restructure with granular ratings
-- ============================================================
DROP TABLE IF EXISTS reviews;
CREATE TABLE booking_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings (id),
    reviewer_id UUID NOT NULL REFERENCES users (id),
    reviewee_id UUID NOT NULL REFERENCES users (id),
    quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    clarity_rating INT CHECK (clarity_rating BETWEEN 1 AND 5),
    respectfulness_rating INT CHECK (respectfulness_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (booking_id, reviewer_id)
);

-- ============================================================
-- 7. conversations: rename participant columns
-- ============================================================
ALTER TABLE conversations RENAME COLUMN participant1_id TO customer_id;
ALTER TABLE conversations RENAME COLUMN participant2_id TO tasker_id;
DROP INDEX IF EXISTS conversations_task_id_participant1_id_participant2_id_key;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_task_id_participant1_id_participant2_id_key;
ALTER TABLE conversations ADD CONSTRAINT conversations_task_customer_tasker_unique
    UNIQUE (task_id, customer_id, tasker_id);

-- ============================================================
-- 8. messages: add phone_number_flagged, content_hash
-- ============================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone_number_flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- ============================================================
-- 9. notification_log: add idempotency columns
-- ============================================================
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS event_key TEXT;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS error_code TEXT;

-- ============================================================
-- 10. disputes: restructure columns
-- ============================================================
ALTER TABLE disputes RENAME COLUMN raiser_id TO raised_by;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS wrongful_party_user_id UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_action TEXT;
-- Migrate existing data BEFORE adding new constraints (old values would violate them)
UPDATE disputes SET status = 'RESOLVED' WHERE status IN ('RESOLVED_TASKER', 'RESOLVED_CUSTOMER', 'ESCALATED');
UPDATE disputes SET resolution_action = outcome WHERE outcome IS NOT NULL;
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
ALTER TABLE disputes ADD CONSTRAINT disputes_status_check
    CHECK (status IN ('OPEN', 'RESOLVED', 'CLOSED_INSUFFICIENT_EVIDENCE'));
ALTER TABLE disputes ADD CONSTRAINT disputes_resolution_action_check
    CHECK (resolution_action IS NULL OR resolution_action IN ('RESOLVE_CUSTOMER', 'RESOLVE_TASKER', 'ESCALATE', 'REFUND', 'RELEASE'));
ALTER TABLE disputes DROP COLUMN IF EXISTS outcome;
ALTER TABLE disputes DROP COLUMN IF EXISTS resolved_by;
-- Note: resolution_notes already exists in V1 schema — no ADD needed

-- ============================================================
-- 11. audit_log → audit_events: full restructure
-- ============================================================
DROP TABLE IF EXISTS audit_log;
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_events_resource ON audit_events (resource_type, resource_id);
CREATE INDEX idx_audit_events_actor ON audit_events (actor_user_id, created_at DESC);

-- ============================================================
-- 12. tasker_strikes: add booking_id
-- ============================================================
ALTER TABLE tasker_strikes ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);

-- ============================================================
-- 13. bookings: add missing columns + update status CHECK
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_scheduled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS settlement_mode TEXT NOT NULL DEFAULT 'DIRECT';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS late_cancel_incident BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS liability_disclaimer_accepted_at TIMESTAMPTZ;
-- Migrate existing data BEFORE adding new constraint (PAID is removed)
UPDATE bookings SET status = 'ASSIGNED' WHERE status = 'PAID';
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('ASSIGNED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));
ALTER TABLE bookings ADD CONSTRAINT bookings_settlement_mode_check
    CHECK (settlement_mode IN ('DIRECT', 'LEAD_UNLOCK', 'ESCROW'));

-- ============================================================
-- 14. NEW TABLE: task_drafts
-- ============================================================
CREATE TABLE IF NOT EXISTS task_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users (id),
    category_id UUID NOT NULL REFERENCES categories (id),
    intake_answers_json JSONB,
    intake_schema_version INT NOT NULL,
    summary_draft TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);
CREATE INDEX idx_task_drafts_customer ON task_drafts (customer_id, created_at DESC);

-- ============================================================
-- 15. NEW TABLE: category_schema_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS category_schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories (id),
    version INT NOT NULL,
    schema_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CANARY', 'ACTIVE', 'ROLLED_BACK')),
    is_last_known_good BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at TIMESTAMPTZ,
    UNIQUE (category_id, version)
);
CREATE INDEX idx_category_schema_versions_active ON category_schema_versions (category_id, status)
    WHERE status = 'ACTIVE';

-- ============================================================
-- 16. NEW TABLE: feature_toggles
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_toggles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. SEED DATA: feature toggles
-- ============================================================
INSERT INTO feature_toggles (feature_name, is_enabled) VALUES
    ('lead_fee_enabled', false),
    ('subscription_enabled', false),
    ('escrow_enabled', false),
    ('ai_scope_summary_enabled', false)
ON CONFLICT (feature_name) DO NOTHING;
```

- [ ] **Step 2: Run the migration on a fresh database**

```bash
docker compose up -d db
./gradlew flywayMigrate --no-daemon
```

Expected: Migration V10 applies successfully. No errors.

- [ ] **Step 3: Verify schema**

Connect to the database and spot-check:
```bash
docker compose exec db psql -U tasky -d tasky -c "\dt" | grep -E "booking_reviews|audit_events|task_drafts|category_schema_versions|feature_toggles"
```

Expected: All 5 tables exist.

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/db/migration/V10__phase0_schema_alignment.sql
git commit -m "feat(db): V10 migration for Phase 0-1 schema alignment

Fixes 13 existing tables and creates 3 new tables (task_drafts,
category_schema_versions, feature_toggles). Seeds default feature
toggles. Adds NO_SHOW to task/booking status constraints.

Ticket: LAUNCH-001
Spec: Phase 0-1 launch completion
API: no API change (schema only)
Tests: migration validated on fresh DB
Risk: medium"
```

---

### Task 2: Stream A — Identity & Support DAO/DTO Alignment

**Files:**
- Modify: `src/main/java/mn/tasky/auth/dto/AuthUser.java`
- Modify: `src/main/java/mn/tasky/auth/dao/UserDao.java`
- Modify: `src/main/java/mn/tasky/auth/dto/VerificationDetail.java`
- Modify: `src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- Modify: `src/main/java/mn/tasky/auth/dao/StrikeDao.java`
- Modify: `src/main/java/mn/tasky/dispute/dto/Dispute.java`
- Modify: `src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- Modify: `src/main/java/mn/tasky/dispute/dto/DisputeRequest.java`
- Modify: `src/main/java/mn/tasky/dispute/dto/DisputeRaiseResult.java`
- Modify: `src/main/java/mn/tasky/dispute/dto/DisputeResolutionResult.java`
- Modify: `src/main/java/mn/tasky/dispute/api/DisputeResponseMapper.java`
- Modify: `src/main/java/mn/tasky/review/dto/Review.java`
- Modify: `src/main/java/mn/tasky/review/dto/ReviewRequest.java`
- Modify: `src/main/java/mn/tasky/review/dao/ReviewDao.java`
- Delete: `src/main/java/mn/tasky/auth/dao/AuditLogDao.java`
- Delete: `src/main/java/mn/tasky/auth/dto/AuditLogEntry.java`
- Create: `src/main/java/mn/tasky/common/audit/AuditEventDao.java`
- Create: `src/main/java/mn/tasky/common/audit/AuditEvent.java`

- [ ] **Step 1: Update AuthUser record**

Add `primaryAuth` and `updatedAt` fields to the `AuthUser` record. The record is at `src/main/java/mn/tasky/auth/dto/AuthUser.java`.

**IMPORTANT: The existing codebase uses `String` for all ID fields in DTOs, not `UUID`. All new/updated DTOs MUST maintain `String` types for IDs to match existing patterns. The DAOs use `UuidHelper` for String↔UUID bridging.**

Current: `(String id, String phone, String facebookId, String role, String status, Instant createdAt)`
New: `(String id, String phone, String facebookId, String primaryAuth, String role, String status, Instant createdAt, Instant updatedAt)`

- [ ] **Step 2: Update UserDao SQL queries**

Update `src/main/java/mn/tasky/auth/dao/UserDao.java`:
- Add `primary_auth` and `updated_at` to all SELECT column lists
- Update `insert` to include `primary_auth` with default `'FACEBOOK'`
- Update `insertWithFacebookId` similarly

- [ ] **Step 3: Update VerificationDetail DTO**

Add `consentPolicyVersion`, `consentAcceptedAt`, `danReference` to `src/main/java/mn/tasky/auth/dto/VerificationDetail.java`.

- [ ] **Step 4: Update VerificationDao**

Update `src/main/java/mn/tasky/auth/dao/VerificationDao.java`:
- Add consent columns to `insert` and SELECT queries
- Update `findById`, `findLatestByUserId`, `findPending` selects

- [ ] **Step 5: Update StrikeDao**

Add `booking_id` parameter to `insert()` and add to SELECT in `src/main/java/mn/tasky/auth/dao/StrikeDao.java`.

- [ ] **Step 6: Replace AuditLogDao with AuditEventDao**

Delete `src/main/java/mn/tasky/auth/dao/AuditLogDao.java` and `src/main/java/mn/tasky/auth/dto/AuditLogEntry.java`.

Create `src/main/java/mn/tasky/common/audit/AuditEventDao.java`:
```java
package mn.tasky.common.audit;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface AuditEventDao {
    @SqlUpdate("INSERT INTO audit_events (actor_user_id, action, resource_type, resource_id, metadata_json) "
            + "VALUES (CAST(:actorUserId AS uuid), :action, :resourceType, CAST(:resourceId AS uuid), CAST(:metadataJson AS jsonb))")
    void insert(
            @Bind("actorUserId") String actorUserId,
            @Bind("action") String action,
            @Bind("resourceType") String resourceType,
            @Bind("resourceId") String resourceId,
            @Bind("metadataJson") String metadataJson);
}
```

Create `src/main/java/mn/tasky/common/audit/AuditEvent.java`:
```java
package mn.tasky.common.audit;

import java.time.Instant;

public record AuditEvent(String id, String actorUserId, String action, String resourceType, String resourceId, String metadataJson, Instant createdAt) {}
```

- [ ] **Step 7: Update Dispute DTO and DAO**

Update `src/main/java/mn/tasky/dispute/dto/Dispute.java`:
Current: `(String id, String bookingId, String raiserId, String reason, String status, String outcome, String resolvedBy, String resolutionNotes, Instant createdAt, Instant resolvedAt)`
New: `(String id, String bookingId, String raisedBy, String reason, String status, String resolutionAction, String wrongfulPartyUserId, String resolutionNotes, Instant createdAt, Instant resolvedAt)`

Update `src/main/java/mn/tasky/dispute/dao/DisputeDao.java` — change all SQL column references from `raiser_id` → `raised_by`, drop `outcome` references, add `resolution_action`, `wrongful_party_user_id`, drop `resolved_by`.

Update `DisputeResponseMapper.java`, `DisputeRaiseResult.java`, `DisputeResolutionResult.java` to use new field names.

- [ ] **Step 8: Replace Review DTO and DAO**

Update `src/main/java/mn/tasky/review/dto/Review.java`:
```java
public record Review(String id, String bookingId, String reviewerId, String revieweeId,
        Integer qualityRating, Integer punctualityRating, Integer communicationRating,
        Integer clarityRating, Integer respectfulnessRating, String comment, Instant createdAt) {}
```

Update `src/main/java/mn/tasky/review/dto/ReviewRequest.java`:
```java
public record ReviewRequest(
        Integer qualityRating, Integer punctualityRating, Integer communicationRating,
        Integer clarityRating, Integer respectfulnessRating,
        @jakarta.validation.constraints.Size(max = 1000) String comment) {}
```

Update `src/main/java/mn/tasky/review/dao/ReviewDao.java` — change table name to `booking_reviews`, column names to `reviewer_id`/`reviewee_id`, insert/select all 5 rating columns. Method `existsByBookingIdAndAuthorId` → `existsByBookingIdAndReviewerId`.

- [ ] **Step 9: Update JdbiConfig — AuditEventDao only**

In `src/main/java/mn/tasky/common/config/JdbiConfig.java`:
- Remove `AuditLogDao` bean
- Add `AuditEventDao` bean: `jdbi.onDemand(AuditEventDao.class)`

**Do NOT add TaskDraftDao, CategorySchemaVersionDao, or FeatureToggleDao here — those classes don't exist yet. They are registered in Task 4 Step 6.**

- [ ] **Step 10: Update all AuditLogDao callers**

Search for `auditLogDao` across the codebase and replace with `auditEventDao` using the new method signature `(actorUserId, action, resourceType, resourceId, metadataJson)`. Key callers:
- `AuthService.java` (ban/unban)
- `AdminVerificationController.java` (approve/reject)
- `AdminDisputeController.java` (resolve)

- [ ] **Step 11: Compile check**

```bash
./gradlew compileJava --no-daemon 2>&1 | head -50
```

Expected: Compilation succeeds (or shows only errors from not-yet-updated callers in Streams B/C/D — those are acceptable at this stage).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor(dao): align identity and support DAOs with V10 schema

Update UserDao, VerificationDao, StrikeDao, DisputeDao, ReviewDao
to match V10 column changes. Replace AuditLogDao with AuditEventDao
in common.audit package. Review DTO now uses 5-category ratings.
Dispute DTO consolidates outcome into resolutionAction.

Ticket: LAUNCH-002
Spec: Phase 0-1 launch completion
API: no API change (DAO layer only)
Tests: compilation verified
Risk: medium"
```

---

### Task 3: Stream A — Marketplace & Communication DAO/DTO Alignment

**Files:**
- Modify: `src/main/java/mn/tasky/task/dto/TaskState.java`
- Modify: `src/main/java/mn/tasky/task/dto/CreateTask.java`
- Modify: `src/main/java/mn/tasky/task/dto/CreateTaskRequest.java`
- Modify: `src/main/java/mn/tasky/task/dao/TaskDao.java`
- Modify: `src/main/java/mn/tasky/task/dto/TaskApplicationState.java`
- Modify: `src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- Modify: `src/main/java/mn/tasky/category/dto/CategoryState.java`
- Modify: `src/main/java/mn/tasky/category/dao/CategoryDao.java`
- Modify: `src/main/java/mn/tasky/booking/dto/BookingState.java`
- Modify: `src/main/java/mn/tasky/booking/dao/BookingDao.java`
- Modify: `src/main/java/mn/tasky/messaging/dto/Conversation.java`
- Modify: `src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- Modify: `src/main/java/mn/tasky/messaging/dto/Message.java`
- Modify: `src/main/java/mn/tasky/messaging/dao/MessageDao.java`
- Modify: `src/main/java/mn/tasky/notification/dto/NotificationLog.java`
- Modify: `src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`

- [ ] **Step 1: Update TaskState and TaskDao**

Add to `TaskState.java`: `String intakeAnswersJson, Integer intakeSchemaVersion, String scopeSummarySource`

Update `TaskDao.java`: Add new columns to all INSERT and SELECT statements. Update `insert()` parameters to include intake fields.

Update `CreateTask.java` and `CreateTaskRequest.java`: Add `intakeAnswers (Map<String,Object>)`, `intakeSchemaVersion (Integer)`, `scopeSummary (String)`, `draftId (UUID)` fields.

- [ ] **Step 2: Update TaskApplicationState and TaskApplicationDao**

Add to `TaskApplicationState.java`: `Double relevanceScore, Boolean recommended, Instant selectedAt, Instant respondByAt`

Update `TaskApplicationDao.java`:
- Change status values in INSERT from `'PENDING'` to `'APPLIED'`
- Add new columns to SELECT queries
- Update `rejectOthers` to set status `'DECLINED'` instead of `'REJECTED'`
- Update `updateStatus` to accept new status values

- [ ] **Step 3: Update CategoryState and CategoryDao**

Add to `CategoryState.java`: `Boolean intakeEnabled, Integer intakeSchemaVersion, String intakeSchemaJson, Integer lastKnownGoodSchemaVersion`

Update `CategoryDao.java`: Add intake columns to all SELECT/INSERT/UPDATE queries.

- [ ] **Step 4: Update BookingState and BookingDao**

Add to `BookingState.java`: `Instant confirmedScheduledAt, String settlementMode, Boolean lateCancelIncident, Instant liabilityDisclaimerAcceptedAt`

Update `BookingDao.java`: Add new columns to INSERT (with defaults: `settlementMode='DIRECT'`, `lateCancelIncident=false`) and all SELECT queries.

- [ ] **Step 5: Update Conversation and ConversationDao**

Update `Conversation.java`: Rename `participant1Id` → `customerId`, `participant2Id` → `taskerId`.

Update `ConversationDao.java`: Change all SQL column references from `participant1_id/participant2_id` to `customer_id/tasker_id`. Update `findByTaskAndParticipants` method signature. Update `insert` column names.

- [ ] **Step 6: Update Message and MessageDao**

Add to `Message.java`: `Boolean phoneNumberFlagged, String contentHash`

Update `MessageDao.java`: Add `phone_number_flagged` and `content_hash` to INSERT and SELECT.

- [ ] **Step 7: Update NotificationLog and NotificationLogDao**

Add to `NotificationLog.java`: `String eventKey, String providerMessageId, String errorCode`

Update `NotificationLogDao.java`: Add new columns to INSERT and SELECT.

- [ ] **Step 8: Compile check**

```bash
./gradlew compileJava --no-daemon 2>&1 | head -50
```

Expected: Compilation succeeds or shows only errors from callers that pass old argument counts (to be fixed in service layer updates).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(dao): align marketplace and communication DAOs with V10 schema

Update TaskDao, TaskApplicationDao, CategoryDao, BookingDao,
ConversationDao, MessageDao, NotificationLogDao to match V10
column additions and renames. Application status now uses
APPLIED/SELECTED/ACCEPTED/DECLINED/EXPIRED enum.

Ticket: LAUNCH-003
Spec: Phase 0-1 launch completion
API: no API change (DAO layer only)
Tests: compilation verified
Risk: medium"
```

---

### Task 4: Stream A — New Table DAOs + JdbiConfig

**Files:**
- Create: `src/main/java/mn/tasky/task/dao/TaskDraftDao.java`
- Create: `src/main/java/mn/tasky/task/dto/TaskDraft.java`
- Create: `src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- Create: `src/main/java/mn/tasky/category/dto/CategorySchemaVersion.java`
- Create: `src/main/java/mn/tasky/common/feature/FeatureToggleDao.java`
- Create: `src/main/java/mn/tasky/common/feature/FeatureToggle.java`
- Modify: `src/main/java/mn/tasky/common/config/JdbiConfig.java`

- [ ] **Step 1: Create TaskDraft DTO**

```java
package mn.tasky.task.dto;

import java.time.Instant;

public record TaskDraft(String id, String customerId, String categoryId, String intakeAnswersJson,
        int intakeSchemaVersion, String summaryDraft, Instant createdAt, Instant expiresAt) {}
```

- [ ] **Step 2: Create TaskDraftDao**

**IMPORTANT:** All new DAOs must include `@RegisterConstructorMapper` for their DTO type — this is the existing codebase pattern. JDBI needs this to map SQL results to Java records.

```java
package mn.tasky.task.dao;

import java.util.Optional;
import mn.tasky.task.dto.TaskDraft;
import org.jdbi.v3.core.mapper.reflect.ConstructorMapper;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(TaskDraft.class)
public interface TaskDraftDao {
    @SqlUpdate("INSERT INTO task_drafts (id, customer_id, category_id, intake_answers_json, intake_schema_version, summary_draft) "
            + "VALUES (CAST(:id AS uuid), CAST(:customerId AS uuid), CAST(:categoryId AS uuid), CAST(:intakeAnswersJson AS jsonb), :intakeSchemaVersion, :summaryDraft)")
    void insert(@Bind("id") String id, @Bind("customerId") String customerId,
            @Bind("categoryId") String categoryId, @Bind("intakeAnswersJson") String intakeAnswersJson,
            @Bind("intakeSchemaVersion") int intakeSchemaVersion, @Bind("summaryDraft") String summaryDraft);

    @SqlQuery("SELECT * FROM task_drafts WHERE id = CAST(:id AS uuid)")
    Optional<TaskDraft> findById(@Bind("id") String id);

    @SqlUpdate("UPDATE task_drafts SET intake_answers_json = CAST(:intakeAnswersJson AS jsonb), summary_draft = :summaryDraft WHERE id = CAST(:id AS uuid)")
    void update(@Bind("id") String id, @Bind("intakeAnswersJson") String intakeAnswersJson,
            @Bind("summaryDraft") String summaryDraft);
}
```

- [ ] **Step 3: Create CategorySchemaVersion DTO**

```java
package mn.tasky.category.dto;

import java.time.Instant;

public record CategorySchemaVersion(String id, String categoryId, int version, String schemaJson,
        String status, boolean isLastKnownGood, String createdBy, Instant createdAt, Instant activatedAt) {}
```

- [ ] **Step 4: Create CategorySchemaVersionDao**

```java
package mn.tasky.category.dao;

import java.util.List;
import java.util.Optional;
import mn.tasky.category.dto.CategorySchemaVersion;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(CategorySchemaVersion.class)
public interface CategorySchemaVersionDao {
    @SqlUpdate("INSERT INTO category_schema_versions (id, category_id, version, schema_json, status, created_by) "
            + "VALUES (CAST(:id AS uuid), CAST(:categoryId AS uuid), :version, CAST(:schemaJson AS jsonb), :status, CAST(:createdBy AS uuid))")
    void insert(@Bind("id") String id, @Bind("categoryId") String categoryId,
            @Bind("version") int version, @Bind("schemaJson") String schemaJson,
            @Bind("status") String status, @Bind("createdBy") String createdBy);

    @SqlQuery("SELECT * FROM category_schema_versions WHERE category_id = CAST(:categoryId AS uuid) ORDER BY version DESC")
    List<CategorySchemaVersion> findByCategoryId(@Bind("categoryId") String categoryId);

    @SqlQuery("SELECT * FROM category_schema_versions WHERE category_id = CAST(:categoryId AS uuid) AND version = :version")
    Optional<CategorySchemaVersion> findByCategoryIdAndVersion(@Bind("categoryId") String categoryId, @Bind("version") int version);

    @SqlQuery("SELECT * FROM category_schema_versions WHERE category_id = CAST(:categoryId AS uuid) AND status = 'ACTIVE'")
    Optional<CategorySchemaVersion> findActiveByCategoryId(@Bind("categoryId") String categoryId);

    @SqlUpdate("UPDATE category_schema_versions SET status = :status, activated_at = CASE WHEN :status = 'ACTIVE' THEN now() ELSE activated_at END WHERE id = CAST(:id AS uuid)")
    void updateStatus(@Bind("id") String id, @Bind("status") String status);

    @SqlUpdate("UPDATE category_schema_versions SET is_last_known_good = false WHERE category_id = CAST(:categoryId AS uuid)")
    void clearLastKnownGood(@Bind("categoryId") String categoryId);

    @SqlUpdate("UPDATE category_schema_versions SET is_last_known_good = true WHERE id = CAST(:id AS uuid)")
    void markLastKnownGood(@Bind("id") String id);

    @SqlQuery("SELECT MAX(version) FROM category_schema_versions WHERE category_id = CAST(:categoryId AS uuid)")
    Optional<Integer> findMaxVersion(@Bind("categoryId") String categoryId);
}
```

- [ ] **Step 5: Create FeatureToggle DTO and DAO**

```java
// src/main/java/mn/tasky/common/feature/FeatureToggle.java
package mn.tasky.common.feature;

import java.time.Instant;

public record FeatureToggle(String id, String featureName, boolean isEnabled,
        Instant activatedAt, Instant deactivatedAt, String updatedBy, Instant updatedAt) {}
```

```java
// src/main/java/mn/tasky/common/feature/FeatureToggleDao.java
package mn.tasky.common.feature;

import java.util.List;
import java.util.Optional;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(FeatureToggle.class)
public interface FeatureToggleDao {
    @SqlQuery("SELECT * FROM feature_toggles ORDER BY feature_name")
    List<FeatureToggle> findAll();

    @SqlQuery("SELECT * FROM feature_toggles WHERE feature_name = :featureName")
    Optional<FeatureToggle> findByName(@Bind("featureName") String featureName);

    @SqlUpdate("UPDATE feature_toggles SET is_enabled = :enabled, "
            + "activated_at = CASE WHEN :enabled THEN now() ELSE activated_at END, "
            + "deactivated_at = CASE WHEN NOT :enabled THEN now() ELSE deactivated_at END, "
            + "updated_by = CAST(:updatedBy AS uuid), updated_at = now() "
            + "WHERE feature_name = :featureName")
    void update(@Bind("featureName") String featureName, @Bind("enabled") boolean enabled,
            @Bind("updatedBy") String updatedBy);
}
```

- [ ] **Step 6: Update JdbiConfig**

Add to `src/main/java/mn/tasky/common/config/JdbiConfig.java`:
- Import and register `AuditEventDao` (replacing `AuditLogDao`)
- Import and register `TaskDraftDao`
- Import and register `CategorySchemaVersionDao`
- Import and register `FeatureToggleDao`

- [ ] **Step 7: Compile check**

```bash
./gradlew compileJava --no-daemon 2>&1 | head -50
```

Expected: Compilation succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(dao): add DAOs for task_drafts, category_schema_versions, feature_toggles

New DAO/DTO pairs for the three V10 tables. Register all new DAOs
plus AuditEventDao replacement in JdbiConfig.

Ticket: LAUNCH-004
Spec: Phase 0-1 launch completion
API: no API change (DAO layer only)
Tests: compilation verified
Risk: low"
```

---

### Task 5: Stream A — Fix Existing Tests

**Files:**
- Modify: `src/test/java/mn/tasky/review/ReviewIntegrationTests.java`
- Modify: `src/test/java/mn/tasky/review/ReviewControllerUnitTests.java`
- Modify: `src/test/java/mn/tasky/review/application/ReviewServiceTests.java`
- Modify: `src/test/java/mn/tasky/dispute/DisputeIntegrationTests.java`
- Modify: `src/test/java/mn/tasky/dispute/DisputeControllerUnitTests.java`
- Modify: `src/test/java/mn/tasky/dispute/application/DisputeServiceTests.java`
- Modify: `src/test/java/mn/tasky/messaging/MessagingIntegrationTests.java`
- Modify: `src/test/java/mn/tasky/messaging/MessagingControllerUnitTests.java`
- Modify: `src/test/java/mn/tasky/booking/BookingIntegrationTests.java`
- Modify: `src/test/java/mn/tasky/admin/AdminDisputeControllerUnitTests.java`
- Modify: `src/test/java/mn/tasky/admin/AdminUserIntegrationTests.java`
- Modify: Various other test files that reference renamed columns/tables

- [ ] **Step 1: Run full test suite to identify failures**

```bash
./gradlew test --no-daemon 2>&1 | tail -100
```

Capture the full list of failing tests.

- [ ] **Step 2: Fix Review tests**

Update all review test files to use:
- New table name `booking_reviews`
- New column names (`reviewer_id`, `reviewee_id`)
- 5-category rating fields instead of single `rating`
- New `ReviewRequest` constructor with nullable rating fields

- [ ] **Step 3: Fix Dispute tests**

Update all dispute test files to use:
- `raisedBy` instead of `raiserId`
- `resolutionAction` instead of `outcome`
- Remove `resolvedBy` references
- New `Dispute` record constructor

- [ ] **Step 4: Fix Messaging tests**

Update messaging tests to use:
- `customerId` / `taskerId` instead of `participant1Id` / `participant2Id`
- New `Message` constructor with `phoneNumberFlagged` and `contentHash`

- [ ] **Step 5: Fix Booking tests**

Update booking tests to use new `BookingState` constructor with additional fields (`confirmedScheduledAt`, `settlementMode`, `lateCancelIncident`, `liabilityDisclaimerAcceptedAt`).

- [ ] **Step 6: Fix Admin tests**

Update admin tests for `AuditEventDao` method signatures and dispute field name changes.

- [ ] **Step 7: Fix ALL service-layer callers of renamed DAOs/DTOs**

This is the largest step. Every service file that constructs, reads, or passes renamed DTO fields must be updated. Explicit list:

- `AuthService.java` — replace all `auditLogDao` calls with `auditEventDao` (new signature: actorUserId, action, resourceType, resourceId, metadataJson). Update Pro Badge threshold references if they construct AuthUser.
- `DisputeService.java` — `raiserId` → `raisedBy`, `outcome` → `resolutionAction`, remove `resolvedBy` references
- `DisputeController.java` — field name alignment in request/response mapping
- `DisputeResponseMapper.java` — map new field names
- `AdminDisputeController.java` — resolve endpoint field names, `auditEventDao`
- `ReviewService.java` — table name `booking_reviews`, `authorId` → `reviewerId`, `targetUserId` → `revieweeId`, single `rating` → granular ratings
- `ReviewController.java` — new ReviewRequest/Review DTOs
- `MessagingService.java` — `participant1Id/participant2Id` → `customerId/taskerId` in conversation creation and lookups
- `MessagingController.java` — if it references participant field names
- `BookingService.java` — BookingDao.insert() needs new params (confirmedScheduledAt, settlementMode, lateCancelIncident, liabilityDisclaimerAcceptedAt). BookingState constructor updated.
- `BookingController.java` — new fields in response mapping
- `BookingResponseMapper.java` — add new booking fields
- `TaskService.java` — TaskDao.insert() needs intake params. TaskApplicationDao: status `'PENDING'` → `'APPLIED'`, `'REJECTED'` → `'DECLINED'`
- `AdminVerificationController.java` — `auditLogDao` → `auditEventDao`
- `NotificationService.java` — NotificationLogDao.insert() has new params (eventKey, providerMessageId, errorCode — pass null for now)
- `DomainEventOutboxProcessor.java` — check if it references any renamed DTO fields in event handlers

- [ ] **Step 8: Verify concierge dispatch endpoint exists**

Check that `POST /api/v1/admin/tasks/{id}/concierge-assign` exists (REQ-ADMIN-07, required for Phase 0-1):
```bash
grep -r "concierge" src/main/java/ --include="*.java" -l
```

If not found, flag as a gap for Stream D — add a minimal concierge assign endpoint in Task 14.

- [ ] **Step 9: Run full test suite**

```bash
./gradlew test --no-daemon
```

Expected: ALL tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "fix(tests): update all tests for V10 schema alignment

Fix compilation and runtime test failures from renamed tables,
columns, and restructured DTOs. All existing integration and
unit tests now pass against V10 schema.

Ticket: LAUNCH-005
Spec: Phase 0-1 launch completion
API: no API change
Tests: full suite green
Risk: low"
```

---

## Chunk 2: API Contract Update + Structured Intake System

### Task 6: Update API.yaml for All Planned Changes

**Files:**
- Modify: `docs/API.yaml`

**CRITICAL CONTEXT:** The build uses `openapi-generator` (see `build.gradle.kts`) to generate Spring interfaces from `docs/API.yaml`. Every controller implements these generated interfaces. The API.yaml MUST be updated BEFORE any controller work begins — otherwise generated interfaces won't match the new code and compilation will fail.

- [ ] **Step 1: Update Review schema**

Make review rating fields nullable per role direction:
- `quality_rating`, `communication_rating` → nullable (not required for tasker reviewers)
- `clarity_rating`, `respectfulness_rating` → nullable (not required for customer reviewers)
- `punctuality_rating` → always required
- Update the `required` list on the Review schema and the review submission request body

- [ ] **Step 2: Add draft endpoints**

Add to paths:
- `POST /tasks/drafts` (createTaskDraft) — request: `{category_id}`, response: TaskDraft schema
- `GET /tasks/drafts/{id}` (getTaskDraft) — response: TaskDraft
- `PUT /tasks/drafts/{id}` (updateTaskDraft) — request: `{intake_answers, summary_draft}`

Verify TaskDraft schema already exists in API.yaml (it does — lines 622-645).

- [ ] **Step 3: Add category schema admin endpoints**

Add to paths (these may already exist — verify):
- `GET /admin/categories/{id}/schemas` (adminListCategorySchemas)
- `POST /admin/categories/{id}/schemas` (adminCreateCategorySchema)
- `POST /admin/categories/{id}/schemas/{version}/activate` (adminActivateCategorySchema)

- [ ] **Step 4: Add feature toggle endpoints**

Verify these exist in API.yaml (they do — lines 4112-4170):
- `GET /admin/features/toggles`
- `PUT /admin/features/toggles`

- [ ] **Step 5: Regenerate OpenAPI interfaces**

```bash
./gradlew openApiGenerate --no-daemon
./gradlew compileJava --no-daemon 2>&1 | head -50
```

Expected: Generation succeeds. Compilation may show errors from controllers that haven't been updated yet — this is expected and will be fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add docs/API.yaml
git commit -m "docs(api): update API.yaml for Phase 0-1 schema changes

Review ratings made nullable per role direction. Task draft endpoints
verified. Category schema admin endpoints verified. Feature toggle
endpoints verified. OpenAPI generator produces updated interfaces.

Ticket: LAUNCH-006
Spec: Phase 0-1 launch completion
API: Review schema ratings nullable, draft/schema/toggle endpoints
Tests: N/A (contract update)
Risk: medium"
```

---

### Task 7: Category Schema Version Service + Admin Endpoints

**Files:**
- Create: `src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- Modify: `src/main/java/mn/tasky/category/api/CategoryController.java`
- Test: `src/test/java/mn/tasky/category/CategorySchemaIntegrationTests.java`

- [ ] **Step 1: Write failing integration test for schema creation**

Create `src/test/java/mn/tasky/category/CategorySchemaIntegrationTests.java`:

Test: POST to `/api/v1/admin/categories/{id}/schemas` with a valid schema JSON body → returns 201 with schema version object.

- [ ] **Step 2: Run test to verify it fails**

```bash
./gradlew test --tests "mn.tasky.category.CategorySchemaIntegrationTests" --no-daemon
```

Expected: FAIL (endpoint doesn't exist yet).

- [ ] **Step 3: Implement CategorySchemaVersionService**

Create `src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`:

Methods:
- `createVersion(categoryId, schemaJson, createdBy)` — validates schema (3-5 fields, supported types), auto-increments version, inserts as DRAFT
- `activate(categoryId, version)` — validates version exists and is DRAFT/CANARY, deactivates current active, sets new active, updates category's `intake_schema_version` and `intake_schema_json`
- `listVersions(categoryId)` — returns all versions ordered by version DESC
- `rollbackToLastKnownGood(categoryId)` — deactivates current, reactivates last_known_good

Note: Canary activation is schema-ready (CANARY status exists in DB) but the canary progressive-rollout workflow is deferred to post-launch. Seed schemas are deployed directly as ACTIVE. A minimal `activate()` that transitions DRAFT → ACTIVE is sufficient for launch.

Schema validation rules:
- Must be a JSON array of 3-5 field objects
- Each field must have: `key` (string), `label` (string), `type` (one of: single_select, multi_select, dropdown, yes_no, numeric_counter), `required` (boolean)
- Fields with type single_select/multi_select/dropdown must have non-empty `options` array

- [ ] **Step 4: Add admin endpoints to CategoryController**

Add to `src/main/java/mn/tasky/category/api/CategoryController.java`:

- `GET /api/v1/admin/categories/{id}/schemas` → `listSchemaVersions()`
- `POST /api/v1/admin/categories/{id}/schemas` → `createSchemaVersion()`
- `POST /api/v1/admin/categories/{id}/schemas/{version}/activate` → `activateSchemaVersion()`

- [ ] **Step 5: Run test**

```bash
./gradlew test --tests "mn.tasky.category.CategorySchemaIntegrationTests" --no-daemon
```

Expected: PASS.

- [ ] **Step 6: Write additional tests**

Add tests for:
- Schema validation rejection (less than 3 fields → 400)
- Schema validation rejection (unsupported field type → 400)
- Activate version (DRAFT → ACTIVE, category updated)
- Activate already-active version → 409

- [ ] **Step 7: Run all tests**

```bash
./gradlew test --no-daemon
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(intake): category schema versioning service and admin endpoints

CategorySchemaVersionService supports create, activate, rollback.
Validates schema structure (3-5 fields, supported primitives).
Admin endpoints for schema lifecycle management.

Ticket: LAUNCH-006
Spec: REQ-TASK-00, REQ-ADMIN-05
API: GET/POST /admin/categories/{id}/schemas, POST .../activate
Tests: integration tests for create, validate, activate
Risk: medium"
```

---

### Task 8: Task Draft Service + Controller Endpoints

**Files:**
- Create: `src/main/java/mn/tasky/task/application/TaskDraftService.java`
- Modify: `src/main/java/mn/tasky/task/api/TaskController.java`
- Test: `src/test/java/mn/tasky/task/TaskDraftIntegrationTests.java`

- [ ] **Step 1: Write failing integration test**

Test: POST to `/api/v1/tasks/drafts` with `{category_id}` → returns 201 with draft object containing server-resolved `intake_schema_version` matching the category's active schema version.

- [ ] **Step 2: Run test to verify it fails**

```bash
./gradlew test --tests "mn.tasky.task.TaskDraftIntegrationTests" --no-daemon
```

Expected: FAIL.

- [ ] **Step 3: Implement TaskDraftService**

Methods:
- `createDraft(customerId, categoryId, summaryDraft)` — validates category is active + intake-enabled, looks up the current active schema version for that category (client does NOT supply version — server binds it), inserts draft with the resolved `intake_schema_version`
- `getDraft(draftId)` — returns draft if exists and not expired
- `updateDraft(draftId, intakeAnswers, summaryDraft)` — validates draft exists and hasn't expired
- Note: draft cleanup is via expiration only (no explicit delete endpoint needed for launch)

- [ ] **Step 4: Add controller endpoints**

Add to `TaskController.java`:
- `POST /api/v1/tasks/drafts` → `createDraft()`
- `GET /api/v1/tasks/drafts/{id}` → `getDraft()`
- `PUT /api/v1/tasks/drafts/{id}` → `updateDraft()`

- [ ] **Step 5: Run tests and add coverage**

Tests:
- Create draft → 201
- Create draft with inactive category → 409
- Get draft by ID → 200
- Update draft answers → 200
- Get expired draft → 404 (or implement expiry check)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(intake): task draft service and controller endpoints

TaskDraftService creates/updates/deletes drafts bound to schema
version. Validates category is active and intake-enabled.

Ticket: LAUNCH-007
Spec: REQ-TASK-09
API: POST/GET/PUT /tasks/drafts
Tests: integration tests for draft lifecycle
Risk: low"
```

---

### Task 9: Scope Summary Generator + Task Creation Intake Integration

**Files:**
- Create: `src/main/java/mn/tasky/task/application/ScopeSummaryGenerator.java`
- Modify: `src/main/java/mn/tasky/task/application/TaskService.java`
- Modify: `src/main/java/mn/tasky/task/api/TaskController.java`
- Test: `src/test/java/mn/tasky/task/ScopeSummaryGeneratorTests.java`
- Test: `src/test/java/mn/tasky/task/TaskIntakeIntegrationTests.java`

- [ ] **Step 1: Write unit test for ScopeSummaryGenerator**

Test: Given a schema with fields `[{key: "cleaning_type", label: "Cleaning type", type: "single_select"}]` and answers `{"cleaning_type": "Deep Clean"}`, generator returns `"Cleaning type: Deep Clean"`.

Test: Given malformed/missing answers, generator returns key-value fallback.

- [ ] **Step 2: Implement ScopeSummaryGenerator**

```java
package mn.tasky.task.application;

public class ScopeSummaryGenerator {
    public record SummaryResult(String summary, String source) {}

    public SummaryResult generate(String schemaJson, String answersJson) {
        // Parse schema fields and answers
        // Build "Label: Value" lines for each answered field
        // On any parse/template failure, fall back to raw key-value dump
        // Return (summary text, "TEMPLATE" or "TEMPLATE" with fallback note)
    }
}
```

The generator:
- Parses schema JSON to extract field labels
- Maps each answer key to its label
- Joins as `"Label: Value\n"` lines
- On failure (parse error, missing schema): returns raw `"key: value\n"` lines from answers + logs warning
- Returns source `"TEMPLATE"` on success, `"TEMPLATE"` on fallback (fallback is still template-based, just degraded; failure observability comes from the logged analytics event `scope_summary_generation_failed_fallback` per NFR-OBS-01)

- [ ] **Step 3: Run unit test**

```bash
./gradlew test --tests "mn.tasky.task.ScopeSummaryGeneratorTests" --no-daemon
```

Expected: PASS.

- [ ] **Step 4: Write intake integration test**

Test: Create category with schema → create draft → POST `/api/v1/tasks` with `intake_answers`, `intake_schema_version`, `draft_id` → verify task persists `intake_answers_json`, `intake_schema_version`, `scope_summary_source=TEMPLATE`.

Test: POST task with missing required intake answers → 400 with field-level errors.

Test (schema version binding): Create draft (binds version 1) → admin activates version 2 → POST `/api/v1/tasks` with `draft_id` referencing version 1 → verify validation uses version 1 (not 2), task persists `intake_schema_version=1`.

- [ ] **Step 5: Update TaskService.createTask()**

Add to the task creation flow:
1. If `intakeSchemaVersion` is provided, load the schema version from `CategorySchemaVersionDao`
2. Validate intake answers against schema (check required fields present, validate types)
3. Generate scope summary via `ScopeSummaryGenerator`
4. If user provided `scopeSummary` override, use it with source `USER_EDITED`
5. Check `category.intakeEnabled` — reject with 409 if intake is disabled for this category
6. Persist `intake_answers_json`, `intake_schema_version`, `scope_summary_source` on task

- [ ] **Step 6: Update TaskController**

Update `POST /api/v1/tasks` to accept the new `CreateTaskRequest` fields (`intake_answers`, `intake_schema_version`, `scope_summary`, `draft_id`).

- [ ] **Step 7: Run all tests**

```bash
./gradlew test --no-daemon
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(intake): scope summary generator and task creation intake integration

ScopeSummaryGenerator produces deterministic template-based summaries
from intake answers. TaskService validates intake answers against
bound schema version and persists structured data on task creation.
Falls back to key-value summary on template failure.

Ticket: LAUNCH-008
Spec: REQ-TASK-00, REQ-TASK-06, REQ-TASK-07, REQ-TASK-10
API: POST /tasks now accepts intake_answers, intake_schema_version
Tests: unit + integration tests for summary generation and intake flow
Risk: medium"
```

---

### Task 10: Seed Intake Schemas for Launch Categories

**Files:**
- Create: `src/main/resources/db/migration/V11__seed_intake_schemas.sql`

- [ ] **Step 1: Write seed migration**

Seed intake schemas for Cleaning (4 fields), Moving (4 fields), Handyman (3 fields) based on PRD Appendix §14.2.4.

```sql
-- V11__seed_intake_schemas.sql
-- Seed intake schemas for Phase 0-1 launch categories.

-- Find category IDs by name (seeded in V2)
-- Cleaning
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1, '[
  {"key":"property_type","label":"Property type","type":"single_select","required":true,"options":["Apartment","Ger","Office","House"]},
  {"key":"size_or_rooms","label":"Number of rooms","type":"numeric_counter","required":true,"min":1,"max":10},
  {"key":"cleaning_type","label":"Cleaning type","type":"single_select","required":true,"options":["Standard","Deep Clean","Move-in/Move-out","Post-Renovation"]},
  {"key":"supplies_provided","label":"Supplies provided by customer","type":"yes_no","required":true}
]'::jsonb, 'ACTIVE', true, now()
FROM categories WHERE name = 'Cleaning';

UPDATE categories SET intake_schema_version = 1,
    intake_schema_json = (SELECT schema_json FROM category_schema_versions csv JOIN categories c ON csv.category_id = c.id WHERE c.name = 'Cleaning' AND csv.version = 1),
    intake_enabled = true
WHERE name = 'Cleaning';

-- Moving
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1, '[
  {"key":"moving_scope","label":"Moving scope","type":"multi_select","required":true,"options":["A few items","1-2 room apartment","3+ room apartment","Office"]},
  {"key":"origin_floor","label":"Origin floor access","type":"single_select","required":true,"options":["Ground","2nd-4th (no elevator)","5+ (no elevator)","Freight elevator","Passenger elevator"]},
  {"key":"destination_floor","label":"Destination floor access","type":"single_select","required":true,"options":["Ground","2nd-4th (no elevator)","5+ (no elevator)","Freight elevator","Passenger elevator"]},
  {"key":"heavy_lifting","label":"Heavy lifting required","type":"yes_no","required":true}
]'::jsonb, 'ACTIVE', true, now()
FROM categories WHERE name = 'Moving & Hauling';

UPDATE categories SET intake_schema_version = 1,
    intake_schema_json = (SELECT schema_json FROM category_schema_versions csv JOIN categories c ON csv.category_id = c.id WHERE c.name = 'Moving' AND csv.version = 1),
    intake_enabled = true
WHERE name = 'Moving & Hauling';

-- Handyman
INSERT INTO category_schema_versions (category_id, version, schema_json, status, is_last_known_good, activated_at)
SELECT id, 1, '[
  {"key":"issue_type","label":"Type of work","type":"single_select","required":true,"options":["Furniture assembly","Wall repair","Door/window fix","Shelving/mounting","Other"]},
  {"key":"tools_needed","label":"Special tools needed","type":"yes_no","required":true},
  {"key":"estimated_hours","label":"Estimated hours","type":"numeric_counter","required":true,"min":1,"max":8}
]'::jsonb, 'ACTIVE', true, now()
FROM categories WHERE name = 'Handyman';

UPDATE categories SET intake_schema_version = 1,
    intake_schema_json = (SELECT schema_json FROM category_schema_versions csv JOIN categories c ON csv.category_id = c.id WHERE c.name = 'Handyman' AND csv.version = 1),
    intake_enabled = true
WHERE name = 'Handyman';
```

- [ ] **Step 2: Run migration**

```bash
./gradlew flywayMigrate --no-daemon
```

- [ ] **Step 3: Verify seed data**

```bash
docker compose exec db psql -U tasky -d tasky -c "SELECT c.name, c.intake_enabled, c.intake_schema_version FROM categories c WHERE c.name IN ('Cleaning', 'Moving', 'Handyman')"
```

Expected: All 3 categories show `intake_enabled=true`, `intake_schema_version=1`.

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/db/migration/V11__seed_intake_schemas.sql
git commit -m "feat(intake): seed intake schemas for launch categories

Cleaning (4 fields), Moving (4 fields), Handyman (3 fields)
based on PRD baseline examples. Schemas activated as version 1.

Ticket: LAUNCH-009
Spec: REQ-TASK-00
API: no API change (seed data only)
Tests: migration verified
Risk: low"
```

---

## Chunk 3: Streams C + D (Trust/Identity + Infrastructure)

### Task 11: Stream C — Consent Tracking + Pro Badge Fix + Content Hash

**Files:**
- Modify: `src/main/java/mn/tasky/verification/api/VerificationController.java`
- Modify: `src/main/java/mn/tasky/verification/dto/VerificationSubmitRequest.java`
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java`
- Modify: `src/main/java/mn/tasky/messaging/application/MessagingService.java`
- Test: `src/test/java/mn/tasky/verification/VerificationIntegrationTests.java`

- [ ] **Step 1: Write failing test for consent enforcement**

Add to `VerificationIntegrationTests.java`: Test that submitting verification without `consent_accepted=true` returns 400.

- [ ] **Step 2: Update VerificationSubmitRequest**

Add `consentPolicyVersion` (String, required) and `consentAccepted` (Boolean, must be true) to `src/main/java/mn/tasky/verification/dto/VerificationSubmitRequest.java`.

- [ ] **Step 3: Update VerificationController.submitVerification()**

Validate `consentAccepted == true` and `consentPolicyVersion` is not blank. On success, persist both fields + `consent_accepted_at = now()` via `VerificationDao`.

- [ ] **Step 4: Run consent test**

Expected: PASS.

- [ ] **Step 5: Fix Pro Badge threshold**

In `src/main/java/mn/tasky/auth/application/AuthService.java`, find the Pro Badge calculation (currently `completedTasks >= 6`) and change to `completedTasks >= 15`.

- [ ] **Step 6: Add content_hash to MessagingService**

In `src/main/java/mn/tasky/messaging/application/MessagingService.java`, on message creation:
```java
String hashInput = conversationId + "|" + senderId + "|" + content + "|" + Instant.now().toEpochMilli();
String contentHash = DigestUtils.sha256Hex(hashInput); // or MessageDigest
```
Pass `contentHash` to `MessageDao.insert()`.

- [ ] **Step 7: Run full tests**

```bash
./gradlew test --no-daemon
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(trust): consent tracking, Pro Badge fix, message content hash

Verification submit requires consent_policy_version and consent_accepted.
Pro Badge threshold corrected to 15 completed tasks per PRD REQ-SAFE-04.
Messages now generate SHA-256 content_hash for tamper-evident audit.

Ticket: LAUNCH-010
Spec: REQ-SAFE-07, REQ-SAFE-04, Architecture §4.1
API: POST /verification/submit now requires consent fields
Tests: consent rejection test + full suite green
Risk: medium"
```

---

### Task 12: Stream C — Granular Review System

**Files:**
- Modify: `src/main/java/mn/tasky/review/application/ReviewService.java`
- Modify: `src/main/java/mn/tasky/review/api/ReviewController.java`
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java`
- Test: `src/test/java/mn/tasky/review/ReviewIntegrationTests.java`

- [ ] **Step 1: Write failing test for role-specific review validation**

Test: Customer reviews Tasker with quality=5, punctuality=4, communication=5 (clarity and respectfulness omitted) → 201 success.

Test: Customer reviews Tasker with only quality=5 (missing punctuality, communication) → 400 validation error.

Test: Tasker reviews Customer with clarity=4, respectfulness=5, punctuality=4 → 201 success.

- [ ] **Step 2: Update ReviewService**

Implement role-specific validation:
- Determine reviewer role by checking if reviewer is the booking's customer or tasker
- If reviewer is customer: require `qualityRating`, `punctualityRating`, `communicationRating`
- If reviewer is tasker: require `clarityRating`, `respectfulnessRating`, `punctualityRating`
- Compute average from provided (non-null) ratings only
- Pass all 5 fields to ReviewDao (nulls for non-applicable fields)

- [ ] **Step 3: Update ReviewController**

Accept the new `ReviewRequest` with 5 nullable rating fields. Delegate validation to service.

- [ ] **Step 4: Update AuthService.updateUserStats()**

Recalculate `rating_avg` by querying all `booking_reviews` where `reviewee_id = userId`, computing the average of all non-null ratings across all reviews.

- [ ] **Step 5: Run tests**

```bash
./gradlew test --tests "mn.tasky.review.*" --no-daemon
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(review): granular 5-category ratings with role-specific validation

Customer reviews Tasker on quality/punctuality/communication.
Tasker reviews Customer on clarity/respectfulness/punctuality.
Rating average computed from non-null fields only.

Ticket: LAUNCH-011
Spec: REQ-SAFE-02
API: POST /bookings/{id}/reviews accepts 5 nullable rating fields
Tests: role-specific validation tests
Risk: medium"
```

---

### Task 13: Stream D — Feature Toggle Service + Admin Controller

**Files:**
- Create: `src/main/java/mn/tasky/common/feature/FeatureToggleService.java`
- Create: `src/main/java/mn/tasky/admin/api/AdminFeatureToggleController.java`
- Test: `src/test/java/mn/tasky/admin/AdminFeatureToggleIntegrationTests.java`

- [ ] **Step 1: Write failing test**

Test: GET `/api/v1/admin/features/toggles` returns seeded toggles. PUT updates a toggle and audit event is written.

- [ ] **Step 2: Implement FeatureToggleService**

```java
package mn.tasky.common.feature;

// Methods:
// - List<FeatureToggle> listAll()
// - boolean isEnabled(String featureName)
// - FeatureToggle update(String featureName, boolean enabled, UUID actorUserId)
//   → updates toggle, writes audit event via AuditEventDao
```

- [ ] **Step 3: Implement AdminFeatureToggleController**

- `GET /api/v1/admin/features/toggles` → returns all toggles
- `PUT /api/v1/admin/features/toggles` → accepts `{feature_name, is_enabled}`, returns updated toggle

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(admin): feature toggle service and admin management endpoints

Runtime-switchable feature flags stored in DB. Toggle changes
are audit-logged. Admin can enable/disable monetization features
without redeploy.

Ticket: LAUNCH-012
Spec: REQ-ADMIN-06
API: GET/PUT /admin/features/toggles
Tests: integration tests for CRUD + audit
Risk: low"
```

---

### Task 14: Stream D — Dispute Alignment + Feature Gate Migration

**Files:**
- Modify: `src/main/java/mn/tasky/dispute/application/DisputeService.java`
- Modify: `src/main/java/mn/tasky/dispute/api/DisputeController.java`
- Modify: `src/main/java/mn/tasky/dispute/api/DisputeResponseMapper.java`
- Modify: `src/main/java/mn/tasky/admin/api/AdminDisputeController.java`
- Modify: `src/main/java/mn/tasky/payment/api/PaymentController.java`
- Modify: `src/main/java/mn/tasky/wallet/api/WalletController.java`
- Modify: `src/main/java/mn/tasky/admin/api/AdminPayoutController.java`

- [ ] **Step 1: Update DisputeService**

Align all field references with new schema: `raisedBy`, `resolutionAction`, `wrongfulPartyUserId`. Remove `resolvedBy` references. Update `DisputeResponseMapper` to map new fields.

- [ ] **Step 2: Update DisputeController and AdminDisputeController**

Ensure response maps use new field names. Update resolve endpoint to accept `resolution` (maps to `resolutionAction`) and optional `wrongful_party_user_id`.

- [ ] **Step 3: Migrate feature gate checks to DB toggles**

In these files, replace `@Value("${tasky.features.monetization-enabled}")` with `FeatureToggleService` checks:
- `PaymentController` → `featureToggleService.isEnabled("escrow_enabled")` (payment initiation is escrow-phase)
- `PaymentService` → move constructor-time webhook secret validation to `@PostConstruct` or lazy init, then gate runtime calls with `featureToggleService.isEnabled("escrow_enabled")`
- `WalletController` → `featureToggleService.isEnabled("escrow_enabled")` (wallet is escrow-phase)
- `AdminPayoutController` → `featureToggleService.isEnabled("escrow_enabled")` (payouts are escrow-phase)

Also update test files `PaymentIntegrationTests` and `PayoutIntegrationTests` — replace `@TestPropertySource(properties = "tasky.features.monetization-enabled=true")` with DB toggle seeding in test setup (insert into `feature_toggles` table).

- [ ] **Step 4: Run full test suite**

```bash
./gradlew test --no-daemon
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(dispute+features): align dispute schema, migrate feature gates to DB

Dispute service uses new field names (raisedBy, resolutionAction).
Payment/wallet/payout controllers now read feature gates from
feature_toggles table instead of application config properties.

Ticket: LAUNCH-013
Spec: Phase 0-1 launch completion
API: no contract change (field names internal)
Tests: full suite green
Risk: medium"
```

---

## Chunk 4: Documentation + Final Verification

### Task 15: Write LAUNCH_ROADMAP.md

**Files:**
- Create: `docs/LAUNCH_ROADMAP.md`

- [ ] **Step 1: Write the deferred items roadmap**

Create `docs/LAUNCH_ROADMAP.md` containing:
- Phase 0-1 launch scope summary (what shipped)
- Tier 1 fast-follow items (NO_SHOW, dispute evidence, review enforcement) with triggers
- Tier 2 fast-follow items (reschedule, rescue, leak detection, repeat booking) with triggers
- Tier 3 pre-Phase-2 items (reliability score, badges, OAuth circuit breaker, audit logging, FCM/SMS, data lifecycle) with triggers
- Production readiness checklist

Content should match Section 7 of the design spec verbatim, plus the production readiness checklist from Section 5.

- [ ] **Step 2: Update API.yaml**

Update `docs/API.yaml` Review schema to make non-common rating fields nullable (per spec review finding):
- `quality_rating`, `communication_rating` → nullable (not required for tasker reviewers)
- `clarity_rating`, `respectfulness_rating` → nullable (not required for customer reviewers)
- `punctuality_rating` → always required

- [ ] **Step 3: Commit**

```bash
git add docs/LAUNCH_ROADMAP.md docs/API.yaml
git commit -m "docs: launch roadmap with deferred items + API.yaml review rating fix

Deferred items roadmap documents what was intentionally omitted
from Phase 0-1 launch with trigger conditions for each tier.
API.yaml updated to make review ratings nullable per role direction.

Ticket: LAUNCH-014
Spec: Phase 0-1 launch completion
API: Review schema rating fields made nullable
Tests: N/A (documentation)
Risk: low"
```

---

### Task 16: Final Production Verification

**Files:** None (verification only)

- [ ] **Step 1: Clean build**

```bash
./gradlew clean build --no-daemon
```

Expected: BUILD SUCCESSFUL. All checks pass (compilation, tests, checkstyle, spotbugs, PMD).

- [ ] **Step 2: Migration on fresh database**

```bash
docker compose down -v
docker compose up -d db
sleep 5
./gradlew flywayMigrate --no-daemon
```

Expected: All migrations V1-V11 apply successfully.

- [ ] **Step 3: Full test suite**

```bash
./gradlew test --no-daemon
```

Expected: ALL tests pass.

- [ ] **Step 4: Boot application**

```bash
./gradlew bootRun --no-daemon &
sleep 10
curl -s http://localhost:8080/api/v1/system/version | python3 -m json.tool
kill %1
```

Expected: Application starts and version endpoint returns valid JSON.

- [ ] **Step 5: Verify feature toggles seeded**

```bash
docker compose exec db psql -U tasky -d tasky -c "SELECT feature_name, is_enabled FROM feature_toggles"
```

Expected: 4 toggles, all `is_enabled=false`.

- [ ] **Step 6: Verify intake schemas seeded**

```bash
docker compose exec db psql -U tasky -d tasky -c "SELECT c.name, c.intake_enabled, c.intake_schema_version, csv.status FROM categories c JOIN category_schema_versions csv ON c.id = csv.category_id WHERE c.name IN ('Cleaning', 'Moving', 'Handyman')"
```

Expected: 3 rows, all `intake_enabled=true`, `intake_schema_version=1`, `status=ACTIVE`.

- [ ] **Step 7: Migration on existing dev database (V1-V9 already applied)**

```bash
docker compose up -d db
sleep 5
./gradlew flywayMigrate --no-daemon
```

Expected: V10 and V11 apply on top of existing schema without errors.

- [ ] **Step 8: Admin operations smoke test**

Boot the application and verify admin endpoints return valid JSON:
```bash
./gradlew bootRun --no-daemon &
sleep 10
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/api/v1/admin/features/toggles | python3 -m json.tool
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/api/v1/admin/verifications/pending | python3 -m json.tool
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8080/api/v1/admin/categories | python3 -m json.tool
kill %1
```

- [ ] **Step 9: Core flow walkthrough**

Manual or scripted walkthrough of the full Phase 0-1 booking lifecycle:
1. Create user (dev auth) → activate tasker role → submit verification with consent → admin approve
2. Create task with Cleaning intake answers → verify intake_answers_json and scope_summary_source persisted
3. Tasker applies → customer accepts with liability disclaimer → booking ASSIGNED
4. Customer completes booking → COMPLETED
5. Customer reviews (quality/punctuality/communication) → Tasker reviews (clarity/respectfulness/punctuality)

All steps must complete without errors.

- [ ] **Step 10: Mark production-ready**

No commit needed. Report results to user.
