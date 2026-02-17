-- V1__initial_schema.sql
-- Full DDL for 22 tables across 6 modules

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Identity module
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    phone           TEXT NOT NULL,
    phone_blind_idx TEXT NOT NULL UNIQUE,
    role            TEXT NOT NULL,
    status          TEXT NOT NULL,
    suspension_end_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE TABLE profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    full_name       TEXT,
    avatar_url      TEXT,
    rating_avg      DOUBLE PRECISION NOT NULL DEFAULT 0,
    completed_tasks INT NOT NULL DEFAULT 0
);

CREATE TABLE otp_challenges (
    phone_blind_idx TEXT PRIMARY KEY,
    code            TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    attempts        INT NOT NULL DEFAULT 0
);

CREATE TABLE refresh_sessions (
    token_id        TEXT PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    expires_at      TIMESTAMPTZ NOT NULL
);

CREATE TABLE verifications (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id),
    id_card_front_key TEXT NOT NULL,
    id_card_back_key  TEXT NOT NULL,
    status           TEXT NOT NULL,
    submitted_at     TIMESTAMPTZ NOT NULL,
    admin_notes      TEXT,
    reviewed_at      TIMESTAMPTZ
);

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY,
    admin_id        TEXT,
    action          TEXT NOT NULL,
    target_user_id  TEXT,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE TABLE tasker_strikes (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Marketplace module
-- ============================================================

CREATE TABLE categories (
    id          UUID PRIMARY KEY,
    name        TEXT NOT NULL,
    name_mn     TEXT,
    icon_url    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL
);

CREATE TABLE tasks (
    id              UUID PRIMARY KEY,
    customer_id     UUID NOT NULL REFERENCES users(id),
    category_id     UUID NOT NULL REFERENCES categories(id),
    description     TEXT NOT NULL,
    budget          INT NOT NULL,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,
    location_text   TEXT,
    location_point  GEOMETRY(Point, 4326),
    status          TEXT NOT NULL,
    scheduled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tasks_location_point ON tasks USING GIST (location_point);

-- Auto-populate location_point from lat/lng
CREATE OR REPLACE FUNCTION tasks_set_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326);
    ELSE
        NEW.location_point := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_location_point
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION tasks_set_location_point();

CREATE TABLE task_photos (
    id          UUID PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id),
    storage_key TEXT NOT NULL,
    sort_order  INT NOT NULL
);

CREATE TABLE task_applications (
    id          UUID PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks(id),
    tasker_id   UUID NOT NULL REFERENCES users(id),
    message     TEXT,
    status      TEXT NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ NOT NULL,
    UNIQUE(task_id, tasker_id)
);

-- ============================================================
-- Booking module
-- ============================================================

CREATE TABLE bookings (
    id                              UUID PRIMARY KEY,
    task_id                         UUID NOT NULL REFERENCES tasks(id),
    tasker_id                       UUID NOT NULL REFERENCES users(id),
    customer_id                     UUID NOT NULL REFERENCES users(id),
    price                           INT NOT NULL,
    status                          TEXT NOT NULL,
    cancellation_fee                INT,
    liability_disclaimer_accepted   BOOLEAN NOT NULL DEFAULT false,
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at                      TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Wallet module
-- ============================================================

CREATE TABLE wallets (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    balance_mnt     BIGINT NOT NULL DEFAULT 0,
    held_balance_mnt BIGINT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ
);

CREATE TABLE ledger_entries (
    id              UUID PRIMARY KEY,
    user_id         TEXT NOT NULL,
    amount          INT NOT NULL,
    type            TEXT NOT NULL,
    reference_id    TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE TABLE payout_requests (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    amount          INT NOT NULL,
    status          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    processed_at    TIMESTAMPTZ
);

CREATE TABLE credited_bookings (
    booking_id      TEXT PRIMARY KEY
);

-- ============================================================
-- Communication module
-- ============================================================

CREATE TABLE conversations (
    id              UUID PRIMARY KEY,
    task_id         UUID NOT NULL REFERENCES tasks(id),
    participant1_id UUID NOT NULL REFERENCES users(id),
    participant2_id UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL,
    UNIQUE(task_id, participant1_id, participant2_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL
);

CREATE TABLE device_tokens (
    user_id     UUID NOT NULL REFERENCES users(id),
    token       TEXT NOT NULL,
    platform    TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, token)
);

CREATE TABLE notification_log (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,
    channel     TEXT NOT NULL,
    status      TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Support module
-- ============================================================

CREATE TABLE disputes (
    id              UUID PRIMARY KEY,
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    raiser_id       UUID NOT NULL REFERENCES users(id),
    reason          TEXT NOT NULL,
    status          TEXT NOT NULL,
    outcome         TEXT,
    resolved_by     TEXT,
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ
);

CREATE TABLE reviews (
    id              UUID PRIMARY KEY,
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    author_id       UUID NOT NULL REFERENCES users(id),
    target_user_id  UUID NOT NULL REFERENCES users(id),
    rating          INT NOT NULL,
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL,
    UNIQUE(booking_id, author_id)
);

-- ============================================================
-- Analytics + Payment
-- ============================================================

CREATE TABLE analytics_events (
    id          UUID PRIMARY KEY,
    name        TEXT NOT NULL,
    user_id     TEXT,
    properties  JSONB,
    timestamp   TIMESTAMPTZ NOT NULL
);

CREATE TABLE payment_intents (
    payment_id  TEXT PRIMARY KEY,
    booking_id  TEXT,
    processed   BOOLEAN NOT NULL DEFAULT false
);
