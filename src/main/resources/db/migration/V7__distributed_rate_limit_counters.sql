CREATE TABLE IF NOT EXISTS rate_limit_counters
(
    rate_key      VARCHAR(255) PRIMARY KEY,
    window_start  TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER     NOT NULL CHECK (attempt_count >= 0),
    expires_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at
    ON rate_limit_counters (expires_at);
