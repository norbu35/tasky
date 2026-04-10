-- V20: Location subsystem
--
-- task_drafts receives location fields so the wizard can persist the user's
-- location pin between steps, without losing it before final task submission.
-- NOTE: task_drafts intentionally does NOT get a location_point geometry column
-- or trigger. Drafts are ephemeral (7-day TTL, customer-private) and no
-- proximity queries are performed against them. The tasks trigger handles
-- geometry population at promotion time.
--
-- districts gains centroid coordinates to support deterministic location fuzzing:
-- public task views return the nearest district centroid instead of a random
-- offset, so taskers see a stable district-level label rather than "Fuzzed".

ALTER TABLE task_drafts
    ADD COLUMN IF NOT EXISTS location_lat  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS location_lng  DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS location_text TEXT;

ALTER TABLE districts
    ADD COLUMN IF NOT EXISTS centroid_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS centroid_lng DOUBLE PRECISION;

-- Expect: 9 rows affected (one per UB düüreg)
UPDATE districts SET centroid_lat = 47.9133, centroid_lng = 106.8684 WHERE slug = 'bayangol';
UPDATE districts SET centroid_lat = 47.9322, centroid_lng = 106.9856 WHERE slug = 'bayanzurkh';
UPDATE districts SET centroid_lat = 47.9379, centroid_lng = 106.8919 WHERE slug = 'chingeltei';
UPDATE districts SET centroid_lat = 47.8766, centroid_lng = 106.9782 WHERE slug = 'khan-uul';
UPDATE districts SET centroid_lat = 47.9057, centroid_lng = 106.7674 WHERE slug = 'songinokhairkhan';
UPDATE districts SET centroid_lat = 47.9213, centroid_lng = 106.9197 WHERE slug = 'sukhbaatar';
UPDATE districts SET centroid_lat = 47.7531, centroid_lng = 107.3484 WHERE slug = 'nalaikh';
UPDATE districts SET centroid_lat = 47.8330, centroid_lng = 108.3577 WHERE slug = 'bagakhangai';
UPDATE districts SET centroid_lat = 47.7597, centroid_lng = 108.3512 WHERE slug = 'baganuur';
