package mn.tasky.review.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.review.dto.ReviewEnforcementCase;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(ReviewEnforcementCase.class)
public interface ReviewEnforcementCaseDao {

    default void insert(String id, String bookingId, String userId, String reasonCode) {
        insert(required(id, "id"), required(bookingId, "bookingId"), required(userId, "userId"), reasonCode);
    }

    @SqlUpdate("INSERT INTO review_enforcement_cases (id, booking_id, user_id, reason_code) "
            + "VALUES (:id, :bookingId, :userId, :reasonCode)")
    void insert(
            @Bind("id") UUID id,
            @Bind("bookingId") UUID bookingId,
            @Bind("userId") UUID userId,
            @Bind("reasonCode") String reasonCode);

    default List<ReviewEnforcementCase> findOpenByUser(String userId) {
        return findOpenByUser(required(userId, "userId"));
    }

    @SqlQuery("SELECT * FROM review_enforcement_cases "
            + "WHERE user_id = :userId AND status NOT IN ('COMPLETED', 'EXPIRED') "
            + "ORDER BY triggered_at DESC")
    List<ReviewEnforcementCase> findOpenByUser(@Bind("userId") UUID userId);

    default Optional<ReviewEnforcementCase> findByBookingAndUser(String bookingId, String userId) {
        return findByBookingAndUser(required(bookingId, "bookingId"), required(userId, "userId"));
    }

    @SqlQuery("SELECT * FROM review_enforcement_cases "
            + "WHERE booking_id = :bookingId AND user_id = :userId")
    Optional<ReviewEnforcementCase> findByBookingAndUser(
            @Bind("bookingId") UUID bookingId, @Bind("userId") UUID userId);

    default void updateStatus(String id, String status, Instant resolvedAt) {
        updateStatus(required(id, "id"), status, resolvedAt);
    }

    @SqlUpdate("UPDATE review_enforcement_cases "
            + "SET status = :status, resolved_at = :resolvedAt WHERE id = :id")
    void updateStatus(
            @Bind("id") UUID id, @Bind("status") String status, @Bind("resolvedAt") Instant resolvedAt);

    default int countConsecutiveExpired(String userId) {
        return countConsecutiveExpired(required(userId, "userId"));
    }

    @SqlQuery("SELECT COUNT(*) FROM ("
            + "SELECT status FROM review_enforcement_cases "
            + "WHERE user_id = :userId ORDER BY triggered_at DESC LIMIT 2"
            + ") sub WHERE sub.status = 'EXPIRED'")
    int countConsecutiveExpired(@Bind("userId") UUID userId);

    default void setInvestigationActive(String id, boolean active) {
        setInvestigationActive(required(id, "id"), active);
    }

    @SqlUpdate("UPDATE review_enforcement_cases SET investigation_active = :active WHERE id = :id")
    void setInvestigationActive(@Bind("id") UUID id, @Bind("active") boolean active);

    default boolean hasInvestigationActive(String userId) {
        return hasInvestigationActive(required(userId, "userId"));
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM review_enforcement_cases "
            + "WHERE user_id = :userId AND investigation_active = true "
            + "AND status NOT IN ('COMPLETED', 'EXPIRED'))")
    boolean hasInvestigationActive(@Bind("userId") UUID userId);
}
