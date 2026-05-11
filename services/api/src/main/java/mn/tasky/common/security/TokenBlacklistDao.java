package mn.tasky.common.security;

import java.time.Instant;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface TokenBlacklistDao {

    @SqlUpdate("INSERT INTO token_blacklist (jti, expires_at) VALUES (:jti, :expiresAt) ON CONFLICT DO NOTHING")
    void insert(@Bind("jti") String jti, @Bind("expiresAt") Instant expiresAt);

    @SqlQuery("SELECT COUNT(*) FROM token_blacklist WHERE jti = :jti")
    boolean exists(@Bind("jti") String jti);

    @SqlUpdate("DELETE FROM token_blacklist WHERE expires_at < :now")
    int deleteExpired(@Bind("now") Instant now);
}
