# security Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-SEC-001

**Risk:** Critical
**PRD:** REQ-P1-AUTH-01
**Title:** Protected endpoints reject requests without a bearer JWT

Given an endpoint requires authentication
When a request is sent without a bearer access token
Then the response status is 401
And the request is not authorized

## SCN-SEC-002

**Risk:** Critical
**PRD:** REQ-P1-AUTH-01
**Title:** CUSTOMER role cannot access tasker-only or admin-only routes

Given a valid CUSTOMER session token
When the client calls a tasker-only route or an admin-only route
Then the response status is 403
And the customer is not granted access to that route

## SCN-SEC-003

**Risk:** Critical
**PRD:** REQ-P1-AUTH-01
**Title:** TASKER role cannot access customer-only or admin-only routes

Given a valid TASKER session token
When the client calls a customer-only route or an admin-only route
Then the response status is 403
And the tasker is not granted access to that route

## SCN-SEC-004

**Risk:** Critical
**PRD:** REQ-P1-AUTH-01
**Title:** ADMIN-only routes are accessible to ADMIN and forbidden to non-admin roles

Given an admin-only endpoint exists
When the endpoint is called with ADMIN, CUSTOMER, and TASKER session tokens
Then the ADMIN request is authorized
And the CUSTOMER request is rejected with 403
And the TASKER request is rejected with 403

## SCN-SEC-005

**Risk:** Critical
**PRD:** REQ-P1-TASK-01
**Title:** Task creation endpoint allows CUSTOMER and rejects TASKER or ADMIN at the security layer

Given POST /tasks is a customer-only operation
When the endpoint is called with CUSTOMER, TASKER, and ADMIN session tokens
Then the CUSTOMER request passes security authorization
And the TASKER request is rejected with 403
And the ADMIN request is rejected with 403

## SCN-SEC-006

**Risk:** Critical
**PRD:** REQ-P1-TASK-09
**Title:** Open-task visibility exposes only approximate location before booking confirmation

Given a task is still visible as OPEN to non-participants
When the task appears in the public feed or is fetched by a non-owner non-booked user
Then the response includes only approximate or fuzzed location fields
And the response does not include exact address text or exact coordinates

## SCN-SEC-007

**Risk:** Critical
**PRD:** REQ-P1-TASK-10, REQ-P1-BOOK-07
**Title:** Exact task address is revealed only to the owner or booked tasker after booking confirmation

Given a task has an associated booking that is confirmed for a selected tasker
When the task detail is fetched by the task owner or the booked tasker
Then the response includes the exact address fields
And other authorized users do not receive those exact address fields

## SCN-SEC-008

**Risk:** Critical
**PRD:** REQ-P1-MSG-04, REQ-P1-BOOK-08
**Title:** Customer-facing payloads never expose tasker phone fields

Given a customer views tasker-related profile, booking, chat, or receipt payloads
When the response payload is returned to that customer
Then no tasker phone field is present anywhere in the customer-facing payload

## SCN-SEC-011

**Risk:** Critical
**PRD:** REQ-P1-MSG-04, REQ-P1-BOOK-08, REQ-P1-SAFE-18
**Title:** Customer phone is not exposed in tasker-facing payloads in Phase 1

Given the product is in Phase 1 with no contact-unlock mechanism
When a tasker views booking details, task details, or messaging surfaces
Then no customer phone field is present in the tasker-facing payload
And raw direct contact details remain unavailable through any Phase 1 API surface

## SCN-SEC-012

**Risk:** Critical
**PRD:** REQ-P1-AUTH-05
**Title:** Logout endpoint revokes the current access token

Given a customer has a valid active access token
When the customer logs out
Then the current access token is revoked
And later requests with the same token are rejected

## SCN-SEC-013

**Risk:** Critical
**PRD:** REQ-P1-AUTH-05
**Title:** DELETED user is rejected with 403

Given a bearer token identifies a deleted user account
When the user calls a protected product endpoint
Then the response status is 403
And the account is not granted access

## SCN-SEC-014

**Risk:** High
**PRD:** REQ-P1-SAFE-17
**Title:** Trust-sensitive actions and evidence access are audit-queryable

Given verification decisions, review enforcement actions, complaint handling, dispute handling, and admin evidence access occur
When an authorized audit query is run for the affected user or booking
Then each action is returned with actor, timestamp, action type, and target record
And admin evidence access is included in the audit history
