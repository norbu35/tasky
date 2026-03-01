package mn.tasky.messaging.dao;

import mn.tasky.messaging.dto.Conversation;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(Conversation.class)
public interface ConversationDao {

    default void insert(String id, String taskId, String participant1Id, String participant2Id, Instant createdAt) {
        insert(
            required(id, "id"),
            required(taskId, "taskId"),
            required(participant1Id, "participant1Id"),
            required(participant2Id, "participant2Id"),
            createdAt);
    }

    @SqlUpdate("INSERT INTO conversations (id, task_id, participant1_id, participant2_id, created_at) "
            + "VALUES (:id, :taskId, :participant1Id, :participant2Id, :createdAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("taskId") UUID taskId,
        @Bind("participant1Id") UUID participant1Id,
        @Bind("participant2Id") UUID participant2Id,
        @Bind("createdAt") Instant createdAt);

    default Optional<Conversation> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM conversations WHERE id = :id")
    Optional<Conversation> findById(@Bind("id") UUID id);

    default Optional<Conversation> findByTaskAndParticipants(
        String taskId, String participant1Id, String participant2Id) {
        UUID taskUuid = required(taskId, "taskId");
        UUID p1Uuid = required(participant1Id, "participant1Id");
        UUID p2Uuid = required(participant2Id, "participant2Id");
        return findByTaskAndParticipants(taskUuid, p1Uuid, p2Uuid);
    }

    @SqlQuery("SELECT * FROM conversations WHERE task_id = :taskId "
        + "AND ((participant1_id = :p1 AND participant2_id = :p2) "
        + " OR (participant1_id = :p2 AND participant2_id = :p1))")
    Optional<Conversation> findByTaskAndParticipants(
        @Bind("taskId") UUID taskId, @Bind("p1") UUID participant1Id, @Bind("p2") UUID participant2Id);

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
        + "WHERE (participant1_id = :userId OR participant2_id = :userId) "
        + "ORDER BY id LIMIT :limit")
    List<Conversation> findByUserIdFirstPage(@Bind("userId") UUID userId, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM conversations "
        + "WHERE (participant1_id = :userId OR participant2_id = :userId) "
        + "AND id > :cursor "
        + "ORDER BY id LIMIT :limit")
    List<Conversation> findByUserIdAfterCursor(
        @Bind("userId") UUID userId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);
}
