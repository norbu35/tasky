-- V4__idempotency_and_booking_done_signal.sql
-- Adds idempotency tracking for state transitions and tasker "marked done" signal support.

CREATE TABLE idempotency_keys
(
    id              UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id),
    operation       TEXT        NOT NULL,
    idempotency_key TEXT        NOT NULL,
    status  TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    resource_type   TEXT,
    resource_id     UUID,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, operation, idempotency_key)
);

CREATE INDEX idx_idempotency_keys_created_at
    ON idempotency_keys (created_at DESC);

CREATE TABLE booking_completion_signals
(
    booking_id UUID PRIMARY KEY REFERENCES bookings (id) ON DELETE CASCADE,
    tasker_id  UUID NOT NULL REFERENCES users (id),
    marked_done_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_booking_completion_signals_tasker_marked_done_at
    ON booking_completion_signals (tasker_id, marked_done_at DESC);
