-- Add intervention_type to rescue events for structured KPI tracking.
-- REQ-P1-ASSIST-01: classify task outcomes as self-serve, system-assisted, or manual-assisted.
ALTER TABLE task_rescue_events ADD COLUMN intervention_type TEXT
    CHECK (intervention_type IN ('SYSTEM_ASSISTED', 'EXTERNAL_DISTRIBUTION', 'MANUAL_ASSISTED'));
