# admin Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-ADMIN-001

**Risk:** High
**PRD:** REQ-P1-ADMIN-03
**Title:** Admin feature toggles are rollout controls but not readiness proof

Given an admin has access to feature-toggle rollout controls
When a toggle is created or updated
Then the toggle state, actor, and timestamp are persisted
And the toggle metadata identifies the governed feature or rollout control
And enabling a toggle does not mark the feature as product-ready without activation evidence

## SCN-ADMIN-002

**Risk:** High
**PRD:** REQ-P1-ADMIN-04
**Title:** Admin can ban and unban users

Given an admin opens an active user account record
When the admin bans the user
Then the account becomes banned and future authentication is denied
And when the admin unbans the user
Then the account returns to normal authentication policy evaluation

## SCN-ADMIN-003

**Risk:** High
**PRD:** REQ-P1-ADMIN-06
**Title:** Admin can inspect task and booking state across the platform

Given tasks and bookings exist across lifecycle states
When an admin searches or opens an operations detail view
Then the current task state, booking state, participants, schedule, and timeline are visible
And the inspection surface does not expose edit actions outside authorized operations

## SCN-ADMIN-004

**Risk:** High
**PRD:** REQ-P1-ADMIN-07
**Title:** Manual rescue actions are auditable and measured separately from self-serve activity

Given an operator performs manual rescue for a stalled task
When the admin records the rescue action
Then the rescue action is stored with actor, task, reason, and timestamp
And self-serve reporting excludes the rescued task from native self-serve outcomes

## SCN-ADMIN-005

**Risk:** High
**PRD:** REQ-P1-ADMIN-08
**Title:** Admin can monitor or trigger assisted distribution within launch rules

Given an eligible task has no qualified application within the native matching window
And the task category is eligible for assisted distribution
When an admin monitors or triggers assisted distribution
Then the action respects launch rules and category eligibility
And the distribution action is recorded for operational review
