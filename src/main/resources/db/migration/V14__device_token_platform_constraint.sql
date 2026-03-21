-- Enforce valid platform values on device_tokens.
-- The column was created as unconstrained TEXT; this migration aligns it
-- with the documented enum (IOS, ANDROID, WEB).
ALTER TABLE device_tokens
    ADD CONSTRAINT chk_device_tokens_platform
        CHECK (platform IN ('IOS', 'ANDROID', 'WEB'));
