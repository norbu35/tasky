# category Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-CATEGORY-001

**Risk:** High
**PRD:** REQ-P1-CAT-04, REQ-P1-ADMIN-02
**Title:** Admin can add a new service category

Given an authenticated admin is managing categories
When the admin creates a new category with required display fields
Then the category is stored as available for category management

## SCN-CATEGORY-002

**Risk:** High
**PRD:** REQ-P1-CAT-04, REQ-P1-ADMIN-02
**Title:** Admin can edit, deactivate, and reorder categories with immediate picker propagation

Given one or more categories already exist
When an admin edits category metadata, deactivates a category, or changes sort order
Then the updated category state is persisted
And task-posting category pickers reflect the latest active ordering immediately

## SCN-CATEGORY-003

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects activation candidates with fewer than 3 required questions

Given an admin is creating or updating an intake schema version
When the schema defines fewer than 3 required questions
Then the schema is rejected by lint or preview checks
And the version is not activated

## SCN-CATEGORY-004

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects activation candidates with more than 5 required questions

Given an admin is creating or updating an intake schema version
When the schema defines more than 5 required questions
Then the schema is rejected by lint or preview checks
And the version is not activated

## SCN-CATEGORY-005

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects unsupported field types

Given an admin is creating or updating an intake schema version
When the schema includes a field type outside the supported fixed-choice set
Then the schema is rejected by lint or preview checks
And the version is not activated

## SCN-CATEGORY-006

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Canary activation publishes a new schema version without rebinding existing drafts

Given a category has an existing active schema version and open drafts bound to it
When an admin canary-activates a newer schema version
Then new task-post sessions receive the newer active version
And existing drafts remain bound to the schema version they started with

## SCN-CATEGORY-007

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Rollback restores the last-known-good schema version

Given a category has a recorded last-known-good schema version
And a newer schema version is currently active
When an admin rolls the category back
Then the last-known-good schema version becomes active again
And task-posting clients receive the restored schema immediately

## SCN-CATEGORY-008

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Rollback without a last-known-good schema fails with NO_FALLBACK

Given a category has no recorded last-known-good schema version
When an admin attempts to roll the category back
Then the rollback request is rejected
And the error code is NO_FALLBACK

## SCN-CATEGORY-009

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Admin can activate a schema version from ROLLED_BACK status

Given a category schema version was previously rolled back
When an admin activates that schema version again
Then the selected schema version becomes ACTIVE
And any previously active schema version is marked ROLLED_BACK

## SCN-CATEGORY-010

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects fields missing Mongolian labels

Given an admin is creating or updating an intake schema version
When a field is missing label_mn
Then the schema is rejected by lint or preview checks
And the version is not activated

## SCN-CATEGORY-011

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint accepts text and textarea field types

Given an admin is creating or updating an intake schema version
When the schema includes supported text and textarea field types
Then the schema passes lint or preview checks
And the version can be saved for activation

## SCN-CATEGORY-012

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects text fields without max_length

Given an admin is creating or updating an intake schema version
When a text field omits max_length
Then the schema is rejected by lint or preview checks
And the version is not activated

## SCN-CATEGORY-013

**Risk:** High
**PRD:** REQ-P1-ADMIN-09
**Title:** Schema lint rejects options missing Mongolian labels

Given an admin is creating or updating an intake schema version
When an option object is missing label_mn
Then the schema is rejected by lint or preview checks
And the version is not activated
