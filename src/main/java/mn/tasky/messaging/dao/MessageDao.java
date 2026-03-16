package mn.tasky.messaging.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.messaging.dto.Message;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(Message.class)
public interface MessageDao {

    default void insert(
            String id,
            String conversationId,
            String senderId,
            String content,
            boolean phoneNumberFlagged,
            String contentHash,
            Instant sentAt) {
        insert(
                required(id, "id"),
                required(conversationId, "conversationId"),
                required(senderId, "senderId"),
                content,
                phoneNumberFlagged,
                contentHash,
                sentAt);
    }

    @SqlUpdate("INSERT INTO messages (id, conversation_id, sender_id, content, "
            + "phone_number_flagged, content_hash, sent_at) "
            + "VALUES (:id, :conversationId, :senderId, :content, "
            + ":phoneNumberFlagged, :contentHash, :sentAt)")
    void insert(
            @Bind("id") UUID id,
            @Bind("conversationId") UUID conversationId,
            @Bind("senderId") UUID senderId,
            @Bind("content") String content,
            @Bind("phoneNumberFlagged") boolean phoneNumberFlagged,
            @Bind("contentHash") String contentHash,
            @Bind("sentAt") Instant sentAt);

    default List<Message> findByConversationId(String conversationId, String cursor, int limit) {
        UUID conversationUuid = required(conversationId, "conversationId");
        return findByConversationId(conversationUuid, optional(cursor), limit);
    }

    default List<Message> findByConversationId(UUID conversationId, UUID cursor, int limit) {
        if (cursor == null) {
            return findByConversationIdFirstPage(conversationId, limit);
        }
        return findByConversationIdAfterCursor(conversationId, cursor, limit);
    }

    @SqlQuery("SELECT * FROM messages WHERE conversation_id = :conversationId " + "ORDER BY id LIMIT :limit")
    List<Message> findByConversationIdFirstPage(@Bind("conversationId") UUID conversationId, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM messages WHERE conversation_id = :conversationId "
            + "AND id > :cursor "
            + "ORDER BY id LIMIT :limit")
    List<Message> findByConversationIdAfterCursor(
            @Bind("conversationId") UUID conversationId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);
}
