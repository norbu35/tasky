-- V25__event_idempotency_table.sql
-- Event-level idempotency for workflow handlers.
-- Prevents duplicate side effects when events are redelivered (network partition, consumer crash before ack).
-- Uses event_status to support IN_PROGRESS → COMPLETED transition so that handler crashes
-- do not permanently lose side effects on retry.

CREATE TABLE IF NOT EXISTS event_idempotency (
    event_id     TEXT PRIMARY KEY,
    event_type   TEXT NOT NULL,
    handler      TEXT NOT NULL,
    event_status TEXT NOT NULL DEFAULT 'IN_PROGRESS'
                     CHECK (event_status IN ('IN_PROGRESS', 'COMPLETED')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup queries (find old events to purge)
CREATE INDEX IF NOT EXISTS idx_event_idempotency_processed_at
    ON event_idempotency (processed_at DESC);

-- Index for retry lookups (check status of in-progress events)
CREATE INDEX IF NOT EXISTS idx_event_idempotency_status
    ON event_idempotency (event_status);
