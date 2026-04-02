-- V15: District reference table and tasker service area selection
-- Used for FCM topic subscription: taskers.district.{slug}

CREATE TABLE districts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    name_mn     TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT true
);

-- Seed: Ulaanbaatar's 9 düüregs
INSERT INTO districts (name, name_mn, slug) VALUES
    ('Bayangol',          'Баянгол',           'bayangol'),
    ('Bayanzurkh',        'Баянзүрх',          'bayanzurkh'),
    ('Chingeltei',        'Чингэлтэй',         'chingeltei'),
    ('Khan-Uul',          'Хан-Уул',           'khan-uul'),
    ('Songinokhairkhan',  'Сонгинохайрхан',    'songinokhairkhan'),
    ('Sukhbaatar',        'Сүхбаатар',         'sukhbaatar'),
    ('Nalaikh',           'Налайх',            'nalaikh'),
    ('Bagakhangai',       'Багахангай',         'bagakhangai'),
    ('Baganuur',          'Багануур',           'baganuur');

-- Tasker → district many-to-many
-- A tasker selects the districts they are willing to work in.
-- This drives FCM topic subscriptions on device registration.
CREATE TABLE tasker_service_districts (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, district_id)
);

CREATE INDEX idx_tsd_user ON tasker_service_districts(user_id);
