-- V3__moderation_policy_and_reliability.sql
-- Adds moderation policy/settings, suspension history, and reliability incidents.

CREATE TABLE moderation_policy (
    id                          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    strike_window_days          INT NOT NULL CHECK (strike_window_days BETWEEN 1 AND 365),
    strike_threshold            INT NOT NULL CHECK (strike_threshold BETWEEN 1 AND 10),
    first_suspension_days       INT NOT NULL CHECK (first_suspension_days BETWEEN 1 AND 365),
    repeat_suspension_days      INT NOT NULL CHECK (repeat_suspension_days BETWEEN 1 AND 365),
    repeat_offense_window_days  INT NOT NULL CHECK (repeat_offense_window_days BETWEEN 1 AND 730),
    auto_unsuspend_enabled      BOOLEAN NOT NULL DEFAULT true,
    updated_at                  TIMESTAMPTZ NOT NULL,
    CHECK (repeat_suspension_days >= first_suspension_days),
    CHECK (repeat_offense_window_days >= strike_window_days)
);

INSERT INTO moderation_policy (
    id,
    strike_window_days,
    strike_threshold,
    first_suspension_days,
    repeat_suspension_days,
    repeat_offense_window_days,
    auto_unsuspend_enabled,
    updated_at
) VALUES (
    1,
    30,
    3,
    7,
    14,
    180,
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE suspension_events (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    strike_count    INT NOT NULL CHECK (strike_count > 0),
    suspension_days INT NOT NULL CHECK (suspension_days > 0),
    suspended_at    TIMESTAMPTZ NOT NULL,
    unsuspended_at  TIMESTAMPTZ,
    CHECK (unsuspended_at IS NULL OR unsuspended_at >= suspended_at)
);

CREATE INDEX idx_suspension_events_user_suspended_at
    ON suspension_events(user_id, suspended_at DESC);

CREATE TABLE booking_reliability_incidents (
    id              UUID PRIMARY KEY,
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    incident_type   TEXT NOT NULL,
    details         TEXT,
    recorded_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_booking_reliability_incidents_booking
    ON booking_reliability_incidents(booking_id);
CREATE UNIQUE INDEX uq_booking_reliability_incident_per_booking_user_type
    ON booking_reliability_incidents(booking_id, user_id, incident_type);
