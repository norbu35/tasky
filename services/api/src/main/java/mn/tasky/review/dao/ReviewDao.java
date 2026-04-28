package mn.tasky.review.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.review.dto.Review;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(Review.class)
public interface ReviewDao {

    default void insert(
            String id,
            String bookingId,
            String reviewerId,
            String revieweeId,
            Integer qualityRating,
            Integer punctualityRating,
            Integer communicationRating,
            Integer clarityRating,
            Integer respectfulnessRating,
            String comment,
            Boolean wouldBookAgain,
            Instant createdAt) {
        insert(
                required(id, "id"),
                required(bookingId, "bookingId"),
                required(reviewerId, "reviewerId"),
                required(revieweeId, "revieweeId"),
                qualityRating,
                punctualityRating,
                communicationRating,
                clarityRating,
                respectfulnessRating,
                comment,
                wouldBookAgain,
                createdAt);
    }

    @SqlUpdate("INSERT INTO booking_reviews (id, booking_id, reviewer_id, reviewee_id, "
            + "quality_rating, punctuality_rating, communication_rating, clarity_rating, respectfulness_rating, "
            + "comment, would_book_again, created_at) "
            + "VALUES (:id, :bookingId, :reviewerId, :revieweeId, "
            + ":qualityRating, :punctualityRating, :communicationRating, :clarityRating, :respectfulnessRating, "
            + ":comment, :wouldBookAgain, :createdAt)")
    void insert(
            @Bind("id") UUID id,
            @Bind("bookingId") UUID bookingId,
            @Bind("reviewerId") UUID reviewerId,
            @Bind("revieweeId") UUID revieweeId,
            @Bind("qualityRating") Integer qualityRating,
            @Bind("punctualityRating") Integer punctualityRating,
            @Bind("communicationRating") Integer communicationRating,
            @Bind("clarityRating") Integer clarityRating,
            @Bind("respectfulnessRating") Integer respectfulnessRating,
            @Bind("comment") String comment,
            @Bind("wouldBookAgain") Boolean wouldBookAgain,
            @Bind("createdAt") Instant createdAt);

    default List<Review> findByRevieweeId(String userId, String cursor, int limit) {
        UUID userUuid = required(userId, "userId");
        return findByRevieweeId(userUuid, optional(cursor), limit);
    }

    default List<Review> findByRevieweeId(UUID userId, UUID cursor, int limit) {
        if (cursor == null) {
            return findByRevieweeIdFirstPage(userId, limit);
        }
        return findByRevieweeIdAfterCursor(userId, cursor, limit);
    }

    @SqlQuery("SELECT id, booking_id, reviewer_id, reviewee_id, "
            + "quality_rating, punctuality_rating, communication_rating, clarity_rating, respectfulness_rating, "
            + "comment, would_book_again, created_at "
            + "FROM booking_reviews WHERE reviewee_id = :userId "
            + "ORDER BY created_at DESC, id DESC LIMIT :limit")
    List<Review> findByRevieweeIdFirstPage(@Bind("userId") UUID userId, @Bind("limit") int limit);

    @SqlQuery("WITH cursor_row AS (SELECT created_at, id FROM booking_reviews WHERE id = :cursor) "
            + "SELECT r.id, r.booking_id, r.reviewer_id, r.reviewee_id, "
            + "r.quality_rating, r.punctuality_rating, r.communication_rating, r.clarity_rating, "
            + "r.respectfulness_rating, r.comment, r.would_book_again, r.created_at "
            + "FROM booking_reviews r, cursor_row c "
            + "WHERE r.reviewee_id = :userId "
            + "AND (r.created_at < c.created_at OR (r.created_at = c.created_at AND r.id < c.id)) "
            + "ORDER BY r.created_at DESC, r.id DESC LIMIT :limit")
    List<Review> findByRevieweeIdAfterCursor(
            @Bind("userId") UUID userId, @Bind("cursor") UUID cursor, @Bind("limit") int limit);

    default boolean existsByBookingIdAndReviewerId(String bookingId, String reviewerId) {
        UUID bookingUuid = required(bookingId, "bookingId");
        UUID reviewerUuid = required(reviewerId, "reviewerId");
        return existsByBookingIdAndReviewerId(bookingUuid, reviewerUuid);
    }

    @SqlQuery(
            "SELECT EXISTS(SELECT 1 FROM booking_reviews WHERE booking_id = :bookingId AND reviewer_id = :reviewerId)")
    boolean existsByBookingIdAndReviewerId(@Bind("bookingId") UUID bookingId, @Bind("reviewerId") UUID reviewerId);

    default java.util.Optional<Double> averagePunctualityByRevieweeSince(String revieweeId, Instant since) {
        return averagePunctualityByRevieweeSince(required(revieweeId, "revieweeId"), since);
    }

    @SqlQuery("SELECT AVG(punctuality_rating) FROM booking_reviews "
            + "WHERE reviewee_id = :revieweeId AND created_at >= :since AND punctuality_rating IS NOT NULL")
    java.util.Optional<Double> averagePunctualityByRevieweeSince(
            @Bind("revieweeId") UUID revieweeId, @Bind("since") Instant since);
}
