# messaging Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-MSG-001

**Risk:** Medium
**PRD:** REQ-P1-MSG-02
**Title:** Conversation is created when a tasker applies to a task

Given a tasker applies to an OPEN task
When the application is submitted
Then a conversation exists between that tasker and the task owner

## SCN-MSG-002

**Risk:** Medium
**PRD:** REQ-P1-MSG-02
**Title:** Message sent to a conversation is persisted and retrievable

Given a conversation exists between two participants
When one participant sends a message
Then the message is stored
And both participants can retrieve it from the conversation history

## SCN-MSG-003

**Risk:** Medium
**PRD:** REQ-P1-MSG-03
**Title:** Non-participant cannot read or send messages in a conversation

Given a conversation exists between a customer and a tasker
When a third user attempts to read or send messages in that conversation
Then the request is rejected with 403 or 404

## SCN-MSG-004

**Risk:** Medium
**PRD:** REQ-P1-MSG-05
**Title:** Message containing a phone number pattern is flagged for admin review

Given a participant sends a message containing a phone number pattern
When the message is processed
Then the message is stored with a phone_number_flagged indicator

## SCN-MSG-005

**Risk:** Medium
**PRD:** REQ-P1-MSG-01
**Title:** No pre-booking chat exists in Phase 1

Given a task is in OPEN status with no confirmed booking
When any user attempts to open or send a message conversation before a booking exists
Then no pre-booking chat conversation is available
And the product provides only structured application data for customer choice
