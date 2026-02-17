package mn.tasky.messaging.dao;

import mn.tasky.messaging.dto.Conversation;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(Conversation.class)
public interface ConversationDao {

    @SqlUpdate("INSERT INTO conversations (id, task_id, participant1_id, participant2_id, created_at) "
             + "VALUES (CAST(:id AS UUID), CAST(:taskId AS UUID), CAST(:participant1Id AS UUID), CAST(:participant2Id AS UUID), :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("taskId") String taskId,
                @Bind("participant1Id") String participant1Id,
                @Bind("participant2Id") String participant2Id,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT * FROM conversations WHERE id = CAST(:id AS UUID)")
    Optional<Conversation> findById(@Bind("id") String id);

    @SqlQuery("SELECT * FROM conversations WHERE task_id = CAST(:taskId AS UUID) "
            + "AND ((participant1_id = CAST(:p1 AS UUID) AND participant2_id = CAST(:p2 AS UUID)) "
            + " OR (participant1_id = CAST(:p2 AS UUID) AND participant2_id = CAST(:p1 AS UUID)))")
    Optional<Conversation> findByTaskAndParticipants(@Bind("taskId") String taskId,
                                                     @Bind("p1") String participant1Id,
                                                     @Bind("p2") String participant2Id);

    @SqlQuery("SELECT * FROM conversations "
            + "WHERE participant1_id = CAST(:userId AS UUID) OR participant2_id = CAST(:userId AS UUID) "
            + "ORDER BY created_at DESC")
    List<Conversation> findByUserId(@Bind("userId") String userId);
}
