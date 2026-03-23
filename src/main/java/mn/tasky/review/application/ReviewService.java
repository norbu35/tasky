package mn.tasky.review.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.springframework.stereotype.Service;

/**
 * Service responsible for managing user reviews and ratings.
 * Allows participants of a completed booking to review each other.
 */
@Service
public class ReviewService {

    private final BookingService bookingService;
    private final AuthService authService;
    private final ReviewDao reviewDao;
    private final ReviewEnforcementService reviewEnforcementService;
    private final BadgeEvaluationService badgeEvaluationService;

    public ReviewService(
            BookingService bookingService,
            AuthService authService,
            ReviewDao reviewDao,
            ReviewEnforcementService reviewEnforcementService,
            BadgeEvaluationService badgeEvaluationService) {
        this.bookingService = bookingService;
        this.authService = authService;
        this.reviewDao = reviewDao;
        this.reviewEnforcementService = reviewEnforcementService;
        this.badgeEvaluationService = badgeEvaluationService;
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
    public ReviewSubmitResult submitReview(
            String authorId,
            String bookingId,
            Integer qualityRating,
            Integer punctualityRating,
            Integer communicationRating,
            Integer clarityRating,
            Integer respectfulnessRating,
            String comment) {

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        if (!"COMPLETED".equals(booking.status())) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_COMPLETED");
        }

        String targetUserId;
        boolean isCustomerReviewingTasker;
        if (booking.customerId().equals(authorId)) {
            targetUserId = booking.taskerId();
            isCustomerReviewingTasker = true;
        } else if (booking.taskerId().equals(authorId)) {
            targetUserId = booking.customerId();
            isCustomerReviewingTasker = false;
        } else {
            return new ReviewSubmitResult(null, "NOT_PARTICIPANT");
        }

        // Role-specific rating validation (REQ-SAFE-02)
        double reviewAverage;
        Integer effectiveClarityRating = clarityRating;
        Integer effectiveRespectfulnessRating = respectfulnessRating;
        Integer effectiveQualityRating = qualityRating;
        Integer effectiveCommunicationRating = communicationRating;
        if (isCustomerReviewingTasker) {
            // Customer reviewing Tasker: quality + punctuality + communication required
            if (!isValidRating(qualityRating)
                    || !isValidRating(punctualityRating)
                    || !isValidRating(communicationRating)) {
                return new ReviewSubmitResult(null, "INVALID_RATING");
            }
            // Null out fields not applicable to this direction
            effectiveClarityRating = null;
            effectiveRespectfulnessRating = null;
            reviewAverage = (qualityRating + punctualityRating + communicationRating) / 3.0;
        } else {
            // Tasker reviewing Customer: clarity + respectfulness + punctuality required
            if (!isValidRating(clarityRating)
                    || !isValidRating(respectfulnessRating)
                    || !isValidRating(punctualityRating)) {
                return new ReviewSubmitResult(null, "INVALID_RATING");
            }
            // Null out fields not applicable to this direction
            effectiveQualityRating = null;
            effectiveCommunicationRating = null;
            reviewAverage = (clarityRating + respectfulnessRating + punctualityRating) / 3.0;
        }

        if (reviewDao.existsByBookingIdAndReviewerId(bookingId, authorId)) {
            return new ReviewSubmitResult(null, "ALREADY_REVIEWED");
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        String sanitizedComment = TextSanitizer.plainText(comment);
        Review review = new Review(
                id,
                bookingId,
                authorId,
                targetUserId,
                effectiveQualityRating,
                punctualityRating,
                effectiveCommunicationRating,
                effectiveClarityRating,
                effectiveRespectfulnessRating,
                sanitizedComment,
                now);
        reviewDao.insert(
                id,
                bookingId,
                authorId,
                targetUserId,
                effectiveQualityRating,
                punctualityRating,
                effectiveCommunicationRating,
                effectiveClarityRating,
                effectiveRespectfulnessRating,
                sanitizedComment,
                now);

        authService.updateUserStats(targetUserId, reviewAverage, false);

        reviewEnforcementService.resolveCase(bookingId, authorId);

        badgeEvaluationService.evaluate(targetUserId);

        return new ReviewSubmitResult(review, null);
    }

    private static boolean isValidRating(Integer rating) {
        return rating != null && rating >= 1 && rating <= 5;
    }

    /**
     * Lists reviews directed at a specific user with pagination.
     *
     * @param userId The ID of the target user receiving the reviews.
     * @param cursor The pagination cursor.
     * @param limit  The maximum number of reviews to return.
     * @return A list of {@link Review} objects.
     */
    public List<Review> listReviews(String userId, String cursor, int limit) {
        return reviewDao.findByRevieweeId(userId, cursor, limit);
    }
}
