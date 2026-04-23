# verification Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-VERIF-001

**Risk:** High
**PRD:** REQ-P1-SAFE-01
**Title:** User requests tasker role activation before verification

Given an authenticated user with role CUSTOMER
When the user requests tasker role activation
Then the user role is updated to reflect tasker-role request
And the user remains verification-gated and cannot apply to tasks until approved

## SCN-VERIF-002

**Risk:** High
**PRD:** REQ-P1-SAFE-02
**Title:** New tasker remains pending until admin manual verification is completed

Given a user has requested tasker role activation
When the verification submission is recorded
Then the tasker status is PENDING
And the tasker cannot apply to tasks
And the tasker remains pending until an admin explicitly approves or rejects the verification

## SCN-VERIF-003

**Risk:** High
**PRD:** REQ-P1-SAFE-05
**Title:** Verification consent, decision, and state changes are auditable

Given a tasker has submitted verification documents with explicit consent
When the admin approves or rejects the verification
Then the verification consent with policy version and timestamp is recorded
And the verification decision with timestamp and deciding admin is recorded
And all verification state transitions are queryable for audit

## SCN-VERIF-004

**Risk:** High
**PRD:** REQ-P1-ADMIN-01
**Title:** Admin reviews pending verifications and approves or rejects

Given one or more taskers have pending verification submissions
When an admin reviews a pending verification
Then the admin can approve the verification and the tasker status becomes VERIFIED
Or the admin can reject the verification and the tasker is informed of the rejection reason

## SCN-VERIF-005

**Risk:** Medium
**PRD:** REQ-P1-ADMIN-10
**Title:** Verification queue exposes queue age and SLA posture for operational review

Given there are pending verification submissions in the queue
When an admin views the verification queue
Then the queue shows the age of each pending submission
And the queue exposes SLA posture metrics for operational review
