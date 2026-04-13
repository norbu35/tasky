-- V25__event_idempotency_table.sql
-- Event-level idempotency for workflow handlers.
-- Prevents duplicate side effects when events are redelivered (network partition, consumer crash before ack).

CREATE TABLE IF NOT EXISTS event_idempotency (
    event_id     TEXT PRIMARY KEY,
    event_type   TEXT NOT NULL,
    handler      TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup queries (find old events to purge)
CREATE INDEX IF NOT EXISTS idx_event_idempotency_processed_at
    ON event_idempotency (processed_at DESC);
