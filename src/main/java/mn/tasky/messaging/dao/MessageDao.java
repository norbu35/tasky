package mn.tasky.messaging.dao;

import mn.tasky.messaging.dto.Message;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(Message.class)
public interface MessageDao {

    @SqlUpdate("INSERT INTO messages (id, conversation_id, sender_id, content, sent_at) "
             + "VALUES (CAST(:id AS UUID), CAST(:conversationId AS UUID), CAST(:senderId AS UUID), :content, :sentAt)")
    void insert(@Bind("id") String id,
                @Bind("conversationId") String conversationId,
                @Bind("senderId") String senderId,
                @Bind("content") String content,
                @Bind("sentAt") Instant sentAt);

    @SqlQuery("SELECT * FROM messages WHERE conversation_id = CAST(:conversationId AS UUID) "
            + "AND (:cursor IS NULL OR id > CAST(:cursor AS UUID)) "
            + "ORDER BY id LIMIT :limit")
    List<Message> findByConversationId(@Bind("conversationId") String conversationId,
                                       @Bind("cursor") String cursor,
                                       @Bind("limit") int limit);
}
