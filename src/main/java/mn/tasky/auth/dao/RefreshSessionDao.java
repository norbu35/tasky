package mn.tasky.auth.dao;

import mn.tasky.auth.dto.RefreshSession;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.Optional;

@RegisterConstructorMapper(RefreshSession.class)
public interface RefreshSessionDao {

    @SqlUpdate("INSERT INTO refresh_sessions (token_id, user_id, expires_at) VALUES (:tokenId, :userId, :expiresAt)")
    void insert(@Bind("tokenId") String tokenId,
                @Bind("userId") String userId,
                @Bind("expiresAt") Instant expiresAt);

    @SqlQuery("DELETE FROM refresh_sessions WHERE token_id = :tokenId RETURNING user_id, expires_at")
    Optional<RefreshSession> findAndDelete(@Bind("tokenId") String tokenId);
}
