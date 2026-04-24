# notification Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-NOTIF-001

**Risk:** High
**PRD:** REQ-P1-NOTIF-01
**Title:** New task matching a tasker's category triggers a push notification to that tasker

Given a verified tasker has a registered device token
When a customer posts a task in a category the tasker covers
Then a push notification is sent to the tasker's device token

## SCN-NOTIF-002

**Risk:** High
**PRD:** REQ-P1-NOTIF-02
**Title:** Booking confirmation sends hired notification to the tasker

Given a customer has accepted a tasker's application
When the booking is confirmed
Then a push notification is sent to the tasker indicating they are hired

## SCN-NOTIF-003

**Risk:** High
**PRD:** REQ-P1-NOTIF-04
**Title:** No-show reminder sends notification to both booking participants

Given a booking is past scheduled start plus 30 minutes with no check-in
When the no-show reminder job runs
Then both customer and tasker receive a push notification

## SCN-NOTIF-004

**Risk:** High
**PRD:** REQ-P1-NOTIF-07
**Title:** Registering a device token stores it for the authenticated user

Given a user is authenticated
When the user registers a device token
Then the token is stored and associated with the user

## SCN-NOTIF-005

**Risk:** High
**PRD:** REQ-P1-NOTIF-07
**Title:** Unregistering a device token removes it for the authenticated user

Given a user has a registered device token
When the user unregisters that token
Then the token is no longer associated with the user

## SCN-NOTIF-006

**Risk:** High
**PRD:** REQ-P1-NOTIF-06
**Title:** Verification decision notification is sent to the affected tasker

Given an admin has just approved or rejected a tasker verification submission
When the verification decision is recorded
Then the affected tasker receives a push notification informing them of the decision

## SCN-NOTIF-007

**Risk:** High
**PRD:** REQ-P1-NOTIF-05
**Title:** Review obligation notification is sent to both participants

Given a reviewable terminal outcome has created review debt
When the review obligation workflow finishes
Then both the customer and tasker receive a notification prompting them to submit their owed review
