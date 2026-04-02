package mn.tasky.messaging.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.messaging.dto.Conversation;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(Conversation.class)
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
            + "ORDER BY id LIMIT :limit")
    List<Conversation> findByUserIdFirstPage(@Bind("userId") UUID userId, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM conversations "
            + "WHERE (customer_id = :userId OR tasker_id = :userId) "
            + "AND id > :cursor "
            + "ORDER BY id LIMIT :limit")
    List<Conversation> findByUserIdAfterCursor(
            @Bind("userId") UUID userId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);
}
