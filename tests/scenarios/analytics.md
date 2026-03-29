# analytics Scenarios
<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-ANALYTICS-001
**Risk:** Medium
**PRD:** REQ-SAFE-06
**Title:** Task posted event is emitted when a customer creates a task

Given a customer creates a task
When the task is persisted
Then a TASK_POSTED analytics event is emitted with category_id, task_id, locale, and platform

## SCN-ANALYTICS-002
**Risk:** Medium
**PRD:** REQ-SAFE-06
**Title:** Booking confirmed event is emitted when an application is accepted

Given a customer accepts a tasker application
When the booking is confirmed
Then a BOOKING_CONFIRMED analytics event is emitted

## SCN-ANALYTICS-003
**Risk:** Medium
**PRD:** REQ-SAFE-06
**Title:** Booking completed event is emitted when a booking transitions to COMPLETED

Given a booking is in ASSIGNED status
When the booking transitions to COMPLETED
Then a BOOKING_COMPLETED analytics event is emitted
