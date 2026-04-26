# assistance Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-ASSIST-001

**Risk:** High
**PRD:** REQ-P1-ASSIST-01
**Title:** Task outcome is classified as self-serve when no intervention occurred

Given an eligible task was posted through the native platform flow
And the task received at least one qualified application within the native matching window
And a booking was confirmed and completed without any external distribution or manual rescue
When the task outcome is classified
Then the outcome is recorded as self-serve
And the task is included in self-serve fulfillment reporting

## SCN-ASSIST-002

**Risk:** High
**PRD:** REQ-P1-ASSIST-01
**Title:** Task outcome is classified as system-assisted when external distribution was used

Given an eligible task had no qualified application within 8 hours of posting
And task-level external distribution was triggered for the task
When the task outcome is classified
Then the outcome is recorded as system-assisted
And the task is excluded from self-serve fulfillment reporting

## SCN-ASSIST-003

**Risk:** High
**PRD:** REQ-P1-ASSIST-01
**Title:** Task outcome is classified as manual-assisted when operator performed rescue

Given an operator performed task-specific manual rescue for an eligible task
When the task outcome is classified
Then the outcome is recorded as manual-assisted
And the task is excluded from self-serve fulfillment reporting

## SCN-ASSIST-004

**Risk:** High
**PRD:** REQ-P1-ASSIST-03
**Title:** External distribution triggers only after 8 hours without qualified application

Given an eligible task has been posted for fewer than 8 hours
When the assistance evaluation runs
Then external distribution is not triggered for that task
And after 8 hours with no qualified application
Then external distribution may be triggered for eligible categories

## SCN-ASSIST-005

**Risk:** High
**PRD:** REQ-P1-ASSIST-04
**Title:** External distribution is limited to admin-eligible categories

Given an eligible task exists in an active category that is not marked eligible for external distribution in admin launch controls
When the assistance evaluation runs at 8 hours with no qualified application
Then external distribution is not triggered for that task

## SCN-ASSIST-006

**Risk:** High
**PRD:** REQ-P1-ASSIST-05
**Title:** External distribution payloads do not expose exact address, raw contacts, or unsupported trust claims

Given external distribution is being prepared for an eligible task
When the distribution payload is assembled
Then the payload does not include exact address or precise coordinates
And the payload does not include raw contact details for customer or tasker
And the payload does not include claims about payment protection, escrow, or wallet guarantees

## SCN-ASSIST-007

**Risk:** High
**PRD:** REQ-P1-ASSIST-06
**Title:** Tasks advanced through external distribution are excluded from self-serve fulfillment reporting

Given a task was advanced through external distribution
And the task eventually reached a completed booking
When fulfillment reporting is computed
Then the task outcome is not counted toward self-serve fulfillment rate
And the task outcome is counted separately in assisted outcome reporting

## SCN-ASSIST-008

**Risk:** High
**PRD:** REQ-P1-ASSIST-07
**Title:** Manual task-specific rescue is recorded as intervention

Given an operator performs task-specific rescue to advance a stalled task
When the rescue action is recorded
Then the rescue is stored as an intervention with intervention_type and intervention_stage
And the intervention record is auditable and separately measurable from self-serve activity

## SCN-ASSIST-009

**Risk:** High
**PRD:** REQ-P1-ASSIST-02
**Title:** External distribution is not triggered by default on eligible task creation

Given an eligible task is newly posted
When the native matching window starts
Then external distribution remains inactive
And the task stays in the native marketplace flow until assisted-distribution criteria are met

## SCN-ASSIST-010

**Risk:** High
**PRD:** REQ-P1-ASSIST-08
**Title:** General marketing is not classified as task-level intervention

Given an operator sends general marketing or broad supply-seeding communication
When intervention reporting is computed
Then no task-level intervention is recorded for a specific task
And self-serve outcome classification is not changed by the general marketing activity
