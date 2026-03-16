package mn.tasky.auth.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

public interface StrikeDao {

    default void insert(String id, String userId, String reason, String bookingId, Instant createdAt) {
        insert(required(id,
                "id"),
            required(userId,
                "userId"),
            reason,
            optional(bookingId),
            createdAt);
    }

    @SqlUpdate("INSERT INTO tasker_strikes (id, user_id, reason, booking_id, created_at) VALUES (:id, "
        + ":userId, :reason, :bookingId, :createdAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("userId") UUID userId,
        @Bind("reason") String reason,
        @Bind("bookingId") UUID bookingId,
        @Bind("createdAt") Instant createdAt);

    default long countSince(String userId, Instant since) {
        return countSince(required(userId,
                "userId"),
            since);
    }

    @SqlQuery("SELECT COUNT(*) FROM tasker_strikes WHERE user_id = :userId AND created_at > :since")
    long countSince(@Bind("userId") UUID userId, @Bind("since") Instant since);
}
