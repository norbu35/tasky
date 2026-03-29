-- V17__instant_match_revocation.sql
-- Adds a self-expiring Instant Match revocation flag to user profiles.
-- NULL = unrestricted. Future timestamp = blocked until that point.
ALTER TABLE profiles
    ADD COLUMN instant_match_revoked_until TIMESTAMPTZ NULL;
