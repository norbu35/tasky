-- Tranche 9: extend outbox with trace_id, locale, and platform so that
-- the full request context survives into async workers and DLQ inspection.
ALTER TABLE domain_outbox_events
    ADD COLUMN IF NOT EXISTS trace_id TEXT,
    ADD COLUMN IF NOT EXISTS locale TEXT,
    ADD COLUMN IF NOT EXISTS platform TEXT;
