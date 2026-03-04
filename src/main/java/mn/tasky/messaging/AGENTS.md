# Feature: messaging

Conversation and message transport for customer-tasker chat.

## Implemented API

| Method | Path                                  | Notes                                     |
|--------|---------------------------------------|-------------------------------------------|
| `GET`  | `/api/v1/conversations`               | List caller conversations (cursor, limit) |
| `GET`  | `/api/v1/conversations/{id}/messages` | List messages if caller is participant    |
| `POST` | `/api/v1/conversations/{id}/messages` | Send message if caller is participant     |

## Realtime Endpoint

- STOMP inbound: `/app/conversations/{id}/messages` (`@MessageMapping`)
- Broadcast topic: `/topic/conversations/{id}`

## Behavior

- `MessagingService.startConversation(taskId, taskerId, customerId)` creates/reuses one conversation.
- Message content is plain-text sanitized and cannot be blank.
- Sender must be one of the two participants.
- Message send writes DB row and broadcasts via `SimpMessagingTemplate`.

## Current Error Semantics

- Conversation missing or participant check failures are surfaced as `403` in controller for list/send paths (service
  throws `IllegalArgumentException`), not separate `404`/`403` codes.
