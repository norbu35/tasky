package mn.tasky.review.dao;

import mn.tasky.review.dto.Review;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(Review.class)
public interface ReviewDao {

    @SqlUpdate("INSERT INTO reviews (id, booking_id, author_id, target_user_id, rating, comment, created_at) "
             + "VALUES (CAST(:id AS UUID), CAST(:bookingId AS UUID), CAST(:authorId AS UUID), "
             + "CAST(:targetUserId AS UUID), :rating, :comment, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("bookingId") String bookingId,
                @Bind("authorId") String authorId,
                @Bind("targetUserId") String targetUserId,
                @Bind("rating") int rating,
                @Bind("comment") String comment,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT * FROM reviews WHERE target_user_id = CAST(:userId AS UUID) "
            + "AND (:cursor IS NULL OR id > CAST(:cursor AS UUID)) "
            + "ORDER BY id LIMIT :limit")
    List<Review> findByTargetUserId(@Bind("userId") String userId,
                                    @Bind("cursor") String cursor,
                                    @Bind("limit") int limit);

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM reviews WHERE booking_id = CAST(:bookingId AS UUID) AND author_id = CAST(:authorId AS UUID))")
    boolean existsByBookingIdAndAuthorId(@Bind("bookingId") String bookingId, @Bind("authorId") String authorId);
}
