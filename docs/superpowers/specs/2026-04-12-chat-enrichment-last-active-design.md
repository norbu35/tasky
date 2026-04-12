# Chat Enrichment & Last-Active Indicator

**Date:** 2026-04-12
**Status:** Approved
**Scope:** Backend enrichment of conversations endpoint, `last_active_at` activity tracking, mobile chat UI wiring

## Problem

The chat system has working backend infrastructure (STOMP WebSocket, message CRUD, phone leak detection) but the mobile UI is disconnected from real data:

- Chat detail header shows a hardcoded "Chat" title, the current user's own avatar, and a fake static "online" indicator
- The context card below the header shows placeholder translation keys, not real task data
- The inbox list expects fields (`counterparty_name`, `counterparty_avatar_url`, `last_message_preview`) that the API never returns — the `GET /conversations` endpoint only returns bare IDs
- The API.yaml declares `customer?: Profile`, `tasker?: Profile`, `last_message: Message` on the Conversation schema, but the backend never populates them
- There is no presence or activity tracking anywhere in the system

## Decisions

| Decision                         | Choice                                                          | Rationale                                                                                              |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Activity tracking mechanism      | `last_active_at` column on profiles, updated via servlet filter | Simpler than WebSocket presence; sufficient signal for a marketplace                                   |
| Update throttling                | DB-level: `WHERE last_active_at < now() - interval '2 minutes'` | Stateless, no in-memory cache to manage, natural no-op when recent                                     |
| Conversation response shape      | Flat counterparty fields, not nested Profile/Message objects    | Inbox list renders N conversations — full Profile objects per row is wasteful                          |
| Conversation enrichment strategy | Single enriched SQL query with LATERAL join                     | One DB round-trip for the inbox hot path; chat detail reads from React Query cache                     |
| Context card                     | Remove entirely                                                 | No task title column exists; task description truncation is not useful; user already knows the context |
| Unread count                     | Returns 0 (hardcoded)                                           | No read-receipt tracking exists; honest default, separate future feature                               |

## Backend Changes

### 1. Flyway Migration: `V21__profile_last_active.sql`

```sql
ALTER TABLE profiles
  ADD COLUMN last_active_at TIMESTAMPTZ;

UPDATE profiles p
  SET last_active_at = u.created_at
  FROM users u
  WHERE p.user_id = u.id
    AND p.last_active_at IS NULL;
```

Column is nullable. Backfill seeds existing users with their account creation timestamp so the field is never null for real users.

### 2. Activity Tracking Filter: `LastActiveFilter.java`

New `OncePerRequestFilter` in `mn.tasky.common.security`.

**Behavior:**

- Reads `JwtPrincipal` from `SecurityContextHolder` (cast from `Authentication.getPrincipal()`)
- Extracts user ID via `principal.userId()`, converts to `UUID` via `UUID.fromString()`
- Calls `ProfileDao.touchLastActive(userId)`
- Skips unauthenticated requests, `/actuator/` paths, `/ws` and `/ws/` paths (matching RateLimitFilter's `shouldNotFilter` pattern)
- Fire-and-forget: exceptions are caught and logged, never block the request chain

**DAO method** added to `ProfileDao.java`:

```java
@SqlUpdate("UPDATE profiles SET last_active_at = now() "
        + "WHERE user_id = :userId "
        + "AND (last_active_at IS NULL OR last_active_at < now() - interval '2 minutes')")
void touchLastActive(@Bind("userId") UUID userId);
```

The 2-minute throttle lives in the WHERE clause. The filter calls this unconditionally; the DB skips the write when unnecessary.

**Registration** in `SecurityConfig.java`:

- Add `LastActiveFilter` as constructor dependency
- Insert after RateLimitFilter: `.addFilterAfter(lastActiveFilter, RateLimitFilter.class)`
- Final chain order: JWT → RateLimit → LastActive

### 3. Enriched Conversations Query

New DTO record `EnrichedConversation.java` in `mn.tasky.messaging.dto`:

```java
public record EnrichedConversation(
    String id,
    String taskId,
    String taskDescription,
    String counterpartyId,
    String counterpartyName,
    String counterpartyAvatarUrl,
    Instant counterpartyLastActiveAt,
    String lastMessageContent,
    Instant lastMessageAt,
    int unreadCount,
    Instant createdAt
) {}
```

New query in `ConversationDao`:

```sql
SELECT
  c.id,
  c.task_id            AS taskId,
  t.description        AS taskDescription,
  CASE WHEN c.customer_id = :userId THEN c.tasker_id
       ELSE c.customer_id END
                        AS counterpartyId,
  cp.full_name         AS counterpartyName,
  cp.avatar_url        AS counterpartyAvatarUrl,
  cp.last_active_at    AS counterpartyLastActiveAt,
  lm.content           AS lastMessageContent,
  lm.sent_at           AS lastMessageAt,
  0                    AS unreadCount,
  c.created_at         AS createdAt
FROM conversations c
JOIN tasks t ON t.id = c.task_id
JOIN profiles cp ON cp.user_id = CASE
  WHEN c.customer_id = :userId THEN c.tasker_id
  ELSE c.customer_id
END
LEFT JOIN LATERAL (
  SELECT m.content, m.sent_at
  FROM messages m
  WHERE m.conversation_id = c.id
  ORDER BY m.sent_at DESC
  LIMIT 1
) lm ON true
WHERE c.customer_id = :userId OR c.tasker_id = :userId
ORDER BY COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC
LIMIT :limit
```

- `taskDescription` is truncated to ~80 chars in the Java mapper (not SQL) to avoid breaking Mongolian Cyrillic mid-grapheme; output as `task_title` in the JSON response
- `lastMessageContent` is truncated to ~100 chars in the mapper for the same reason; output as `last_message_content`
- Cursor pagination shifts from id-based to timestamp-based. Sort key is `COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC` — the conversation `id` serves as tiebreaker for stable ordering when timestamps collide. Cursor encodes both values.
- Conversations with no messages still appear (LEFT JOIN LATERAL)
- The existing `Conversation` record and its queries remain for internal use (startConversation, findById)
- `userId` flows as `String` from `JwtPrincipal.userId()` through the service layer. The DAO method accepts `String` and the JDBI query compares against UUID columns — PostgreSQL handles the implicit cast. Follow the existing pattern in `ConversationDao.findByUserId`.

### 4. Controller Rewrite

`MessagingController.toConversationResponse()` is replaced to map `EnrichedConversation` flat fields directly. The `listConversations` method passes `principal.userId()` to the service so the query can resolve the counterparty.

`MessagingService.listConversations()` gains a new overload (or the existing one is updated) that calls the enriched DAO method.

## API Schema Changes

### Profile schema: add `last_active_at`

```yaml
last_active_at:
  type: string
  format: date-time
  nullable: true
  description: >-
    Last time the user made an authenticated API request.
    Updated at most every 2 minutes. Null if never active since migration.
```

Not added to `required`.

### Conversation schema: flat counterparty fields

Replace `customer`, `tasker`, `last_message` nested objects with:

```yaml
Conversation:
  type: object
  required: [id, task_id, counterparty_id, counterparty_name, unread_count, created_at]
  properties:
    id:
      type: string
      format: uuid
    task_id:
      type: string
      format: uuid
    task_title:
      type: string
      nullable: true
      description: Truncated task description for display (~80 chars).
    counterparty_id:
      type: string
      format: uuid
    counterparty_name:
      type: string
    counterparty_avatar_url:
      type: string
      format: uri
      nullable: true
    counterparty_last_active_at:
      type: string
      format: date-time
      nullable: true
    last_message_content:
      type: string
      nullable: true
      description: Truncated last message content (~100 chars).
    last_message_at:
      type: string
      format: date-time
      nullable: true
    unread_count:
      type: integer
      description: Always 0 until read-receipt tracking is implemented.
    created_at:
      type: string
      format: date-time
```

Removed fields: `customer`, `tasker`, `customer_id`, `tasker_id`, `last_message`.

### SDK Regeneration

`pnpm sdk:generate` after API.yaml changes.

## Frontend Changes (Mobile)

### Chat Detail Header (`apps/mobile/src/app/(tabs)/inbox/[id].tsx`)

Data source: find the conversation by ID from the `useConversations()` React Query cache. No extra API call.

- **Title**: `conversation.counterparty_name` (replaces hardcoded `t('shared.inbox.chatTitle')`)
- **Avatar**: `conversation.counterparty_avatar_url` with name-initial fallback (replaces current user's own avatar)
- **Activity indicator**: Computed from `conversation.counterparty_last_active_at`:
  - Within 5 minutes: "Active now" + green dot
  - Within 1 hour: "Active Xm ago"
  - Within 24 hours: "Active Xh ago"
  - Older or null: hidden
- **Context card**: Removed entirely
- **Fake online indicator**: Removed

### Inbox List (`apps/mobile/src/app/(tabs)/inbox/index.tsx`)

Each conversation list item renders:

- `counterparty_name` as title
- `counterparty_avatar_url` via ProfileAvatar (with green dot overlay if active within 5 minutes)
- `last_message_content` as preview text
- `last_message_at` formatted as relative time ("2m ago", "1h ago", "Yesterday")
- `unread_count > 0` as unread dot (always hidden for now)

The field names from the enriched API response should align with what the inbox list already expects. Verify and fix any naming mismatches.

### Shared Utility: `formatLastActive()`

New utility function (in `src/lib/` or `src/features/chat/`) that takes an ISO timestamp and returns:

- `{ label: 'Active now', isActive: true }` if within 5 minutes
- `{ label: 'Active 23m ago', isActive: false }` if within 1 hour
- `{ label: 'Active 3h ago', isActive: false }` if within 24 hours
- `{ label: null, isActive: false }` if older or null

Used by both the inbox list (green dot) and chat detail header (text label).

## Files Changed

| File                                                                              | Change                                            |
| --------------------------------------------------------------------------------- | ------------------------------------------------- |
| `services/api/src/main/resources/db/migration/V21__profile_last_active.sql`       | New migration                                     |
| `services/api/src/main/java/mn/tasky/common/security/LastActiveFilter.java`       | New filter                                        |
| `services/api/src/main/java/mn/tasky/common/config/SecurityConfig.java`           | Register filter in chain                          |
| `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`                    | Add `touchLastActive()`                           |
| `services/api/src/main/java/mn/tasky/messaging/dto/EnrichedConversation.java`     | New DTO                                           |
| `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`          | Add enriched query                                |
| `services/api/src/main/java/mn/tasky/messaging/application/MessagingService.java` | Pass userId for counterparty resolution           |
| `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`      | Rewrite response mapping                          |
| `docs/API.yaml`                                                                   | Profile + Conversation schema updates             |
| `packages/sdk/src/generated/api-types.ts`                                         | Regenerated                                       |
| `apps/mobile/src/app/(tabs)/inbox/[id].tsx`                                       | Wire header, remove context card + fake indicator |
| `apps/mobile/src/app/(tabs)/inbox/index.tsx`                                      | Update to enriched conversation fields            |
| `apps/mobile/src/lib/formatLastActive.ts`                                         | New shared utility                                |

## Not in Scope

- **Unread count**: Returns 0. Read-receipt tracking is a separate feature.
- **WebSocket presence**: Overkill. `last_active_at` provides sufficient signal.
- **Real-time message updates**: Mobile uses React Query polling, not STOMP subscription. Separate feature.
- **Legacy ChatDetailScreen.tsx**: `src/features/chat/components/ChatDetailScreen.tsx` is unused; the active screen is `[id].tsx`.
- **Web client**: Only mobile is in scope.
