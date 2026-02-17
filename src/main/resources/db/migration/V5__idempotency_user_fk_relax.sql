-- V5__idempotency_user_fk_relax.sql
-- Idempotency supports actor identities (e.g., admin/service principals) that may not exist in users table.

ALTER TABLE idempotency_keys
    DROP CONSTRAINT IF EXISTS idempotency_keys_user_id_fkey;
