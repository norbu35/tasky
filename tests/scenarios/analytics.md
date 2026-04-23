# analytics Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-ANALYTICS-001

**Risk:** Medium
**PRD:** REQ-P1-KPI-04
**Title:** Task posted event is emitted when a customer creates a task

Given a customer creates a task
When the task is persisted
Then a TASK_POSTED analytics event is emitted with category_id, task_id, locale, and platform

## SCN-ANALYTICS-002

**Risk:** Medium
**PRD:** REQ-P1-KPI-04
**Title:** Booking confirmed event is emitted when an application is accepted

Given a customer accepts a tasker application
When the booking is confirmed
Then a BOOKING_CONFIRMED analytics event is emitted

## SCN-ANALYTICS-003

**Risk:** Medium
**PRD:** REQ-P1-KPI-04
**Title:** Booking completed event is emitted when a booking transitions to COMPLETED

Given a booking is in ASSIGNED status
When the booking transitions to COMPLETED
Then a BOOKING_COMPLETED analytics event is emitted

## SCN-ANALYTICS-004

**Risk:** Medium
**PRD:** REQ-P1-KPI-04
**Title:** Qualified application submitted event is emitted when a verified tasker applies

Given a verified tasker submits an application to an eligible task
When the application is persisted
Then a QUALIFIED_APPLICATION analytics event is emitted with task_id, tasker_id, category_id, and pricing mode

## SCN-ANALYTICS-005

**Risk:** Medium
**PRD:** REQ-P1-KPI-04
**Title:** Intervention recorded event is emitted when assisted distribution or manual rescue is used

Given an eligible task has received no qualified application within 8 hours and external distribution is triggered
Or an operator performs manual task-specific rescue
When the intervention is recorded
Then an INTERVENTION_RECORDED analytics event is emitted with task_id, intervention_type, and intervention_stage
