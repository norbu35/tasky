-- V31__prd_alignment.sql
-- PRD alignment: new statuses, completion tracking columns, intake schema, audit immutability.

-- ============================================================
-- 1. bookings: add DISPUTED to status CHECK constraint
-- ============================================================
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('ASSIGNED', 'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'DISPUTED'));

-- ============================================================
-- 2. task_applications: add WITHDRAWN to status CHECK constraint
-- ============================================================
ALTER TABLE task_applications DROP CONSTRAINT IF EXISTS task_applications_status_check;
ALTER TABLE task_applications ADD CONSTRAINT task_applications_status_check
    CHECK (status IN ('APPLIED', 'SELECTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'));

-- ============================================================
-- 3. booking_reviews: add would_book_again
-- ============================================================
ALTER TABLE booking_reviews ADD COLUMN IF NOT EXISTS would_book_again BOOLEAN;

-- ============================================================
-- 4. bookings: add completion reminder tracking columns
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_reminder_count INT NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_reminder_last_at TIMESTAMPTZ;

-- ============================================================
-- 5. booking_completion_signals: add proof columns
-- ============================================================
ALTER TABLE booking_completion_signals ADD COLUMN IF NOT EXISTS proof_photo_key TEXT;
ALTER TABLE booking_completion_signals ADD COLUMN IF NOT EXISTS proof_note TEXT;

-- ============================================================
-- 6. Partial index on task_applications(respond_by_at) for SELECTED status
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_task_applications_selected_respond_by
    ON task_applications (respond_by_at) WHERE status = 'SELECTED';

-- ============================================================
-- 7. Seed Furniture Assembly intake schema (REQ-P1-TASK-12)
-- ============================================================
INSERT INTO category_schema_versions (category_id, version, schema_json, status, activated_at)
SELECT id, 1,
    '[{"key":"furniture_type","label":"Furniture type","label_mn":"Тавилгын төрөл","type":"single_select","required":true,"options":[{"value":"bed","label":"Bed","label_mn":"Ор"},{"value":"wardrobe","label":"Wardrobe","label_mn":"Шаф"},{"value":"desk","label":"Desk","label_mn":"Тавилга ширээ"},{"value":"shelving_unit","label":"Shelving unit","label_mn":"Тавиур"},{"value":"table","label":"Table","label_mn":"Ширээ"},{"value":"sofa","label":"Sofa","label_mn":"Диван"},{"value":"other","label":"Other","label_mn":"Бусад"}]},{"key":"item_count","label":"Number of items","label_mn":"Эд зүйлийн тоо","type":"numeric_counter","required":true,"min":1,"max":10},{"key":"brand_model","label":"Brand / model","label_mn":"Брэнд / загвар","type":"short_text","required":false,"placeholder":"Brand/model when known"},{"key":"delivered","label":"Is the furniture already delivered?","label_mn":"Тавилга хүргэгдсэн үү?","type":"yes_no","required":true},{"key":"instructions_available","label":"Are assembly instructions available?","label_mn":"Угсралтын заавар байгаа юу?","type":"yes_no","required":true}]'::jsonb,
    'ACTIVE', now()
FROM categories WHERE name = 'Furniture Assembly';

UPDATE categories SET
    intake_schema_version = 1,
    intake_schema_json    = (SELECT schema_json FROM category_schema_versions csv WHERE csv.category_id = categories.id AND csv.version = 1),
    intake_enabled        = true
WHERE name = 'Furniture Assembly';

-- ============================================================
-- 8. audit_events: immutability trigger (prevent UPDATE / DELETE)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_audit_events_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_events are immutable: % operation not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_events_no_update
    BEFORE UPDATE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION fn_audit_events_immutable();

CREATE TRIGGER trg_audit_events_no_delete
    BEFORE DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION fn_audit_events_immutable();
