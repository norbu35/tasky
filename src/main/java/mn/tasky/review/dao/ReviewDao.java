package mn.tasky.review.dao;

import mn.tasky.review.dto.Review;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(Review.class)
public interface ReviewDao {

    default void insert(
        String id,
        String bookingId,
        String authorId,
        String targetUserId,
        int rating,
        String comment,
        Instant createdAt) {
        insert(
            required(id, "id"),
            required(bookingId, "bookingId"),
            required(authorId, "authorId"),
            required(targetUserId, "targetUserId"),
            rating,
            comment,
            createdAt);
    }

    @SqlUpdate("INSERT INTO reviews (id, booking_id, author_id, target_user_id, rating, comment, " + "created_at) "
        + "VALUES (:id, :bookingId, :authorId, :targetUserId, :rating, :comment, "
        + ":createdAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("bookingId") UUID bookingId,
        @Bind("authorId") UUID authorId,
        @Bind("targetUserId") UUID targetUserId,
        @Bind("rating") int rating,
        @Bind("comment") String comment,
        @Bind("createdAt") Instant createdAt);

    default List<Review> findByTargetUserId(String userId, String cursor, int limit) {
        UUID userUuid = required(userId, "userId");
        return findByTargetUserId(userUuid, optional(cursor), limit);
    }

    default List<Review> findByTargetUserId(UUID userId, UUID cursor, int limit) {
        if (cursor == null) {
            return findByTargetUserIdFirstPage(userId, limit);
        }
        return findByTargetUserIdAfterCursor(userId, cursor, limit);
    }

    @SqlQuery("SELECT * FROM reviews WHERE target_user_id = :userId " + "ORDER BY id LIMIT :limit")
    List<Review> findByTargetUserIdFirstPage(@Bind("userId") UUID userId, @Bind("limit") int limit);

    @SqlQuery(
        "SELECT * FROM reviews WHERE target_user_id = :userId " + "AND id > :cursor " + "ORDER BY id LIMIT :limit")
    List<Review> findByTargetUserIdAfterCursor(
        @Bind("userId") UUID userId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);

    default boolean existsByBookingIdAndAuthorId(String bookingId, String authorId) {
        UUID bookingUuid = required(bookingId, "bookingId");
        UUID authorUuid = required(authorId, "authorId");
        return existsByBookingIdAndAuthorId(bookingUuid, authorUuid);
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM reviews WHERE booking_id = :bookingId AND author_id = " + ":authorId)")
    boolean existsByBookingIdAndAuthorId(@Bind("bookingId") UUID bookingId, @Bind("authorId") UUID authorId);
}
