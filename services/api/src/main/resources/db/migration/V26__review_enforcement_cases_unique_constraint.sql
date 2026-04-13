-- V26__review_enforcement_cases_unique_constraint.sql
-- Prevent duplicate enforcement cases per booking+user under concurrent retry.
-- The insert in ReviewEnforcementService.createCasesForBooking uses a
-- read-then-insert pattern; the unique constraint guarantees safety even
-- when two overlapping IN_PROGRESS retries race.

CREATE UNIQUE INDEX IF NOT EXISTS uq_review_enforcement_booking_user
    ON review_enforcement_cases (booking_id, user_id);
