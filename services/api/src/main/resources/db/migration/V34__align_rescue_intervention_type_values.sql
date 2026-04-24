-- Align persisted intervention_type values with the canonical PRD/design vocabulary.
UPDATE task_rescue_events
SET intervention_type = CASE intervention_type
    WHEN 'EXTERNAL_DISTRIBUTION' THEN 'external_distribution'
    WHEN 'MANUAL_ASSISTED' THEN 'manual_rescue'
    WHEN 'SYSTEM_ASSISTED' THEN 'external_distribution'
    ELSE intervention_type
END
WHERE intervention_type IN ('EXTERNAL_DISTRIBUTION', 'MANUAL_ASSISTED', 'SYSTEM_ASSISTED');

ALTER TABLE task_rescue_events
    DROP CONSTRAINT IF EXISTS task_rescue_events_intervention_type_check;

ALTER TABLE task_rescue_events
    ADD CONSTRAINT task_rescue_events_intervention_type_check
    CHECK (
        intervention_type IS NULL
        OR intervention_type IN ('manual_rescue', 'external_distribution', 'ops_override')
    );
