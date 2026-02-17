package mn.tasky.auth.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;

public interface StrikeDao {

    @SqlUpdate("INSERT INTO tasker_strikes (id, user_id, reason, created_at) VALUES (:id, :userId, :reason, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("userId") String userId,
                @Bind("reason") String reason,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT COUNT(*) FROM tasker_strikes WHERE user_id = :userId AND created_at > :since")
    long countSince(@Bind("userId") String userId, @Bind("since") Instant since);
}
