-- Add context propagation columns to the outbox table so that correlation,
-- causation, command, workflow, and actor identifiers survive from the
-- originating request through to async workers.
ALTER TABLE domain_outbox_events
    ADD COLUMN IF NOT EXISTS correlation_id TEXT,
    ADD COLUMN IF NOT EXISTS causation_id TEXT,
    ADD COLUMN IF NOT EXISTS command_id TEXT,
    ADD COLUMN IF NOT EXISTS workflow_id TEXT,
    ADD COLUMN IF NOT EXISTS actor_id TEXT;

-- Index for workers that filter by workflow to trace a chain of events.
CREATE INDEX IF NOT EXISTS idx_domain_outbox_events_workflow
    ON domain_outbox_events (workflow_id)
    WHERE workflow_id IS NOT NULL;
