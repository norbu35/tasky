CREATE INDEX IF NOT EXISTS idx_verifications_status_id ON verifications (status, id);
CREATE INDEX IF NOT EXISTS idx_disputes_status_id ON disputes (status, id);

-- Admin verification queue is a read-heavy surface with request-path enrichment.
-- Use an owned Postgres view first so runtime/admin composition reads a stable summary model
-- without introducing broker-driven projection machinery inside the monolith.
CREATE VIEW admin_verification_queue_projection AS
SELECT v.id,
       v.user_id,
       u.phone AS encrypted_user_phone,
       p.full_name AS user_name,
       v.id_card_front_key,
       v.id_card_back_key,
       v.status,
       v.admin_notes,
       v.submitted_at,
       v.reviewed_at
FROM verifications v
         JOIN users u ON u.id = v.user_id
         LEFT JOIN profiles p ON p.user_id = v.user_id
WHERE v.status = 'PENDING';

-- Admin dispute queue currently projects only open-dispute summary fields, but it still benefits
-- from a projection-owned read model so runtime/admin code stops reading directly from module tables.
CREATE VIEW admin_dispute_queue_projection AS
SELECT d.id,
       d.booking_id,
       d.raised_by,
       d.reason,
       d.status,
       d.resolution_action,
       d.wrongful_party_user_id,
       d.resolution_notes,
       d.created_at,
       d.resolved_at
FROM disputes d
WHERE d.status = 'OPEN';
