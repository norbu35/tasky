# task Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-TASK-001

**Risk:** High
**PRD:** REQ-P1-CAT-01
**Title:** Task-post form loads the active intake schema for the selected category

Given a category is active and has an active intake schema version
When a customer opens task posting for that category
Then the task-post payload includes the active schema structure for that category
And the schema served to the client identifies the active version

## SCN-TASK-002

**Risk:** High
**PRD:** REQ-P1-TASK-15
**Title:** Task submit with missing required intake answers fails with field-level validation errors

Given a category has an active intake schema with required fixed-choice questions
When a customer submits a task without one or more required intake answers
Then the task is not created
And the response identifies each missing required intake field

## SCN-TASK-003

**Risk:** High
**PRD:** REQ-P1-TASK-01
**Title:** Task creation without required base fields returns field-specific validation errors

Given a customer is creating a task
When the request omits category, description, location, schedule, or budget
Then the task is not created
And the response includes field-specific validation errors for each missing required field

## SCN-TASK-004

**Risk:** High
**PRD:** REQ-P1-PRICE-01
**Title:** Budget below 20000 MNT is rejected

Given a customer submits a task with all other required fields present
When the budget is below 20000 MNT
Then the task is not created
And the response identifies budget as below the allowed minimum

## SCN-TASK-005

**Risk:** High
**PRD:** REQ-P1-PRICE-01, REQ-P1-TASK-02
**Title:** Budget of 20000 MNT is accepted, 19999 is rejected

Given a customer submits a task with all required fields present
When the budget is 20000 MNT
Then the task is created
And the stored budget is 20000 MNT
When the budget is 19999 MNT
Then the task is not created

## SCN-TASK-006

**Risk:** High
**PRD:** REQ-P1-TASK-03
**Title:** Fourth task photo is rejected with PHOTO_LIMIT_EXCEEDED

Given a task already has 3 photos attached
When a fourth photo is added to that task
Then the request is rejected with status 422
And the error code is PHOTO_LIMIT_EXCEEDED

## SCN-TASK-007

**Risk:** High
**PRD:** REQ-P1-COVER-02
**Title:** Tasker feed includes only OPEN tasks

Given tasks exist in OPEN, ASSIGNED, COMPLETED, CANCELLED, and NO_SHOW statuses
When a tasker loads the public task feed
Then only OPEN tasks are returned

## SCN-TASK-008

**Risk:** High
**PRD:** REQ-P1-TASK-09
**Title:** Task feed exposes district or fuzzed location only before confirmation

Given a task has exact location text and exact coordinates stored
When a non-participant loads the task feed before any booking confirmation
Then the payload includes only district or approximate location fields
And the payload does not include exact address text
And the payload does not include exact stored coordinates

## SCN-TASK-009

**Risk:** High
**PRD:** REQ-P1-TASK-09
**Title:** Non-participant task detail returns approximate location only

Given a task is visible to the public feed
When a user who is neither the owner nor the accepted tasker opens task detail
Then the task detail includes only approximate location fields
And the task detail does not include exact address text or exact coordinates

## SCN-TASK-010

**Risk:** High
**PRD:** REQ-P1-TASK-10
**Title:** Task owner receives full exact location fields in task detail

Given a customer created a task with exact location text and coordinates
When that same customer opens the task detail
Then the task detail includes exact address text
And the task detail includes exact coordinates

## SCN-TASK-011

**Risk:** High
**PRD:** REQ-P1-TASK-10
**Title:** Accepted tasker receives full exact location fields after booking confirmation

Given a task has been booked with an accepted tasker
When that accepted tasker opens the task detail
Then the task detail includes exact address text
And the task detail includes exact coordinates

## SCN-TASK-012

**Risk:** High
**PRD:** REQ-P1-COVER-02
**Title:** Task feed cursor pagination is deterministic and pages do not overlap

Given more OPEN tasks exist than can fit on one feed page
When the same feed is requested with the same limit and the returned next cursor
Then the page ordering is deterministic
And items returned on later pages do not duplicate items from earlier pages

## SCN-TASK-013

**Risk:** High
**PRD:** NFR-API-01
**Title:** Invalid task feed cursor is rejected with INVALID_CURSOR

Given a client requests the task feed with a malformed or non-decodable cursor
When the feed request is processed
Then the response status is 400
And the error code is INVALID_CURSOR

## SCN-TASK-014

**Risk:** High
**PRD:** REQ-P1-TASK-06
**Title:** Deterministic job scope summary is generated from intake answers before submit and persisted

Given a customer has answered the structured intake questions for a category
When the task is prepared for final submission
Then a deterministic job scope summary is generated from those intake answers
And the generated summary is prefilled into the editable description
And the posted task persists that summary

## SCN-TASK-015

**Risk:** High
**PRD:** REQ-P1-TASK-07
**Title:** Summary rendering failure falls back to canonical key-value summary without blocking posting

Given deterministic summary rendering fails for a category and schema version
When the customer submits the task
Then the task is still created successfully
And the stored description uses a canonical key-value fallback summary
And the failure is logged with category and schema version

## SCN-TASK-016

**Risk:** High
**PRD:** REQ-P1-TASK-04
**Title:** Draft creation binds and returns the active intake schema version at form start

Given a category has an active intake schema version
When a customer starts a task draft for that category
Then the draft persists the currently active intake schema version
And the draft response returns that bound version

## SCN-TASK-017

**Risk:** High
**PRD:** REQ-P1-TASK-05
**Title:** Draft submit validates against its bound schema version even after a newer version is activated

Given a draft was created while schema version 1 was active
And schema version 2 is later activated for the same category
When the customer submits the draft with answers valid for version 1
Then validation executes against version 1
And the task submission succeeds without requiring version 2-only fields

## SCN-TASK-018

**Risk:** High
**PRD:** REQ-P1-TASK-05
**Title:** Draft submit still uses its bound schema version even if that version is no longer active

Given a draft was created while schema version 1 was active
And schema version 1 is later replaced by a different active version
When the customer submits the original draft
Then validation still uses the draft's bound schema version
And the submission is not rejected only because version 1 is no longer active

## SCN-TASK-019

**Risk:** High
**PRD:** REQ-P1-CAT-05
**Title:** Deactivated category blocks new draft and create requests but existing tasks keep their lifecycle

Given a category was active when an existing task was created
And that category is later deactivated
When a customer starts a new draft or submits a new task in that category
Then the new draft or task request is rejected
And the previously created task keeps its stored category metadata
And the previously created task can still proceed through allowed lifecycle transitions

## SCN-TASK-020

**Risk:** High
**PRD:** REQ-P1-TASK-08
**Title:** Task location outside Ulaanbaatar service area is rejected at posting

Given a customer is creating a task with all other required fields valid
When the task location is outside the Ulaanbaatar service area
Then the task is not created
And the response identifies the location as outside the supported service area

## SCN-TASK-021

**Risk:** High
**PRD:** REQ-P1-COVER-02
**Title:** Task creation eligibility uses the admin-active category catalog

Given a customer selects a category currently active for posting in the admin dashboard
And task location, fraud, and spam checks otherwise pass
When the customer creates the task
Then category eligibility is accepted from the current admin catalog
And the request is not rejected only because the category is outside the initial launch seed list

## SCN-TASK-022

**Risk:** High
**PRD:** REQ-P1-MATCH-01
**Title:** Only verified active taskers can submit applications to eligible tasks

Given an eligible task is in OPEN status
When an unverified tasker attempts to apply
Then the application is rejected
And when a banned or suspended tasker attempts to apply
Then the application is rejected
And when a verified active tasker applies
Then the application is accepted

## SCN-TASK-023

**Risk:** High
**PRD:** REQ-P1-MATCH-02
**Title:** Application requires structured pricing response and short note

Given a verified tasker is applying to an eligible task
When the application omits the pricing response or the structured note
Then the application is rejected with field-level validation errors
And the application is not persisted

## SCN-TASK-024

**Risk:** High
**PRD:** REQ-P1-MATCH-03
**Title:** Customer can review all applications on a task without hard cap

Given a task has received 10 or more qualified applications
When the customer requests the application list
Then all applications are returned in a paginated list
And no artificial cap limits the number of visible applications

## SCN-TASK-025

**Risk:** High
**PRD:** REQ-P1-MATCH-05
**Title:** Tasker can withdraw application before customer selection

Given a tasker has submitted an application to an OPEN task
And the customer has not yet selected any applicant
When the tasker withdraws the application
Then the application status becomes WITHDRAWN
And the withdrawn application is no longer shown to the customer as selectable

## SCN-TASK-026

**Risk:** High
**PRD:** REQ-P1-PRICE-02
**Title:** Budget mode task shows posted budget to applicants

Given a customer created a task with "I have a budget" pricing mode
When a tasker views the task details or feed listing
Then the posted budget amount is visible to the tasker

## SCN-TASK-027

**Risk:** High
**PRD:** REQ-P1-PRICE-04
**Title:** Quote mode task requires tasker price quote in application

Given a customer created a task with "I want quotes" pricing mode
When a tasker submits an application
Then the application requires a price quote as part of the structured pricing response
And an application without a price quote is rejected

## SCN-TASK-028

**Risk:** High
**PRD:** REQ-P1-PRICE-03
**Title:** Tasker counter-offer on budget-mode task is structured and recorded

Given a customer created a task with a budget of 50000 MNT
When a tasker submits an application with a counter-offer of 60000 MNT
Then the counter-offer is recorded as a structured pricing response
And the counter-offer is distinguishable from budget acceptance

## SCN-TASK-029

**Risk:** High
**PRD:** REQ-P1-PRICE-05
**Title:** Customer sees original budget and counter-offer where both exist

Given a task has budget-mode pricing
And at least one application includes a counter-offer different from the posted budget
When the customer reviews applications
Then the response includes both the original posted budget and each counter-offer amount
And the customer can compare the original budget against counter-offers side by side
