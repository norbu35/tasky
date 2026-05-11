-- Persist revoked token JTIs so revocations survive application restarts.
-- Rows are pruned automatically once their expires_at passes.
CREATE TABLE IF NOT EXISTS token_blacklist (
    jti         text PRIMARY KEY,
    revoked_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist (expires_at);
