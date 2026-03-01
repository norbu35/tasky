package mn.tasky.review.application;

import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for managing user reviews and ratings.
 * Allows participants of a completed booking to review each other.
 */
@Service
public class ReviewService {

    private final BookingService bookingService;
    private final AuthService authService;
    private final ReviewDao reviewDao;

    public ReviewService(BookingService bookingService,
                         AuthService authService,
                         ReviewDao reviewDao) {
        this.bookingService = bookingService;
        this.authService    = authService;
        this.reviewDao      = reviewDao;
    }

    /**
     * Submits a rating and review for a completed booking.
     * Validates that the submitter is a participant, the booking is completed,
     * and that the submitter hasn't already reviewed this booking.
     * Updates the target user's aggregate rating statistics.
     *
     * @param authorId  The ID of the user submitting the review.
     * @param bookingId The ID of the completed booking.
     * @param rating    The integer rating (1 to 5).
     * @param comment   An optional text review/comment.
     * @return A {@link ReviewSubmitResult} containing the created Review or an error.
     */
    public ReviewSubmitResult submitReview(String authorId,
                                           String bookingId,
                                           int rating,
                                           String comment) {
        if (rating < 1 || rating > 5) {
            return new ReviewSubmitResult(null,
                                          "INVALID_RATING");
        }

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return new ReviewSubmitResult(null,
                                          "BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        if (!"COMPLETED".equals(booking.status())) {
            return new ReviewSubmitResult(null,
                                          "BOOKING_NOT_COMPLETED");
        }

        String targetUserId;
        if (booking.customerId()
                .equals(authorId)) {
            targetUserId = booking.taskerId();
        } else if (booking.taskerId()
                .equals(authorId)) {
            targetUserId = booking.customerId();
        } else {
            return new ReviewSubmitResult(null,
                                          "NOT_PARTICIPANT");
        }

        if (reviewDao.existsByBookingIdAndAuthorId(bookingId,
                                                   authorId)) {
            return new ReviewSubmitResult(null,
                                          "ALREADY_REVIEWED");
        }

        String id = UUID.randomUUID()
                .toString();
        Instant now = Instant.now();
        String sanitizedComment = TextSanitizer.plainText(comment);
        Review review = new Review(id,
                                   bookingId,
                                   authorId,
                                   targetUserId,
                                   rating,
                                   sanitizedComment,
                                   now);
        reviewDao.insert(id,
                         bookingId,
                         authorId,
                         targetUserId,
                         rating,
                         sanitizedComment,
                         now);

        authService.updateUserStats(targetUserId,
                                    rating,
                                    false);

        return new ReviewSubmitResult(review,
                                      null);
    }

    /**
     * Lists reviews directed at a specific user with pagination.
     *
     * @param userId The ID of the target user receiving the reviews.
     * @param cursor The pagination cursor.
     * @param limit  The maximum number of reviews to return.
     * @return A list of {@link Review} objects.
     */
    public List<Review> listReviews(String userId,
                                    String cursor,
                                    int limit) {
        return reviewDao.findByTargetUserId(userId,
                                            cursor,
                                            limit);
    }
}
