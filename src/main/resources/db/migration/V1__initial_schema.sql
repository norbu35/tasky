-- V1__initial_schema.sql
-- Full DDL for 22 tables across 6 modules

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Identity module
-- ============================================================

CREATE TABLE users
(
    id                UUID PRIMARY KEY,
    phone             TEXT        NOT NULL,
    phone_blind_idx   TEXT        NOT NULL UNIQUE,
    role              TEXT        NOT NULL CHECK (role IN ( 'CUSTOMER', 'TASKER', 'ADMIN' )),
    status            TEXT        NOT NULL CHECK (status IN ( 'PENDING', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'BANNED' )),
    suspension_end_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL
);

CREATE TABLE profiles
(
    user_id         UUID PRIMARY KEY REFERENCES users ( id ),
    full_name       TEXT,
    avatar_url      TEXT,
    rating_avg      DOUBLE PRECISION NOT NULL DEFAULT 0,
    completed_tasks INT              NOT NULL DEFAULT 0
);

CREATE TABLE otp_challenges
(
    phone_blind_idx TEXT PRIMARY KEY,
    code            TEXT        NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    attempts        INT         NOT NULL DEFAULT 0
);

CREATE TABLE refresh_sessions
(
    token_id   TEXT PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users ( id ),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE verifications
(
    id                UUID PRIMARY KEY,
    user_id           UUID        NOT NULL REFERENCES users ( id ),
    id_card_front_key TEXT        NOT NULL,
    id_card_back_key  TEXT        NOT NULL,
    status            TEXT        NOT NULL CHECK (status IN ( 'PENDING', 'APPROVED', 'REJECTED' )),
    submitted_at      TIMESTAMPTZ NOT NULL,
    admin_notes       TEXT,
    reviewed_at       TIMESTAMPTZ
);

CREATE TABLE audit_log
(
    id             UUID PRIMARY KEY,
    admin_id       UUID,
    action         TEXT        NOT NULL,
    target_user_id UUID,
    reason         TEXT,
    created_at     TIMESTAMPTZ NOT NULL
);

CREATE TABLE tasker_strikes
(
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users ( id ),
    reason     TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Marketplace module
-- ============================================================

CREATE TABLE categories
(
    id         UUID PRIMARY KEY,
    name       TEXT    NOT NULL,
    name_mn    TEXT,
    icon_url   TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT     NOT NULL
);

CREATE TABLE tasks
(
    id             UUID PRIMARY KEY,
    customer_id    UUID        NOT NULL REFERENCES users ( id ),
    category_id    UUID        NOT NULL REFERENCES categories ( id ),
    description    TEXT        NOT NULL,
    budget         INT         NOT NULL,
    location_lat   DOUBLE PRECISION,
    location_lng   DOUBLE PRECISION,
    location_text  TEXT,
    location_point GEOMETRY(Point, 4326),
    status         TEXT        NOT NULL CHECK (status IN ( 'OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED' )),
    scheduled_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tasks_location_point ON tasks USING gist ( location_point );

-- Auto-populate location_point from lat/lng
CREATE OR REPLACE FUNCTION tasks_set_location_point()
    RETURNS TRIGGER AS
$$
BEGIN
    IF new.location_lat IS NOT NULL AND new.location_lng IS NOT NULL THEN
        new.location_point := st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326);
    ELSE
        new.location_point := NULL;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_location_point
    BEFORE INSERT OR UPDATE
    ON tasks
    FOR EACH ROW
EXECUTE FUNCTION tasks_set_location_point();

CREATE TABLE task_photos
(
    id          UUID PRIMARY KEY,
    task_id     UUID NOT NULL REFERENCES tasks ( id ),
    storage_key TEXT NOT NULL,
    sort_order  INT  NOT NULL
);

CREATE TABLE task_applications
(
    id         UUID PRIMARY KEY,
    task_id    UUID        NOT NULL REFERENCES tasks ( id ),
    tasker_id  UUID        NOT NULL REFERENCES users ( id ),
    message    TEXT,
    status     TEXT        NOT NULL DEFAULT 'PENDING' CHECK (status IN ( 'PENDING', 'ACCEPTED', 'REJECTED' )),
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE ( task_id, tasker_id )
);

-- ============================================================
-- Booking module
-- ============================================================

CREATE TABLE bookings
(
    id                            UUID PRIMARY KEY,
    task_id                       UUID        NOT NULL REFERENCES tasks ( id ),
    tasker_id                     UUID        NOT NULL REFERENCES users ( id ),
    customer_id                   UUID        NOT NULL REFERENCES users ( id ),
    price                         INT         NOT NULL,
    status                        TEXT        NOT NULL CHECK (status IN ( 'ASSIGNED', 'PAID', 'COMPLETED', 'CANCELLED' )),
    cancellation_fee              INT,
    liability_disclaimer_accepted BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at                    TIMESTAMPTZ NOT NULL,
    updated_at                    TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Wallet module
-- ============================================================

CREATE TABLE wallets
(
    user_id          UUID PRIMARY KEY REFERENCES users ( id ),
    balance_mnt      BIGINT NOT NULL DEFAULT 0,
    held_balance_mnt BIGINT NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ
);

CREATE TABLE ledger_entries
(
    id           UUID PRIMARY KEY,
    user_id      UUID REFERENCES users ( id ),
    amount       INT         NOT NULL,
    type         TEXT        NOT NULL CHECK (type IN
                                             ( 'DEPOSIT', 'FEE', 'HOLD', 'RELEASE', 'CONFISCATE', 'PAYOUT', 'REFUND' )),
    reference_id UUID,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL,
    CHECK ((type = 'FEE' AND user_id IS NULL) OR (type <> 'FEE' AND user_id IS NOT NULL))
);
CREATE INDEX idx_ledger_entries_user_created_at ON ledger_entries ( user_id, created_at DESC );

CREATE TABLE payout_requests
(
    id           UUID PRIMARY KEY,
    user_id      UUID        NOT NULL REFERENCES users ( id ),
    amount       INT         NOT NULL,
    status       TEXT        NOT NULL CHECK (status IN ( 'PENDING', 'PROCESSED', 'REJECTED' )),
    created_at   TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ
);

CREATE TABLE credited_bookings
(
    booking_id UUID PRIMARY KEY REFERENCES bookings ( id )
);

-- ============================================================
-- Communication module
-- ============================================================

CREATE TABLE conversations
(
    id              UUID PRIMARY KEY,
    task_id         UUID        NOT NULL REFERENCES tasks ( id ),
    participant1_id UUID        NOT NULL REFERENCES users ( id ),
    participant2_id UUID        NOT NULL REFERENCES users ( id ),
    created_at      TIMESTAMPTZ NOT NULL,
    UNIQUE ( task_id, participant1_id, participant2_id )
);

CREATE TABLE messages
(
    id              UUID PRIMARY KEY,
    conversation_id UUID        NOT NULL REFERENCES conversations ( id ),
    sender_id       UUID        NOT NULL REFERENCES users ( id ),
    content         TEXT        NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL
);

CREATE TABLE device_tokens
(
    user_id    UUID        NOT NULL REFERENCES users ( id ),
    token      TEXT        NOT NULL,
    platform   TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE ( user_id, token )
);

CREATE TABLE notification_log
(
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users ( id ),
    type       TEXT        NOT NULL,
    channel    TEXT        NOT NULL,
    status     TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- Support module
-- ============================================================

CREATE TABLE disputes
(
    id               UUID PRIMARY KEY,
    booking_id       UUID        NOT NULL REFERENCES bookings ( id ),
    raiser_id        UUID        NOT NULL REFERENCES users ( id ),
    reason           TEXT        NOT NULL,
    status           TEXT        NOT NULL CHECK (status IN ( 'OPEN', 'RESOLVED_TASKER', 'RESOLVED_CUSTOMER', 'ESCALATED' )),
    outcome          TEXT CHECK (outcome IS NULL OR outcome IN ( 'RESOLVE_TASKER', 'RESOLVE_CUSTOMER', 'ESCALATE' )),
    resolved_by      UUID,
    resolution_notes TEXT,
    created_at       TIMESTAMPTZ NOT NULL,
    resolved_at      TIMESTAMPTZ
);

CREATE TABLE reviews
(
    id             UUID PRIMARY KEY,
    booking_id     UUID        NOT NULL REFERENCES bookings ( id ),
    author_id      UUID        NOT NULL REFERENCES users ( id ),
    target_user_id UUID        NOT NULL REFERENCES users ( id ),
    rating         INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMPTZ NOT NULL,
    UNIQUE ( booking_id, author_id )
);

-- ============================================================
-- Analytics + Payment
-- ============================================================

CREATE TABLE analytics_events
(
    id         UUID PRIMARY KEY,
    name       TEXT        NOT NULL,
    user_id    UUID,
    properties JSONB,
    timestamp  TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events ( timestamp DESC );
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events ( user_id, timestamp DESC );

CREATE TABLE payment_intents
(
    payment_id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings ( id ),
    processed  BOOLEAN NOT NULL DEFAULT FALSE
);
