package mn.tasky.auth.dao;

import java.time.Instant;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface RateLimitCounterDao {

    @SqlUpdate("DELETE FROM rate_limit_counters WHERE expires_at <= :now")
    void deleteExpired(@Bind("now") Instant now);

    @SqlQuery("INSERT INTO rate_limit_counters "
            + "(rate_key, window_start, attempt_count, expires_at, updated_at) "
            + "VALUES (:rateKey, :now, 1, :expiresAt, :now) "
            + "ON CONFLICT (rate_key) DO UPDATE SET "
            + "window_start = CASE "
            + "  WHEN rate_limit_counters.window_start <= :cutoff THEN :now "
            + "  ELSE rate_limit_counters.window_start "
            + "END, "
            + "attempt_count = CASE "
            + "  WHEN rate_limit_counters.window_start <= :cutoff THEN 1 "
            + "  ELSE rate_limit_counters.attempt_count + 1 "
            + "END, "
            + "expires_at = CASE "
            + "  WHEN rate_limit_counters.window_start <= :cutoff THEN :expiresAt "
            + "  ELSE rate_limit_counters.expires_at "
            + "END, "
            + "updated_at = :now "
            + "RETURNING attempt_count")
    int incrementAndGet(
            @Bind("rateKey") String rateKey,
            @Bind("now") Instant now,
            @Bind("cutoff") Instant cutoff,
            @Bind("expiresAt") Instant expiresAt);
}
