# messaging Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-MSG-001

**Risk:** High
**PRD:** REQ-P1-MSG-02
**Title:** Conversation is created only after booking confirmation and price lock

Given a selected tasker accepts within the active acceptance window
And the booking price is locked
When the booking becomes confirmed
Then a platform-mediated conversation exists between the confirmed booking participants
And the conversation remains available for authorized admin review

## SCN-MSG-002

**Risk:** High
**PRD:** REQ-P1-MSG-02
**Title:** Message sent to a conversation is persisted and retrievable

Given a post-confirmation conversation exists between two booking participants
When one participant sends a message
Then the message is stored
And both participants can retrieve it from the conversation history

## SCN-MSG-003

**Risk:** High
**PRD:** REQ-P1-MSG-03
**Title:** Non-participant cannot read or send messages in a conversation

Given a post-confirmation conversation exists between a customer and a tasker
When a third user attempts to read or send messages in that conversation
Then the request is rejected with 403 or 404

## SCN-MSG-004

**Risk:** High
**PRD:** REQ-P1-MSG-05
**Title:** Message containing a phone number pattern is flagged for admin review

Given a participant sends a post-confirmation message containing a phone number pattern
When the message is processed
Then the message is stored with a phone_number_flagged indicator

## SCN-MSG-005

**Risk:** High
**PRD:** REQ-P1-MSG-01, REQ-P1-MATCH-06, REQ-P1-MATCH-07
**Title:** No pre-booking chat exists in Phase 1

Given a task is in OPEN status with no confirmed booking
When any user attempts to open or send a message conversation before a booking exists
Then no pre-booking chat conversation is available
And the product provides only structured application data for customer choice
