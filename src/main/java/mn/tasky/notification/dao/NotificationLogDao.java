package mn.tasky.notification.dao;

import mn.tasky.notification.dto.NotificationLog;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(NotificationLog.class)
public interface NotificationLogDao {

    default void insert(
        String id, String userId, String type, String channel, String status,
        String eventKey, String providerMessageId, String errorCode, Instant createdAt) {
        insert(required(id,
                "id"),
            required(userId,
                "userId"),
            type,
            channel,
            status,
            eventKey,
            providerMessageId,
            errorCode,
            createdAt);
    }

    @SqlUpdate("INSERT INTO notification_log (id, user_id, type, channel, status, "
        + "event_key, provider_message_id, error_code, created_at) "
        + "VALUES (:id, :userId, :type, :channel, :status, "
        + ":eventKey, :providerMessageId, :errorCode, :createdAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("userId") UUID userId,
        @Bind("type") String type,
        @Bind("channel") String channel,
        @Bind("status") String status,
        @Bind("eventKey") String eventKey,
        @Bind("providerMessageId") String providerMessageId,
        @Bind("errorCode") String errorCode,
        @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT * FROM notification_log ORDER BY created_at DESC")
    List<NotificationLog> findAll();
}
