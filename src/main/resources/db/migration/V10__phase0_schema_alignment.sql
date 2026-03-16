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
CREATE INDEX IF NOT EXISTS idx_task_drafts_customer ON task_drafts (customer_id, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_category_schema_versions_active ON category_schema_versions (category_id, status)
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
