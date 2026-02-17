package mn.tasky.notification.dao;

import mn.tasky.notification.dto.DeviceToken;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(DeviceToken.class)
public interface DeviceTokenDao {

    @SqlUpdate("INSERT INTO device_tokens (user_id, token, platform, created_at) "
             + "VALUES (:userId, :token, :platform, :createdAt) "
             + "ON CONFLICT (user_id, token) DO UPDATE SET platform = :platform, created_at = :createdAt")
    void upsert(@Bind("userId") UUID userId,
                @Bind("token") String token,
                @Bind("platform") String platform,
                @Bind("createdAt") Instant createdAt);

    default void upsert(String userId, String token, String platform, Instant createdAt) {
        upsert(required(userId, "userId"), token, platform, createdAt);
    }

    @SqlUpdate("DELETE FROM device_tokens WHERE user_id = :userId AND token = :token")
    void delete(@Bind("userId") UUID userId, @Bind("token") String token);

    default void delete(String userId, String token) {
        delete(required(userId, "userId"), token);
    }

    @SqlQuery("SELECT token, platform, created_at FROM device_tokens WHERE user_id = :userId")
    List<DeviceToken> findByUserId(@Bind("userId") UUID userId);

    default List<DeviceToken> findByUserId(String userId) {
        return findByUserId(required(userId, "userId"));
    }
}
