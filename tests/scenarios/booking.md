# booking Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-BOOK-001

**Risk:** Critical
**PRD:** REQ-P1-BOOK-14
**Title:** Customer cancels more than 4 hours before schedule - no incident and no fee

Given a booking is in ASSIGNED status
And the current confirmed schedule is more than 4 hours in the future
When the customer cancels the booking
Then the booking status becomes CANCELLED
And no cancellation fee is recorded
And no reliability incident is recorded

## SCN-BOOK-002

**Risk:** Critical
**PRD:** REQ-P1-BOOK-15
**Title:** Customer cancels less than 4 hours before schedule - reliability incident recorded and no fee

Given a booking is in ASSIGNED status
And the current confirmed schedule is less than 4 hours in the future
When the customer cancels the booking
Then the booking status becomes CANCELLED
And no cancellation fee is recorded
And a customer late-cancel reliability incident is recorded

## SCN-BOOK-003

**Risk:** Critical
**PRD:** REQ-P1-BOOK-15
**Title:** Customer cancels exactly 4 hours before schedule - treated as late

Given a booking is in ASSIGNED status
And the current confirmed schedule is exactly 4 hours in the future
When the customer cancels the booking
Then the booking status becomes CANCELLED
And a customer late-cancel reliability incident is recorded

## SCN-BOOK-004

**Risk:** Critical
**PRD:** REQ-P1-BOOK-15
**Title:** Late-cancel enforcement escalates from warning-only on first occurrence to "Low Customer Reliability" flag on second occurrence in 28 days

Given a customer records a first late cancellation within a trailing 28-day window
And that same customer records a second late cancellation within the same trailing 28-day window
When the two incidents are evaluated for enforcement
Then the first occurrence results in a reliability incident warning
And the second occurrence flags future tasks with "Low Customer Reliability" visible to applicants

## SCN-BOOK-005

**Risk:** Critical
**PRD:** REQ-P1-BOOK-16
**Title:** Tasker cancellation reopens the linked task to OPEN

Given a booking is in ASSIGNED status
And the linked task is in ASSIGNED status
When the tasker cancels the booking
Then the booking status becomes CANCELLED
And the linked task status becomes OPEN
And no cancellation fee is recorded

## SCN-BOOK-006

**Risk:** Critical
**PRD:** REQ-P1-BOOK-17
**Title:** Third tasker cancellation without safety override in a rolling 30 days suspends the tasker for 7 days

Given a tasker already has 2 booking cancellations in the trailing 30 days
When that tasker cancels another booking
Then the tasker records a third cancellation in the rolling 30-day window
And the tasker account is suspended for 7 days

## SCN-BOOK-021

**Risk:** Critical
**PRD:** REQ-P1-BOOK-18
**Title:** Tasker cancellation with Safety/Fraud reason bypasses automated strike and opens Trust and Safety ticket

Given a booking is in ASSIGNED status
When the tasker cancels the booking with "Safety/Fraud" as the reason
Then no moderation strike is incurred
And a Trust & Safety investigation ticket is immediately opened

## SCN-BOOK-007

**Risk:** Critical
**PRD:** REQ-P1-BOOK-05
**Title:** Booking confirmation without liability disclaimer acceptance is rejected

Given a customer is confirming a selected applicant
When the booking confirmation request omits liability disclaimer acceptance
Then the booking is not finalized
And the request is rejected

## SCN-BOOK-008

**Risk:** Critical
**PRD:** REQ-P1-BOOK-06
**Title:** Liability disclaimer acceptance timestamp is recorded on the booking

Given a customer confirms a selected applicant with liability disclaimer acceptance
When the booking is finalized
Then the booking stores liability_disclaimer_accepted as true
And the booking stores the disclaimer acceptance timestamp

## SCN-BOOK-009

**Risk:** Critical
**PRD:** REQ-P1-BOOK-13
**Title:** Terminal booking states reject invalid transitions with INVALID_TRANSITION

Given one booking is in COMPLETED status
And one booking is in CANCELLED status
And one booking is in NO_SHOW status
When an invalid follow-up transition is attempted from those terminal states
Then the request is rejected with INVALID_TRANSITION
And the terminal booking statuses do not change

## SCN-BOOK-010

**Risk:** Critical
**PRD:** REQ-P1-BOOK-19
**Title:** Scheduled start plus 30 minutes sends no-show reminder to both parties

Given a booking remains ASSIGNED at 30 minutes after the current confirmed schedule
When the no-show reminder job runs
Then the customer receives a no-show reminder notification
And the tasker receives a no-show reminder notification
And a NO_SHOW_REMINDER_SENT timeline event is recorded

## SCN-BOOK-011

**Risk:** Critical
**PRD:** REQ-P1-BOOK-20
**Title:** No-show flag before 1 hour after schedule returns TOO_EARLY

Given a booking remains ASSIGNED
And fewer than 1 hour has passed since the current confirmed schedule
When either participant tries to flag the booking as NO_SHOW
Then the request is rejected
And the error code is TOO_EARLY

## SCN-BOOK-012

**Risk:** Critical
**PRD:** REQ-P1-BOOK-21
**Title:** Recent in-app activity within 30 minutes blocks no-show flag

Given a booking remains ASSIGNED
And at least 1 hour has passed since the current confirmed schedule
And either participant has posted an in-app status update, check-in, or message within the last 30 minutes
When the counterparty tries to flag the booking as NO_SHOW
Then the request is rejected
And the error code is ACTIVITY_DETECTED

## SCN-BOOK-013

**Risk:** Critical
**PRD:** REQ-P1-BOOK-22
**Title:** Accepted future reschedule supersedes no-show adjudication on the original schedule

Given a booking was originally confirmed for one schedule
And an in-app reschedule request for a future datetime has been accepted
When either participant tries to flag NO_SHOW based on the original schedule
Then the request is rejected
And the error code is RESCHEDULE_SUPERSEDES

## SCN-BOOK-014

**Risk:** Critical
**PRD:** REQ-P1-BOOK-23
**Title:** Valid no-show flag transitions booking and task to NO_SHOW and records audit history

Given a booking remains ASSIGNED
And at least 1 hour has passed since the current confirmed schedule
And neither participant has recent in-app activity in the prior 30 minutes
And no accepted in-app reschedule supersedes the current schedule
When a participant validly flags the booking as NO_SHOW
Then the booking status becomes NO_SHOW
And the linked task status becomes NO_SHOW
And immutable timeline and audit events are recorded for the NO_SHOW decision

## SCN-BOOK-015

**Risk:** Critical
**PRD:** REQ-P1-BOOK-24
**Title:** Repeated no-shows within 28 days create a strike-review case

Given the same participant has already recorded 1 validated no-show in the trailing 28 days
When another validated no-show is recorded against that participant within the same 28-day window
Then a strike-review case is created

## SCN-BOOK-016

**Risk:** Critical
**PRD:** REQ-P1-BOOK-23
**Title:** Repeating the no-show flag on an already NO_SHOW booking is idempotent

Given a booking has already been finalized as NO_SHOW
When a duplicate or replayed no-show flag request is submitted for that booking
Then the response returns the existing NO_SHOW booking state
And no second terminal transition is applied

## SCN-BOOK-017

**Risk:** Critical
**PRD:** REQ-P1-BOOK-10
**Title:** Reschedule request in ASSIGNED creates a REQUESTED event with proposed datetime and optional reason

Given a booking is in ASSIGNED status
When either participant submits an in-app reschedule request with a future proposed datetime and an optional reason
Then a REQUESTED schedule event is created for that booking
And the proposed datetime is stored on the schedule event

## SCN-BOOK-018

**Risk:** Critical
**PRD:** REQ-P1-BOOK-11
**Title:** Accepted reschedule updates the canonical schedule and resets policy timers

Given a booking is in ASSIGNED status
And there is a pending in-app reschedule request
When the counterparty accepts the reschedule request
Then the booking remains ASSIGNED
And the canonical confirmed schedule is updated to the accepted datetime
And late-cancel and no-show timers reset to the accepted datetime

## SCN-BOOK-019

**Risk:** Critical
**PRD:** REQ-P1-BOOK-12
**Title:** Declined or expired reschedule request preserves the original schedule

Given a booking is in ASSIGNED status
And there is a pending in-app reschedule request
When the counterparty declines the request or the request expires before acceptance
Then the original confirmed schedule remains active
And no-show and late-cancel timers continue to use the original confirmed schedule

## SCN-BOOK-020

**Risk:** Critical
**PRD:** REQ-P1-BOOK-09, REQ-P1-BOOK-10
**Title:** Only the latest mutually accepted in-app schedule changes policy timers and the reschedule lifecycle remains audit-immutable

Given a booking has an original confirmed schedule
And chat messages discuss a different time without an accepted in-app reschedule
And the booking also has in-app reschedule request, accept, decline, and expiry actions recorded
When late-cancel or no-show timers are evaluated and the booking history is retrieved
Then policy timers use only the latest mutually accepted in-app schedule
And chat-only schedule mentions do not change timer calculations
And reschedule request, accept, decline, and expiry actions are returned as immutable booking timeline events

## SCN-BOOK-022

**Risk:** Critical
**PRD:** REQ-P1-BOOK-01, REQ-P1-MATCH-04
**Title:** Customer selects one applicant and selected tasker acceptance confirms booking

Given a task has multiple qualified applications in OPEN status
When the customer selects exactly one applicant
Then the selected application enters pending acceptance state
And no booking is confirmed yet
And when the selected tasker accepts within the active acceptance window
Then the booking is created in ASSIGNED status
And the booking record references the selected application

## SCN-BOOK-023

**Risk:** Critical
**PRD:** REQ-P1-BOOK-02, REQ-P1-BOOK-03
**Title:** Selected tasker does not accept within 4 hours and pending selection expires

Given a customer has selected an applicant for a task
And the selected tasker has not accepted within 4 hours of selection
When the acceptance window expires
Then the pending selection expires without confirming the booking
And the task returns to selectable-applicant state
And the customer may select a different applicant

## SCN-BOOK-024

**Risk:** Critical
**PRD:** REQ-P1-BOOK-04
**Title:** Non-selected applications close automatically once one tasker is confirmed

Given a task has multiple applications
And one applicant has been selected and accepted within the window
When the booking becomes confirmed
Then all other non-selected applications are automatically closed
And the closed applicants are notified that the task has been filled

## SCN-BOOK-025

**Risk:** Critical
**PRD:** REQ-P1-PRICE-07
**Title:** Booking price is locked at confirmed booking

Given a customer selected a tasker with a pricing response of either accepted budget or quoted price
When the tasker accepts and the booking becomes confirmed
Then the booking record stores the locked booking price
And subsequent price changes are not allowed on the confirmed booking

## SCN-BOOK-026

**Risk:** Critical
**PRD:** REQ-P1-BOOK-25
**Title:** Tasker marks complete and customer confirms completion

Given a booking is in ASSIGNED status and the scheduled service has been performed
When the tasker marks the booking as complete
Then the booking transitions to a customer-confirmation-pending state
And the customer is notified to confirm or dispute the completion
And the customer confirms the completion
Then the booking transitions to COMPLETED

## SCN-BOOK-027

**Risk:** High
**PRD:** REQ-P1-BOOK-26
**Title:** Customer silence after tasker-marked complete triggers timeout auto-complete

Given a booking is in customer-confirmation-pending state after the tasker marked it complete
When the customer does not respond within the configured timeout after reminder attempts
Then the booking auto-completes via the timeout path
And the booking transitions to COMPLETED
And the completion is recorded as auto-completed rather than customer-confirmed

## SCN-BOOK-028

**Risk:** High
**PRD:** REQ-P1-BOOK-27
**Title:** Ops can resolve stalled or contested completion before finalization

Given a booking is in customer-confirmation-pending state
And the normal completion flow stalls or becomes contested
When an admin reviews the completion edge case
Then the admin can record the resolution decision before final booking finalization
And the decision leaves an audit trail tied to the booking

## SCN-BOOK-029

**Risk:** High
**PRD:** REQ-P1-BOOK-28
**Title:** Completion or complaint evidence artifacts can be attached when required

Given a completion dispute or complaint requires supporting evidence
When a participant or admin attaches an evidence artifact
Then the artifact is associated with the booking or completion case
And the artifact is available to authorized admin review surfaces

## SCN-BOOK-030

**Risk:** High
**PRD:** REQ-P1-PRICE-08
**Title:** Pricing state changes are auditable from application through booking lock

Given a task receives applications and one applicant is selected
When application pricing, selection, acceptance, and booking lock events are recorded
Then each price-relevant state change has an immutable audit event
And the final locked booking price can be traced back to the accepted budget or quote response

## SCN-BOOK-031

**Risk:** Critical
**PRD:** REQ-P1-BOOK-03
**Title:** Selected tasker explicitly declines and task returns to selectable applicants

Given a customer has selected an applicant for a task
And the pending selection is still within the active acceptance window
When the selected tasker declines the booking request
Then no booking is confirmed
And the pending selection closes as declined
And the task returns to selectable-applicant state
And the customer may select a different applicant

## SCN-BOOK-032

**Risk:** High
**PRD:** REQ-P1-BOOK-29, REQ-P1-PRICE-07, NFR-LEGAL-03
**Title:** Booking confirmation explains locked price baseline and post-confirmation scope changes

Given a customer is confirming a selected tasker
When the booking confirmation surface is shown
Then the locked booking price and intake scope are presented as the baseline agreement
And the copy explains that material, supply, or scope changes after confirmation must be agreed between the parties
And the copy instructs participants to keep those agreements in platform-mediated chat or support evidence
And the copy does not promise automatic price adjustment, payment hold, or payment protection
