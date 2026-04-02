CREATE TABLE IF NOT EXISTS domain_outbox_events
(
    id             UUID PRIMARY KEY,
    event_type     TEXT        NOT NULL,
    aggregate_type TEXT        NOT NULL,
    aggregate_id   UUID,
    payload        JSONB       NOT NULL,
    status         TEXT        NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
    attempts       INTEGER     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    available_at   TIMESTAMPTZ NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL,
    processed_at   TIMESTAMPTZ,
    last_error     TEXT
);

CREATE INDEX IF NOT EXISTS idx_domain_outbox_events_status_available
    ON domain_outbox_events (status, available_at, created_at);

CREATE INDEX IF NOT EXISTS idx_domain_outbox_events_aggregate
    ON domain_outbox_events (aggregate_type, aggregate_id);
