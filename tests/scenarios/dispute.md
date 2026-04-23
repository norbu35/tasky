# dispute Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-DISPUTE-001

**Risk:** High
**PRD:** REQ-P1-SAFE-14
**Title:** Either participant can open a dispute while the booking is ASSIGNED

Given a booking is in ASSIGNED status
And the requester is a participant in that booking
When the requester submits a dispute
Then the dispute is created
And the dispute status is OPEN

## SCN-DISPUTE-002

**Risk:** High
**PRD:** REQ-P1-SAFE-14
**Title:** Either participant can open a dispute within 24 hours after booking completion

Given a booking is in COMPLETED status
And less than 24 hours have passed since completion
When a booking participant submits a dispute
Then the dispute is created

## SCN-DISPUTE-003

**Risk:** High
**PRD:** REQ-P1-SAFE-14
**Title:** Completed-booking dispute after 24 hours is rejected

Given a booking is in COMPLETED status
And more than 24 hours have passed since completion
When a booking participant submits a dispute
Then the dispute is not created
And the response explains that the dispute window has expired

## SCN-DISPUTE-004

**Risk:** High
**PRD:** REQ-P1-SAFE-14
**Title:** Dispute creation outside ASSIGNED or COMPLETED booking states is rejected

Given a booking is in a state other than ASSIGNED or COMPLETED
When a participant attempts to open a dispute for that booking
Then the dispute is not created
And the response explains that disputes are allowed only from ASSIGNED or recent COMPLETED bookings

## SCN-DISPUTE-005

**Risk:** High
**PRD:** REQ-P1-SAFE-15
**Title:** Dispute submission requires at least one evidence artifact

Given a booking is eligible for dispute intake
When a participant submits a dispute without any evidence artifact
Then the dispute intake does not satisfy evidence minimum requirements
And the response identifies evidence as required

## SCN-DISPUTE-006

**Risk:** High
**PRD:** REQ-P1-SAFE-15
**Title:** Missing evidence after reminder and 24-hour grace auto-closes the dispute as INSUFFICIENT_EVIDENCE

Given a dispute was opened without the required evidence set
And the evidence reminder has already been sent
And 24 hours have elapsed since that reminder
When stale disputes are evaluated
Then the dispute status becomes INSUFFICIENT_EVIDENCE
And the dispute is closed automatically

## SCN-DISPUTE-007

**Risk:** High
**PRD:** REQ-P1-SAFE-15
**Title:** Evidence added during the grace window prevents insufficient-evidence auto-close

Given a dispute is in its evidence grace window after reminder
When the requester adds at least one valid evidence artifact before the 24-hour deadline
Then the dispute remains open for review
And the insufficient-evidence auto-close path is not applied

## SCN-DISPUTE-008

**Risk:** High
**PRD:** REQ-P1-SAFE-16
**Title:** Phase 1 dispute resolution is limited to evidence-only outcomes and admin misconduct notes

Given an admin is resolving a dispute in Phase 1
When the admin records the resolution
Then the available resolution actions are limited to evidence-based mediation outcomes
And any wrongful-party finding is stored as an internal admin-only misconduct note
And no platform refund, compensation, or credit is issued by the dispute flow
