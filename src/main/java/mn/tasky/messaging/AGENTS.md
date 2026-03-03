# Feature: messaging

In-app real-time messaging between booking participants.

## Purpose

Provides a persistent conversation channel between a Customer and a Tasker.
Conversations are created automatically when a Tasker applies to a task.
Real-time delivery uses WebSocket/STOMP; a REST fallback is provided for clients that cannot
maintain a WebSocket connection.

## API Endpoints

### REST

| Method | Path                                  | Auth | Notes                                          |
|--------|---------------------------------------|------|------------------------------------------------|
| `GET`  | `/api/v1/conversations`               | JWT  | List conversations the caller participates in  |
| `GET`  | `/api/v1/conversations/{id}/messages` | JWT  | List messages in a conversation (parties only) |
| `POST` | `/api/v1/conversations/{id}/messages` | JWT  | Send a message (REST fallback)                 |

### WebSocket / STOMP

| Direction       | Destination                        | Notes                                   |
|-----------------|------------------------------------|-----------------------------------------|
| Client → Server | `/app/conversations/{id}/messages` | Send a message via STOMP                |
| Server → Client | `/topic/conversations/{id}`        | Subscribe to receive real-time messages |

## Query Parameters — List Endpoints

| Param    | Default | Constraints              |
|----------|---------|--------------------------|
| `cursor` | —       | Opaque pagination cursor |
| `limit`  | `50`    | 1–100                    |

## Request / Response Shapes

### `POST /api/v1/conversations/{id}/messages`

```json
// Request
{ "content": "string (max 5000 chars, non-blank)" }

// Response 201 — MessageResponse
// Response 404 — conversation not found
// Response 403 — FORBIDDEN (caller not a participant)
```

### ConversationResponse

```json
{
  "id": "uuid",
  "task_id": "uuid",
  "participant_1_id": "uuid",
  "participant_2_id": "uuid",
  "created_at": "ISO-8601"
}
```

### MessageResponse

```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "sender_id": "uuid",
  "content": "string",
  "sent_at": "ISO-8601"
}
```

## Error Codes

| Code        | HTTP | Trigger                                         |
|-------------|------|-------------------------------------------------|
| `FORBIDDEN` | 403  | Caller is not a participant in the conversation |

## Conversation Lifecycle

- A conversation is created automatically when a Tasker applies to a task
  (side effect of `POST /tasks/{id}/applications`).
- The conversation links: `task_id`, `tasker_id` (participant_1), `customer_id` (participant_2).
- Conversation and message history is always persisted (used as evidence in dispute resolution).
- Admin can read any conversation for dispute investigation via `AdminDisputeController`.

## WebSocket Authentication

- The STOMP connection is authenticated via JWT passed in the `CONNECT` frame headers.
- The server validates the JWT and resolves a `JwtPrincipal` before accepting the session.
- Participant check is enforced on both WebSocket `@MessageMapping` and REST handlers.

## Invariants & Guards

- Only the two participants (Customer and Tasker) may read or write messages.
- Message content is limited to 5,000 characters.
- All messages are persisted to `messages` table on send (both REST and WebSocket paths).
- Conversations are never deleted; they serve as a permanent audit trail.
