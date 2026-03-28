# security Scenarios
<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-SEC-001
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** Protected endpoints reject requests without a bearer JWT

Given an endpoint requires authentication
When a request is sent without a bearer access token
Then the response status is 401
And the request is not authorized

## SCN-SEC-002
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** CUSTOMER role cannot access tasker-only or admin-only routes

Given a valid CUSTOMER session token
When the client calls a tasker-only route or an admin-only route
Then the response status is 403
And the customer is not granted access to that route

## SCN-SEC-003
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** TASKER role cannot access customer-only or admin-only routes

Given a valid TASKER session token
When the client calls a customer-only route or an admin-only route
Then the response status is 403
And the tasker is not granted access to that route

## SCN-SEC-004
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** ADMIN-only routes are accessible to ADMIN and forbidden to non-admin roles

Given an admin-only endpoint exists
When the endpoint is called with ADMIN, CUSTOMER, and TASKER session tokens
Then the ADMIN request is authorized
And the CUSTOMER request is rejected with 403
And the TASKER request is rejected with 403

## SCN-SEC-005
**Risk:** Critical
**PRD:** REQ-TASK-01
**Title:** Task creation endpoint allows CUSTOMER and rejects TASKER or ADMIN at the security layer

Given POST /tasks is a customer-only operation
When the endpoint is called with CUSTOMER, TASKER, and ADMIN session tokens
Then the CUSTOMER request passes security authorization
And the TASKER request is rejected with 403
And the ADMIN request is rejected with 403

## SCN-SEC-006
**Risk:** Critical
**PRD:** REQ-TASK-03
**Title:** Open-task visibility exposes only approximate location before booking confirmation

Given a task is still visible as OPEN to non-participants
When the task appears in the public feed or is fetched by a non-owner non-booked user
Then the response includes only approximate or fuzzed location fields
And the response does not include exact address text or exact coordinates

## SCN-SEC-007
**Risk:** Critical
**PRD:** REQ-LEAK-03
**Title:** Exact task address is revealed only to the owner or booked tasker after booking confirmation

Given a task has an associated booking that is confirmed for a selected tasker
When the task detail is fetched by the task owner or the booked tasker
Then the response includes the exact address fields
And other authorized users do not receive those exact address fields

## SCN-SEC-008
**Risk:** Critical
**PRD:** REQ-LEAK-01
**Title:** Customer-facing payloads never expose tasker phone fields

Given a customer views tasker-related profile, booking, chat, or receipt payloads
When the response payload is returned to that customer
Then no tasker phone field is present anywhere in the customer-facing payload

## SCN-SEC-009
**Risk:** Critical
**PRD:** REQ-LEAK-02
**Title:** Customer phone remains masked until lead unlock or payment commitment succeeds

Given a selected tasker can read customer contact details only after the required commitment step for the current phase
When customer contact is fetched before lead unlock or payment commitment succeeds
Then the customer phone is returned only in masked form or remains locked
And the full customer phone is not revealed

## SCN-SEC-010
**Risk:** Critical
**PRD:** REQ-LEAK-03
**Title:** Exact-address fetch before the required unlock state is denied with ADDRESS_LOCKED

Given the current phase requires an unlock or payment commitment before exact address reveal
And that unlock state has not been reached for the caller
When the caller attempts to fetch the exact task address
Then the response status is 403
And the error code is ADDRESS_LOCKED
