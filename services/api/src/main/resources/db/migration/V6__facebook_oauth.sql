ALTER TABLE users
    ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE users
    ALTER COLUMN phone_blind_idx DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS facebook_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_facebook_id_not_null
    ON users (facebook_id)
    WHERE facebook_id IS NOT NULL;
