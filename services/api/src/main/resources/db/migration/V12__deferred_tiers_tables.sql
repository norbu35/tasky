-- V12__deferred_tiers_tables.sql
-- Deferred Phase 0-1 tiers: 7 new tables for booking lifecycle, trust & safety,
-- and tasker reputation features.
-- Spec: docs/superpowers/specs/2026-03-17-phase01-deferred-tiers-design.md §3

-- ============================================================
-- 1. booking_schedule_events
--    Immutable log of reschedule request/accept/decline/expire events.
--    One REQUESTED event per reschedule attempt; terminal events written
--    by BookingScheduleService and RescheduleExpiryScheduler.
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_schedule_events (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id            UUID        NOT NULL REFERENCES bookings (id),
    actor_user_id         UUID        NOT NULL REFERENCES users (id),
    event_type            TEXT        NOT NULL CHECK (event_type IN ('REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    proposed_scheduled_at TIMESTAMPTZ,
    reason                TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_schedule_events_booking
    ON booking_schedule_events (booking_id, created_at DESC);

-- ============================================================
-- 2. booking_timeline_events
--    Append-only audit log for all booking lifecycle state changes.
--    Written by: no-show flow, reschedule flow, cancellation, completion.
--    actor_user_id is nullable for system-generated events (schedulers).
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_timeline_events (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id    UUID        NOT NULL REFERENCES bookings (id),
    event_type    TEXT        NOT NULL,
    actor_user_id UUID        REFERENCES users (id),
    metadata_json JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_events_booking
    ON booking_timeline_events (booking_id, created_at DESC);

-- ============================================================
-- 3. task_rescue_events
--    One rescue event per task (idempotent). Written by RescueScheduler
--    when an OPEN task has zero qualified applications after 8 hours.
--    actions_json documents rescue actions per REQ-P1-ASSIST-03.
-- ============================================================
CREATE TABLE IF NOT EXISTS task_rescue_events (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id        UUID        NOT NULL REFERENCES tasks (id),
    triggered_at   TIMESTAMPTZ NOT NULL,
    trigger_window TEXT        NOT NULL CHECK (trigger_window IN ('DAYTIME', 'OFF_HOURS')),
    actions_json   JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_rescue_events_task
    ON task_rescue_events (task_id);

-- ============================================================
-- 4. dispute_evidence
--    Evidence items attached to a dispute. PHOTO uses storage_key
--    (presigned S3 pattern); CHAT_EXCERPT and WRITTEN_TIMELINE
--    use text_payload. Zero evidence at 24h triggers auto-close
--    (inferred from disputes.created_at + 24h — no extra column needed).
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id   UUID        NOT NULL REFERENCES disputes (id),
    type         TEXT        NOT NULL CHECK (type IN ('CHAT_EXCERPT', 'PHOTO', 'WRITTEN_TIMELINE')),
    storage_key  TEXT,
    text_payload TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute
    ON dispute_evidence (dispute_id);

-- ============================================================
-- 5. review_enforcement_cases
--    Created for both parties on BOOKING_COMPLETED. Drives soft-gate
--    reminders (24h, 72h) and hard-lock eligibility checks.
--    investigation_active flag set by admin to trigger hard lock.
--    Hard lock is a query-time gate — not a stored status value.
--    Auto-expires to EXPIRED after 7 days to prevent permanent locks.
-- ============================================================
CREATE TABLE IF NOT EXISTS review_enforcement_cases (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id           UUID        NOT NULL REFERENCES bookings (id),
    user_id              UUID        NOT NULL REFERENCES users (id),
    reason_code          TEXT        NOT NULL,
    status               TEXT        NOT NULL DEFAULT 'PENDING'
                                     CHECK (status IN ('PENDING', 'REMINDED_24H', 'REMINDED_72H', 'COMPLETED', 'EXPIRED')),
    investigation_active BOOLEAN     NOT NULL DEFAULT false,
    triggered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at          TIMESTAMPTZ
);
-- Partial index omits COMPLETED rows — they are never queried for lock checks
CREATE INDEX IF NOT EXISTS idx_review_enforcement_cases_user_status
    ON review_enforcement_cases (user_id, status)
    WHERE status != 'COMPLETED';

-- ============================================================
-- 6. tasker_reliability_scores
--    One row per tasker; upserted by ReliabilityScoreService on booking
--    completion, cancellation, or no-show. Score not computed until
--    >= 5 terminal bookings in the 90-day window (cold-start guard).
-- ============================================================
CREATE TABLE IF NOT EXISTS tasker_reliability_scores (
    tasker_id         UUID             PRIMARY KEY REFERENCES users (id),
    score             DOUBLE PRECISION NOT NULL DEFAULT 0,
    completion_rate   DOUBLE PRECISION,
    punctuality_rate  DOUBLE PRECISION,
    cancellation_rate DOUBLE PRECISION,
    review_avg        DOUBLE PRECISION,
    window_days       INT              NOT NULL DEFAULT 90,
    computed_at       TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. tasker_badges
--    Composite PK (tasker_id, badge_type) — only PRO type in Phase 0-1.
--    revoked_at NULL means badge is currently active.
--    Assigned/revoked by BadgeEvaluationService and BadgeRevocationScheduler.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasker_badges (
    tasker_id   UUID        NOT NULL REFERENCES users (id),
    badge_type  TEXT        NOT NULL CHECK (badge_type IN ('PRO')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at  TIMESTAMPTZ,
    PRIMARY KEY (tasker_id, badge_type)
);
-- Partial index on active badges only — the common query path
CREATE INDEX IF NOT EXISTS idx_tasker_badges_tasker
    ON tasker_badges (tasker_id)
    WHERE revoked_at IS NULL;

-- ============================================================
-- 8. Seed data: feature toggles
--    data_retention_dry_run: enabled by default so DataRetentionService
--    logs what it would delete without performing actual S3 deletions.
--    Real deletion requires explicitly disabling this toggle.
-- ============================================================
INSERT INTO feature_toggles (feature_name, is_enabled)
VALUES ('data_retention_dry_run', true)
ON CONFLICT (feature_name) DO NOTHING;
