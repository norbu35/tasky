# Chat Enrichment & Last-Active Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the conversations endpoint with counterparty profile data and last-message preview, add `last_active_at` activity tracking, and wire the mobile chat UI to real data.

**Architecture:** New Flyway migration adds `last_active_at` to profiles. A servlet filter updates it on authenticated requests (DB-throttled to 2-minute intervals). The `GET /conversations` endpoint is enriched with a single SQL query (LATERAL join) that resolves the counterparty, latest message, and activity timestamp. The mobile app reads from React Query cache for both inbox list and chat detail.

**Tech Stack:** Spring Boot (Java 21), JDBI 3, Flyway, PostgreSQL; React Native (Expo Router), TanStack React Query, NativeWind; OpenAPI 3.0 + generated TypeScript SDK.

**Spec:** `docs/superpowers/specs/2026-04-12-chat-enrichment-last-active-design.md`

---

## File Map

| File                                                                              | Action     | Purpose                                           |
| --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| `services/api/src/main/resources/db/migration/V21__profile_last_active.sql`       | Create     | Add `last_active_at` column to profiles           |
| `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`                    | Modify     | Add `touchLastActive()` method                    |
| `services/api/src/main/java/mn/tasky/common/security/LastActiveFilter.java`       | Create     | Servlet filter to update `last_active_at`         |
| `services/api/src/main/java/mn/tasky/common/config/SecurityConfig.java`           | Modify     | Register LastActiveFilter in chain                |
| `services/api/src/main/java/mn/tasky/messaging/dto/EnrichedConversation.java`     | Create     | DTO for enriched conversation query result        |
| `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`          | Modify     | Add enriched query with LATERAL join              |
| `services/api/src/main/java/mn/tasky/messaging/application/MessagingService.java` | Modify     | Add enriched listConversations method             |
| `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`      | Modify     | Rewrite response mapping to flat fields           |
| `docs/API.yaml`                                                                   | Modify     | Update Profile and Conversation schemas           |
| `packages/sdk/src/generated/api-types.ts`                                         | Regenerate | SDK types from API.yaml                           |
| `apps/mobile/src/lib/formatLastActive.ts`                                         | Create     | Shared utility for "Active X ago" labels          |
| `apps/mobile/src/app/(tabs)/inbox/index.tsx`                                      | Modify     | Update ConversationItem interface, add active dot |
| `apps/mobile/src/app/(tabs)/inbox/[id].tsx`                                       | Modify     | Wire header to real data, remove context card     |

---

### Task 1: Flyway Migration — `last_active_at` Column

**Files:**

- Create: `services/api/src/main/resources/db/migration/V21__profile_last_active.sql`

- [ ] **Step 1: Create migration file**

```sql
ALTER TABLE profiles
  ADD COLUMN last_active_at TIMESTAMPTZ;

UPDATE profiles p
  SET last_active_at = u.created_at
  FROM users u
  WHERE p.user_id = u.id
    AND p.last_active_at IS NULL;
```

- [ ] **Step 2: Validate migration runs cleanly**

Run from repo root:

```bash
docker compose up -d postgres
./gradlew flywayMigrate -Dflyway.url=jdbc:postgresql://localhost:5432/tasky -Dflyway.user=tasky_owner -Dflyway.password=tasky_owner
```

Expected: `Successfully applied 1 migration` (V21).

- [ ] **Step 3: Verify column exists**

```bash
docker compose exec postgres psql -U tasky_owner -d tasky -c "\d profiles"
```

Expected: `last_active_at` column of type `timestamp with time zone` appears.

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/resources/db/migration/V21__profile_last_active.sql
git commit -m "feat(db): add last_active_at column to profiles table"
```

---

### Task 2: ProfileDao — `touchLastActive()` Method

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`

- [ ] **Step 1: Add the touchLastActive method to ProfileDao**

Add after the existing `setInstantMatchRevokedUntil` method (after line 61):

```java
@SqlUpdate("UPDATE profiles SET last_active_at = now() "
        + "WHERE user_id = :userId "
        + "AND (last_active_at IS NULL OR last_active_at < now() - interval '2 minutes')")
void touchLastActive(@Bind("userId") UUID userId);
```

- [ ] **Step 2: Verify compilation**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java
git commit -m "feat(auth): add touchLastActive DAO method with 2-min DB throttle"
```

---

### Task 3: LastActiveFilter — Servlet Filter

**Files:**

- Create: `services/api/src/main/java/mn/tasky/common/security/LastActiveFilter.java`
- Modify: `services/api/src/main/java/mn/tasky/common/config/SecurityConfig.java`

- [ ] **Step 1: Create LastActiveFilter.java**

```java
package mn.tasky.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import mn.tasky.auth.dao.ProfileDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Updates {@code profiles.last_active_at} on authenticated API requests.
 *
 * <p>The DB query includes a 2-minute throttle in its WHERE clause so repeated
 * requests within that window are no-ops. Errors are logged but never block the
 * request chain.
 */
@Component
public class LastActiveFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LastActiveFilter.class);

    private final ProfileDao profileDao;

    public LastActiveFilter(ProfileDao profileDao) {
        this.profileDao = profileDao;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/") || path.startsWith("/ws/") || "/ws".equals(path);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null
                    && authentication.isAuthenticated()
                    && authentication.getPrincipal() instanceof JwtPrincipal principal) {
                profileDao.touchLastActive(UUID.fromString(principal.userId()));
            }
        } catch (Exception e) {
            log.warn("Failed to update last_active_at: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 2: Register filter in SecurityConfig.java**

In `SecurityConfig.java`, add `LastActiveFilter` to the constructor. Change lines 26-44 from:

```java
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final boolean devAuthEnabled;

    public SecurityConfig(
            @Value("${tasky.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitFilter rateLimitFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler) {
        this.allowedOrigins = List.of(allowedOrigins.trim().split("\\s*,\\s*"));
        this.devAuthEnabled = devAuthEnabled;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }
```

To:

```java
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final LastActiveFilter lastActiveFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final boolean devAuthEnabled;

    public SecurityConfig(
            @Value("${tasky.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitFilter rateLimitFilter,
            LastActiveFilter lastActiveFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler) {
        this.allowedOrigins = List.of(allowedOrigins.trim().split("\\s*,\\s*"));
        this.devAuthEnabled = devAuthEnabled;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.lastActiveFilter = lastActiveFilter;
        this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
        this.restAccessDeniedHandler = restAccessDeniedHandler;
    }
```

Then add the filter to the chain. After the existing line:

```java
.addFilterAfter(rateLimitFilter, JwtAuthenticationFilter.class)
```

Add:

```java
.addFilterAfter(lastActiveFilter, RateLimitFilter.class)
```

- [ ] **Step 3: Verify compilation**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Run existing tests to check no regression**

```bash
./gradlew test
```

Expected: All existing tests pass. The filter is a no-op for test users without profiles.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/main/java/mn/tasky/common/security/LastActiveFilter.java \
       services/api/src/main/java/mn/tasky/common/config/SecurityConfig.java
git commit -m "feat(auth): add LastActiveFilter for last_active_at tracking"
```

---

### Task 4: EnrichedConversation DTO

**Files:**

- Create: `services/api/src/main/java/mn/tasky/messaging/dto/EnrichedConversation.java`

- [ ] **Step 1: Create the DTO record**

```java
package mn.tasky.messaging.dto;

import java.time.Instant;
import org.jdbi.v3.core.mapper.reflect.ColumnName;

public record EnrichedConversation(
        String id,
        @ColumnName("taskId") String taskId,
        @ColumnName("taskDescription") String taskDescription,
        @ColumnName("counterpartyId") String counterpartyId,
        @ColumnName("counterpartyName") String counterpartyName,
        @ColumnName("counterpartyAvatarUrl") String counterpartyAvatarUrl,
        @ColumnName("counterpartyLastActiveAt") Instant counterpartyLastActiveAt,
        @ColumnName("lastMessageContent") String lastMessageContent,
        @ColumnName("lastMessageAt") Instant lastMessageAt,
        @ColumnName("unreadCount") int unreadCount,
        @ColumnName("createdAt") Instant createdAt) {}
```

- [ ] **Step 2: Verify compilation**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add services/api/src/main/java/mn/tasky/messaging/dto/EnrichedConversation.java
git commit -m "feat(messaging): add EnrichedConversation DTO for inbox endpoint"
```

---

### Task 5: Enriched Conversation Query in DAO

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`

- [ ] **Step 1: Add RegisterConstructorMapper for EnrichedConversation**

At the top of the interface (after the existing `@RegisterConstructorMapper(Conversation.class)` annotation on line 16), add:

```java
@RegisterConstructorMapper(EnrichedConversation.class)
```

Add the import:

```java
import mn.tasky.messaging.dto.EnrichedConversation;
```

- [ ] **Step 2: Add enriched query methods**

Add after the existing `findByUserIdAfterCursor` method (after line 81):

```java
@SqlQuery("SELECT "
        + "c.id, "
        + "c.task_id AS taskId, "
        + "t.description AS taskDescription, "
        + "CASE WHEN c.customer_id = CAST(:userId AS UUID) THEN c.tasker_id "
        + "     ELSE c.customer_id END AS counterpartyId, "
        + "cp.full_name AS counterpartyName, "
        + "cp.avatar_url AS counterpartyAvatarUrl, "
        + "cp.last_active_at AS counterpartyLastActiveAt, "
        + "lm.content AS lastMessageContent, "
        + "lm.sent_at AS lastMessageAt, "
        + "0 AS unreadCount, "
        + "c.created_at AS createdAt "
        + "FROM conversations c "
        + "JOIN tasks t ON t.id = c.task_id "
        + "JOIN profiles cp ON cp.user_id = CASE "
        + "  WHEN c.customer_id = CAST(:userId AS UUID) THEN c.tasker_id "
        + "  ELSE c.customer_id END "
        + "LEFT JOIN LATERAL ("
        + "  SELECT m.content, m.sent_at "
        + "  FROM messages m "
        + "  WHERE m.conversation_id = c.id "
        + "  ORDER BY m.sent_at DESC LIMIT 1"
        + ") lm ON true "
        + "WHERE c.customer_id = CAST(:userId AS UUID) "
        + "   OR c.tasker_id = CAST(:userId AS UUID) "
        + "ORDER BY COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC "
        + "LIMIT :limit")
List<EnrichedConversation> findEnrichedFirstPage(
        @Bind("userId") String userId, @Bind("limit") int limit);

@SqlQuery("SELECT "
        + "c.id, "
        + "c.task_id AS taskId, "
        + "t.description AS taskDescription, "
        + "CASE WHEN c.customer_id = CAST(:userId AS UUID) THEN c.tasker_id "
        + "     ELSE c.customer_id END AS counterpartyId, "
        + "cp.full_name AS counterpartyName, "
        + "cp.avatar_url AS counterpartyAvatarUrl, "
        + "cp.last_active_at AS counterpartyLastActiveAt, "
        + "lm.content AS lastMessageContent, "
        + "lm.sent_at AS lastMessageAt, "
        + "0 AS unreadCount, "
        + "c.created_at AS createdAt "
        + "FROM conversations c "
        + "JOIN tasks t ON t.id = c.task_id "
        + "JOIN profiles cp ON cp.user_id = CASE "
        + "  WHEN c.customer_id = CAST(:userId AS UUID) THEN c.tasker_id "
        + "  ELSE c.customer_id END "
        + "LEFT JOIN LATERAL ("
        + "  SELECT m.content, m.sent_at "
        + "  FROM messages m "
        + "  WHERE m.conversation_id = c.id "
        + "  ORDER BY m.sent_at DESC LIMIT 1"
        + ") lm ON true "
        + "WHERE (c.customer_id = CAST(:userId AS UUID) "
        + "    OR c.tasker_id = CAST(:userId AS UUID)) "
        + "  AND COALESCE(lm.sent_at, c.created_at) < CAST(:cursor AS TIMESTAMPTZ) "
        + "ORDER BY COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC "
        + "LIMIT :limit")
List<EnrichedConversation> findEnrichedAfterCursor(
        @Bind("userId") String userId,
        @Bind("cursor") String cursor,
        @Bind("limit") int limit);
```

- [ ] **Step 3: Verify compilation**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java
git commit -m "feat(messaging): add enriched conversation query with LATERAL join"
```

---

### Task 6: Service + Controller — Wire Enriched Endpoint

**Files:**

- Modify: `services/api/src/main/java/mn/tasky/messaging/application/MessagingService.java`
- Modify: `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`

- [ ] **Step 1: Add enriched list method to MessagingService**

Add after the existing `listConversations` methods (after line 90):

```java
public List<EnrichedConversation> listEnrichedConversations(
        String userId, String cursor, int limit) {
    if (cursor == null || cursor.isBlank()) {
        return conversationDao.findEnrichedFirstPage(userId, limit);
    }
    return conversationDao.findEnrichedAfterCursor(userId, cursor, limit);
}
```

Add the import at the top:

```java
import mn.tasky.messaging.dto.EnrichedConversation;
```

- [ ] **Step 2: Rewrite MessagingController listConversations and toConversationResponse**

Replace the `listConversations` method (lines 49-60) and `toConversationResponse` method (lines 62-70) with:

```java
@GetMapping
public ResponseEntity<?> listConversations(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
    List<EnrichedConversation> conversations =
            messagingService.listEnrichedConversations(principal.userId(), cursor, limit + 1);
    boolean hasMore = conversations.size() > limit;
    List<EnrichedConversation> pageData =
            hasMore ? conversations.subList(0, limit) : conversations;

    String nextCursor = null;
    if (hasMore) {
        EnrichedConversation last = pageData.getLast();
        Instant cursorTime = last.lastMessageAt() != null ? last.lastMessageAt() : last.createdAt();
        nextCursor = cursorTime.toString();
    }

    List<Map<String, Object>> data =
            pageData.stream().map(this::toEnrichedResponse).toList();
    return ResponseEntity.ok(new PagedResponse<>(data,
            new CursorPagination(nextCursor, hasMore)));
}

private Map<String, Object> toEnrichedResponse(EnrichedConversation c) {
    Map<String, Object> res = new LinkedHashMap<>();
    res.put("id", c.id());
    res.put("task_id", c.taskId());
    res.put("task_title", truncate(c.taskDescription(), 80));
    res.put("counterparty_id", c.counterpartyId());
    res.put("counterparty_name", c.counterpartyName());
    res.put("counterparty_avatar_url", c.counterpartyAvatarUrl());
    res.put("counterparty_last_active_at",
            c.counterpartyLastActiveAt() != null ? c.counterpartyLastActiveAt().toString() : null);
    res.put("last_message_content", truncate(c.lastMessageContent(), 100));
    res.put("last_message_at",
            c.lastMessageAt() != null ? c.lastMessageAt().toString() : null);
    res.put("unread_count", c.unreadCount());
    res.put("created_at", c.createdAt().toString());
    return res;
}

private static String truncate(String text, int maxLen) {
    if (text == null || text.length() <= maxLen) return text;
    // Break at last space before maxLen to avoid splitting words/characters
    int breakAt = text.lastIndexOf(' ', maxLen);
    if (breakAt <= 0) breakAt = maxLen;
    return text.substring(0, breakAt) + "\u2026";
}
```

Add the import:

```java
import mn.tasky.messaging.dto.EnrichedConversation;
```

Remove the old `toConversationResponse` method and the unused `Conversation` import if the old `Conversation` DTO is no longer referenced in this controller.

- [ ] **Step 3: Verify compilation**

```bash
./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Run backend tests**

```bash
./gradlew test
```

Expected: All tests pass.

- [ ] **Step 5: Manual smoke test**

```bash
docker compose up -d postgres minio minio-bootstrap
./gradlew --no-daemon bootRun
```

In another terminal:

```bash
curl -s -H "Authorization: Bearer <test-token>" http://localhost:8080/api/v1/conversations | jq .
```

Expected: Response contains `counterparty_name`, `counterparty_avatar_url`, `last_message_content`, `last_message_at` fields.

- [ ] **Step 6: Commit**

```bash
git add services/api/src/main/java/mn/tasky/messaging/application/MessagingService.java \
       services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java
git commit -m "feat(messaging): enrich conversations endpoint with counterparty and last message"
```

---

### Task 7: API Schema + SDK Regeneration

**Files:**

- Modify: `docs/API.yaml`
- Regenerate: `packages/sdk/src/generated/api-types.ts`

- [ ] **Step 1: Add `last_active_at` to Profile schema in API.yaml**

In the Profile schema properties (after `created_at`), add:

```yaml
last_active_at:
  type: string
  format: date-time
  nullable: true
  description: >-
    Last time the user made an authenticated API request.
    Updated at most every 2 minutes.
```

- [ ] **Step 2: Replace Conversation schema in API.yaml**

Replace the existing Conversation schema with:

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
      description: Truncated task description for display.
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
      description: Truncated last message content.
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

- [ ] **Step 3: Validate API spec**

```bash
./gradlew openApiValidate
```

Expected: Validation passes.

- [ ] **Step 4: Regenerate SDK**

```bash
pnpm sdk:generate
```

Expected: `packages/sdk/src/generated/api-types.ts` is regenerated with the new Conversation and Profile types.

- [ ] **Step 5: Typecheck downstream consumers**

```bash
pnpm -r typecheck
```

Expected: Type errors in mobile app (ConversationItem interface and chat detail) — these are expected and will be fixed in the next tasks.

- [ ] **Step 6: Commit**

```bash
git add docs/API.yaml packages/sdk/src/generated/api-types.ts
git commit -m "docs(api): update Conversation schema to flat counterparty fields, add last_active_at to Profile"
```

---

### Task 8: Shared `formatLastActive` Utility

**Files:**

- Create: `apps/mobile/src/lib/formatLastActive.ts`
- Create: `apps/mobile/__tests__/lib/formatLastActive.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/mobile/__tests__/lib/formatLastActive.test.ts`:

```typescript
import { formatLastActive } from '../../src/lib/formatLastActive';

describe('formatLastActive', () => {
  it('returns null label for null input', () => {
    expect(formatLastActive(null)).toEqual({ label: null, isActive: false });
  });

  it('returns null label for undefined input', () => {
    expect(formatLastActive(undefined)).toEqual({ label: null, isActive: false });
  });

  it('returns "Active now" for timestamps within 5 minutes', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const result = formatLastActive(twoMinAgo);
    expect(result.label).toBe('Active now');
    expect(result.isActive).toBe(true);
  });

  it('returns "Active Xm ago" for timestamps within 1 hour', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const result = formatLastActive(thirtyMinAgo);
    expect(result.label).toBe('Active 30m ago');
    expect(result.isActive).toBe(false);
  });

  it('returns "Active Xh ago" for timestamps within 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const result = formatLastActive(threeHoursAgo);
    expect(result.label).toBe('Active 3h ago');
    expect(result.isActive).toBe(false);
  });

  it('returns null label for timestamps older than 24 hours', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(formatLastActive(twoDaysAgo)).toEqual({ label: null, isActive: false });
  });

  it('returns null label for invalid date string', () => {
    expect(formatLastActive('not-a-date')).toEqual({ label: null, isActive: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @tasky/mobile test -- --testPathPattern="formatLastActive" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `apps/mobile/src/lib/formatLastActive.ts`:

```typescript
export type LastActiveResult = {
  label: string | null;
  isActive: boolean;
};

export function formatLastActive(isoTimestamp: string | null | undefined): LastActiveResult {
  const none: LastActiveResult = { label: null, isActive: false };

  if (!isoTimestamp) return none;

  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return none;

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return none;

  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 5) {
    return { label: 'Active now', isActive: true };
  }

  if (diffMin < 60) {
    return { label: `Active ${diffMin}m ago`, isActive: false };
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return { label: `Active ${diffHours}h ago`, isActive: false };
  }

  return none;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @tasky/mobile test -- --testPathPattern="formatLastActive" --no-coverage
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/formatLastActive.ts \
       apps/mobile/__tests__/lib/formatLastActive.test.ts
git commit -m "feat(mobile): add formatLastActive utility with tests"
```

---

### Task 9: Inbox List — Update to Enriched Fields

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/inbox/index.tsx`

- [ ] **Step 1: Update ConversationItem interface**

Replace the interface at lines 14-22 with:

```typescript
interface ConversationItem {
  id: string;
  task_id: string;
  task_title?: string | null;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_avatar_url?: string | null;
  counterparty_last_active_at?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
}
```

- [ ] **Step 2: Update renderItem to use new field names and add active dot**

Add the import at the top of the file:

```typescript
import { formatLastActive } from '../../../lib/formatLastActive';
```

Replace the `renderItem` callback (lines 76-121) with:

```typescript
  const renderItem = useCallback(
    (item: ConversationItem) => {
      const title = item.counterparty_name ?? item.task_title ?? t('messaging.taskDiscussion');
      const isUnread = (item.unread_count ?? 0) > 0;
      const activity = formatLastActive(item.counterparty_last_active_at);
      return (
        <Pressable
          testID={`conversation-row-${item.id}`}
          className={`flex-row items-center rounded-lg p-item ${isUnread ? 'bg-muted' : 'bg-background'}`}
          onPress={() => router.push(`/inbox/${item.id}`)}
          accessibilityRole="button"
        >
          <View className="mr-md relative">
            <ProfileAvatar uri={item.counterparty_avatar_url ?? undefined} name={title} size="md" />
            {activity.isActive && (
              <View
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-verified"
                style={{ borderWidth: 2, borderColor: colors.card }}
              />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center">
              <Text
                className={`text-body font-semibold flex-1 mr-sm ${isUnread ? 'text-primary-deep font-bold' : 'text-foreground'}`}
                numberOfLines={1}
              >
                {title}
              </Text>
              {item.last_message_at && (
                <Text
                  className={`text-micro ${isUnread ? 'text-primary-deep font-bold' : 'text-muted-foreground'}`}
                >
                  {formatTimestamp(item.last_message_at)}
                </Text>
              )}
            </View>
            {item.last_message_content && (
              <Text className="text-label text-muted-foreground mt-[2px]" numberOfLines={1}>
                {item.last_message_content}
              </Text>
            )}
          </View>
          {isUnread && (
            <View className="w-[10px] h-[10px] rounded-full items-center justify-center ml-sm">
              <View className="w-[10px] h-[10px] rounded-full bg-secondary" />
            </View>
          )}
        </Pressable>
      );
    },
    [formatTimestamp, router, t],
  );
```

Key changes from original:

- `last_message_preview` → `last_message_content` (matches API field name)
- Added `activity` computation and green dot overlay on avatar
- Everything else stays the same

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @tasky/mobile exec tsc --noEmit --pretty
```

Expected: Clean (no errors).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/(tabs)/inbox/index.tsx
git commit -m "feat(mobile): update inbox list to enriched conversation fields with active dot"
```

---

### Task 10: Chat Detail Header — Wire to Real Data

**Files:**

- Modify: `apps/mobile/src/app/(tabs)/inbox/[id].tsx`

- [ ] **Step 1: Add imports and find conversation from cache**

Add import at the top of the file:

```typescript
import { formatLastActive } from '../../../lib/formatLastActive';
import { useConversations } from '../../../features/chat/hooks/useConversations';
```

Inside the component, after the existing `useMessages` call, add:

```typescript
const { data: conversationsData } = useConversations();
const conversation = useMemo(
  () => conversationsData?.data?.find((c) => c.id === id),
  [conversationsData, id],
);
const activity = formatLastActive(conversation?.counterparty_last_active_at);
```

Add `useMemo` to the React import if not already present.

- [ ] **Step 2: Replace the header in the main return block**

Replace the header View (the block starting with `<View className="flex-row items-center justify-between pb-md px-lg bg-card">` and ending just before the context card comment `{/* contextCard`):

```typescript
      <View className="flex-row items-center justify-between pb-md px-lg bg-card">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 justify-center items-center"
          testID="chat-back"
        >
          <ChevronLeft size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-subtitle font-bold text-foreground" numberOfLines={1}>
            {conversation?.counterparty_name ?? t('shared.inbox.chatTitle')}
          </Text>
          {activity.label && (
            <View className="flex-row items-center gap-xs" style={{ marginTop: 2 }}>
              {activity.isActive && (
                <View className="w-2 h-2 rounded-full bg-verified" />
              )}
              <Text className="text-micro text-muted-foreground">{activity.label}</Text>
            </View>
          )}
        </View>
        <View className="w-10 items-end">
          <ProfileAvatar
            uri={conversation?.counterparty_avatar_url ?? undefined}
            name={conversation?.counterparty_name ?? 'T'}
            size="sm"
          />
        </View>
      </View>
```

- [ ] **Step 3: Remove the context card**

Delete the entire context card block — from `{/* contextCard: shadow → imperative */}` through the closing `</View>` of the card (approximately lines 197-223 in the current file). Also remove the `activeTask` useMemo that feeds it (approximately lines 50-57) and the `Briefcase` icon from the lucide import.

Remove `elevations` from the tokenAdapter import if no longer used elsewhere in the file.

- [ ] **Step 4: Do the same header replacement for the error state**

The error state (the `if (isError)` branch) has a duplicate header. Apply the same counterparty name / activity label changes there.

- [ ] **Step 5: Remove unused imports**

Remove these if no longer referenced anywhere in the file:

- `Briefcase` from lucide-react-native import
- `elevations` from tokenAdapter import
- `useMemo` only if not used (it is now used for `conversation`, so keep it)

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @tasky/mobile exec tsc --noEmit --pretty
```

Expected: Clean.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/(tabs)/inbox/[id].tsx
git commit -m "feat(mobile): wire chat header to real counterparty data, remove context card"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Full typecheck across all workspaces**

```bash
pnpm -r typecheck
```

Expected: Clean.

- [ ] **Step 2: Run mobile tests**

```bash
pnpm --filter @tasky/mobile test --no-coverage
```

Expected: All passing tests still pass. The `formatLastActive` tests pass.

- [ ] **Step 3: Run backend tests**

```bash
./gradlew test
```

Expected: All pass.

- [ ] **Step 4: Validate API spec**

```bash
./gradlew openApiValidate
```

Expected: Valid.

- [ ] **Step 5: Validate migrations**

```bash
python3 tooling/scripts/validate-migrations.py
```

Expected: Pass.

- [ ] **Step 6: Final commit if any cleanup needed, otherwise done**

```bash
git status
```

Expected: Clean working tree. All changes committed across Tasks 1-10.
