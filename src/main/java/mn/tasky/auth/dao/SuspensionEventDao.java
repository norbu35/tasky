package mn.tasky.auth.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

public interface SuspensionEventDao {

    default void insert(
        String id, String userId, int strikeCount, int suspensionDays, Instant suspendedAt, Instant unsuspendedAt) {
        insert(required(id, "id"), required(userId, "userId"), strikeCount, suspensionDays, suspendedAt, unsuspendedAt);
    }

    @SqlUpdate("INSERT INTO suspension_events (id, user_id, strike_count, suspension_days, "
        + "suspended_at, unsuspended_at) "
        + "VALUES (:id, :userId, :strikeCount, :suspensionDays, :suspendedAt, "
        + ":unsuspendedAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("userId") UUID userId,
        @Bind("strikeCount") int strikeCount,
        @Bind("suspensionDays") int suspensionDays,
        @Bind("suspendedAt") Instant suspendedAt,
        @Bind("unsuspendedAt") Instant unsuspendedAt);

    default long countSince(String userId, Instant since) {
        return countSince(required(userId, "userId"), since);
    }

    @SqlQuery("SELECT COUNT(*) FROM suspension_events WHERE user_id = :userId AND suspended_at >=" + " :since")
    long countSince(@Bind("userId") UUID userId, @Bind("since") Instant since);

    default void markUnsuspended(String userId, Instant unsuspendedAt) {
        markUnsuspended(required(userId, "userId"), unsuspendedAt);
    }

    @SqlUpdate("UPDATE suspension_events "
        + "SET unsuspended_at = :unsuspendedAt "
        + "WHERE user_id = :userId AND unsuspended_at IS NULL")
    void markUnsuspended(@Bind("userId") UUID userId, @Bind("unsuspendedAt") Instant unsuspendedAt);
}
