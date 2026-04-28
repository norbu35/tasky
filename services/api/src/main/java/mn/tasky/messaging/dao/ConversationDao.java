package mn.tasky.messaging.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.EnrichedConversation;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(Conversation.class)
@RegisterConstructorMapper(EnrichedConversation.class)
public interface ConversationDao {

    default void insert(String id, String taskId, String customerId, String taskerId, Instant createdAt) {
        insert(
                required(id, "id"),
                required(taskId, "taskId"),
                required(customerId, "customerId"),
                required(taskerId, "taskerId"),
                createdAt);
    }

    @SqlUpdate("INSERT INTO conversations (id, task_id, customer_id, tasker_id, created_at) "
            + "VALUES (:id, :taskId, :customerId, :taskerId, :createdAt)")
    void insert(
            @Bind("id") UUID id,
            @Bind("taskId") UUID taskId,
            @Bind("customerId") UUID customerId,
            @Bind("taskerId") UUID taskerId,
            @Bind("createdAt") Instant createdAt);

    default Optional<Conversation> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM conversations WHERE id = :id")
    Optional<Conversation> findById(@Bind("id") UUID id);

    default boolean isParticipant(String userId, String conversationId) {
        return isParticipant(required(userId, "userId"), required(conversationId, "conversationId"));
    }

    @SqlQuery("SELECT EXISTS("
            + "SELECT 1 FROM conversations "
            + "WHERE id = :id AND (customer_id = :userId OR tasker_id = :userId))")
    boolean isParticipant(@Bind("userId") UUID userId, @Bind("id") UUID conversationId);

    default Optional<Conversation> findByTaskAndParticipants(String taskId, String customerId, String taskerId) {
        UUID taskUuid = required(taskId, "taskId");
        UUID customerUuid = required(customerId, "customerId");
        UUID taskerUuid = required(taskerId, "taskerId");
        return findByTaskAndParticipants(taskUuid, customerUuid, taskerUuid);
    }

    @SqlQuery("SELECT * FROM conversations WHERE task_id = :taskId "
            + "AND customer_id = :customerId AND tasker_id = :taskerId")
    Optional<Conversation> findByTaskAndParticipants(
            @Bind("taskId") UUID taskId, @Bind("customerId") UUID customerId, @Bind("taskerId") UUID taskerId);

    default List<Conversation> findByUserId(String userId) {
        return findByUserId(userId, null, 100);
    }

    default List<Conversation> findByUserId(String userId, String cursor, int limit) {
        return findByUserId(required(userId, "userId"), optional(cursor), limit);
    }

    default List<Conversation> findByUserId(UUID userId, UUID cursor, int limit) {
        if (cursor == null) {
            return findByUserIdFirstPage(userId, limit);
        }
        return findByUserIdAfterCursor(userId, cursor, limit);
    }

    @SqlQuery("SELECT * FROM conversations "
            + "WHERE (customer_id = :userId OR tasker_id = :userId) "
            + "ORDER BY created_at DESC, id DESC LIMIT :limit")
    List<Conversation> findByUserIdFirstPage(@Bind("userId") UUID userId, @Bind("limit") int limit);

    @SqlQuery("WITH cursor_row AS (SELECT created_at, id FROM conversations WHERE id = :cursor) "
            + "SELECT c.* FROM conversations c, cursor_row cursor_row "
            + "WHERE (c.customer_id = :userId OR c.tasker_id = :userId) "
            + "AND (c.created_at < cursor_row.created_at "
            + "OR (c.created_at = cursor_row.created_at AND c.id < cursor_row.id)) "
            + "ORDER BY c.created_at DESC, c.id DESC LIMIT :limit")
    List<Conversation> findByUserIdAfterCursor(
            @Bind("userId") UUID userId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);

    default List<EnrichedConversation> findEnriched(String userId, String cursor, int limit) {
        ConversationCursor parsed = ConversationCursor.parse(cursor);
        if (parsed == null) {
            return findEnrichedFirstPage(userId, limit);
        }
        return findEnrichedAfterCursor(userId, parsed.sortAt(), parsed.id(), limit);
    }

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
    List<EnrichedConversation> findEnrichedFirstPage(@Bind("userId") String userId, @Bind("limit") int limit);

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
            + "  AND (COALESCE(lm.sent_at, c.created_at) < :cursorSortAt "
            + "       OR (CAST(:cursorId AS UUID) IS NOT NULL "
            + "           AND COALESCE(lm.sent_at, c.created_at) = :cursorSortAt "
            + "           AND c.id < CAST(:cursorId AS UUID))) "
            + "ORDER BY COALESCE(lm.sent_at, c.created_at) DESC, c.id DESC "
            + "LIMIT :limit")
    List<EnrichedConversation> findEnrichedAfterCursor(
            @Bind("userId") String userId,
            @Bind("cursorSortAt") Instant cursorSortAt,
            @Bind("cursorId") UUID cursorId,
            @Bind("limit") int limit);

    record ConversationCursor(Instant sortAt, UUID id) {
        static ConversationCursor parse(String cursor) {
            if (cursor == null || cursor.isBlank()) {
                return null;
            }
            int separator = cursor.lastIndexOf('|');
            if (separator < 0) {
                return new ConversationCursor(Instant.parse(cursor), null);
            }
            if (separator == 0 || separator == cursor.length() - 1) {
                throw new IllegalArgumentException("Invalid conversation cursor");
            }
            return new ConversationCursor(
                    Instant.parse(cursor.substring(0, separator)),
                    required(cursor.substring(separator + 1), "cursorId"));
        }
    }
}
