# integration Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-SMOKE-001

**Risk:** High
**PRD:** REQ-P1-AUTH-02, REQ-P1-AUTH-03
**Title:** Facebook OAuth outage fails closed and existing session survives end-to-end

Given a user has an authenticated session
And Facebook OAuth is unavailable
When the user calls a protected endpoint with the existing session
Then the endpoint responds with 2xx
And a new Facebook login attempt returns 503 AUTH_PROVIDER_UNAVAILABLE

## SCN-SMOKE-002

**Risk:** High
**PRD:** REQ-P1-BOOK-16
**Title:** Tasker cancellation reopens the linked task end-to-end against real database

Given a customer has posted a task and a booking exists in ASSIGNED status
When the tasker cancels the booking
Then the booking status is CANCELLED in the database
And the linked task status is OPEN in the database

## SCN-SMOKE-003

**Risk:** High
**PRD:** REQ-P1-TASK-01, REQ-P1-TASK-10
**Title:** Task creation and retrieval end-to-end against real database

Given a customer is authenticated
When the customer creates a task with valid fields
Then the task is stored with status OPEN
And the task owner retrieves exact location in the task detail response

## SCN-SMOKE-004

**Risk:** High
**PRD:** REQ-P1-TASK-09
**Title:** Non-participant task detail exposes only approximate location against real database

Given a task exists in OPEN status
When a non-participant tasker requests the task detail
Then only approximate location fields are returned
And exact address text is not present

## SCN-SMOKE-005

**Risk:** High
**PRD:** NFR-API-02
**Title:** All protected endpoint error responses include code, message, and trace_id fields

Given the API is running
When any protected endpoint is called without authentication or with insufficient role
Then the response body contains code, message, and trace_id fields
