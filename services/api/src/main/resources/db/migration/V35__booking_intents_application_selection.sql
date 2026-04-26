ALTER TABLE booking_intents
    ADD COLUMN IF NOT EXISTS selected_application_id UUID NULL REFERENCES task_applications(id);

ALTER TABLE booking_intents
    DROP CONSTRAINT IF EXISTS booking_intents_source_check;

ALTER TABLE booking_intents
    ADD CONSTRAINT booking_intents_source_check
    CHECK (source IN ('APPLICATION_SELECTION', 'REBOOK', 'INSTANT_MATCH'));

ALTER TABLE booking_intents
    DROP CONSTRAINT IF EXISTS booking_intents_status_check;

ALTER TABLE booking_intents
    ADD CONSTRAINT booking_intents_status_check
    CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_booking_intents_selected_application_id
    ON booking_intents(selected_application_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_intents_pending_application_selection_task
    ON booking_intents(task_id)
    WHERE source = 'APPLICATION_SELECTION' AND status = 'PENDING';
