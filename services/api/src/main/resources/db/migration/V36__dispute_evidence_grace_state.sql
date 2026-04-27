ALTER TABLE disputes
    ADD COLUMN IF NOT EXISTS evidence_reminder_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS evidence_due_at TIMESTAMPTZ;

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_status_check;
ALTER TABLE disputes ADD CONSTRAINT disputes_status_check
    CHECK (status IN (
        'EVIDENCE_NEEDED',
        'OPEN',
        'RESOLVED_TASKER',
        'RESOLVED_CUSTOMER',
        'ESCALATED',
        'CLOSED_INSUFFICIENT_EVIDENCE'
    ));

CREATE INDEX IF NOT EXISTS idx_disputes_evidence_due
    ON disputes (evidence_due_at)
    WHERE status = 'EVIDENCE_NEEDED';
