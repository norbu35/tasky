-- Track the stage of task-level interventions so assisted outcomes remain auditable.
ALTER TABLE task_rescue_events
    ADD COLUMN IF NOT EXISTS intervention_stage TEXT;

ALTER TABLE task_rescue_events
    DROP CONSTRAINT IF EXISTS task_rescue_events_intervention_stage_check;

ALTER TABLE task_rescue_events
    ADD CONSTRAINT task_rescue_events_intervention_stage_check
    CHECK (
        intervention_stage IS NULL
        OR intervention_stage IN ('pre_match', 'post_match', 'post_booking', 'completion_rescue')
    );
