-- V28__users_status_allow_deleted.sql
-- Add DELETED to the users.status CHECK constraint.
-- Runtime code (ModerationService.requestAccountDeletion, JwtAuthenticationFilter, ChannelInterceptorConfig,
-- AuthService) already writes and checks for DELETED status. This migration brings the schema constraint
-- in line with the runtime security model.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('PENDING', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'BANNED', 'DELETED'));
