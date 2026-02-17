package mn.tasky.notification.dao;

import mn.tasky.notification.dto.DeviceToken;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(DeviceToken.class)
public interface DeviceTokenDao {

    @SqlUpdate("INSERT INTO device_tokens (user_id, token, platform, created_at) "
             + "VALUES (CAST(:userId AS UUID), :token, :platform, :createdAt) "
             + "ON CONFLICT (user_id, token) DO UPDATE SET platform = :platform, created_at = :createdAt")
    void upsert(@Bind("userId") String userId,
                @Bind("token") String token,
                @Bind("platform") String platform,
                @Bind("createdAt") Instant createdAt);

    @SqlUpdate("DELETE FROM device_tokens WHERE user_id = CAST(:userId AS UUID) AND token = :token")
    void delete(@Bind("userId") String userId, @Bind("token") String token);

    @SqlQuery("SELECT token, platform, created_at FROM device_tokens WHERE user_id = CAST(:userId AS UUID)")
    List<DeviceToken> findByUserId(@Bind("userId") String userId);
}
