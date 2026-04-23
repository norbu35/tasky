# review Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-REVIEW-001

**Risk:** High
**PRD:** REQ-P1-SAFE-06, REQ-P1-SAFE-10, REQ-P1-SAFE-11
**Title:** Booking completion creates structured review prompts for both customer and tasker

Given a booking transitions to COMPLETED
When review enforcement is created for that booking
Then the customer receives a structured review prompt
And the tasker receives a structured review prompt

## SCN-REVIEW-002

**Risk:** High
**PRD:** REQ-P1-SAFE-09
**Title:** Immediate review prompt is sent at completion time

Given a booking has just transitioned to COMPLETED
When the completion workflow finishes
Then the review prompt is sent immediately

## SCN-REVIEW-003

**Risk:** High
**PRD:** REQ-P1-SAFE-09
**Title:** Open review case at 24 hours sends the first reminder

Given a participant still has an open review enforcement case 24 hours after booking completion
When review reminders are processed
Then the participant receives the 24-hour review reminder
And the enforcement case advances to the 24-hour reminder state

## SCN-REVIEW-004

**Risk:** High
**PRD:** REQ-P1-SAFE-09
**Title:** Open review case at 72 hours sends the final reminder

Given a participant still has an open review enforcement case 72 hours after booking completion
When review reminders are processed
Then the participant receives the 72-hour review reminder
And the enforcement case advances to the 72-hour reminder state

## SCN-REVIEW-005

**Risk:** High
**PRD:** REQ-P1-SAFE-07
**Title:** Hard lock is enforced when any open review enforcement case exists

Given a user has an open review enforcement case
When lock eligibility is evaluated
Then a hard lock is applied to the user's next posting or application action

## SCN-REVIEW-006

**Risk:** High
**PRD:** REQ-P1-SAFE-08
**Title:** Hard lock is lifted when the owed review is submitted and the case is resolved

Given a user has an open review enforcement case
And the user submits their owed review
When lock eligibility is evaluated
Then no hard lock is applied
