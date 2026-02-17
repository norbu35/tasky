package mn.tasky.notification.dao;

import mn.tasky.notification.dto.NotificationLog;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(NotificationLog.class)
public interface NotificationLogDao {

    @SqlUpdate("INSERT INTO notification_log (id, user_id, type, channel, status, created_at) "
             + "VALUES (CAST(:id AS UUID), CAST(:userId AS UUID), :type, :channel, :status, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("userId") String userId,
                @Bind("type") String type,
                @Bind("channel") String channel,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT * FROM notification_log ORDER BY created_at DESC")
    List<NotificationLog> findAll();
}
