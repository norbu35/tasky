package mn.tasky.review.application;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.springframework.stereotype.Service;

/**
 * Service responsible for managing user reviews and ratings.
 * Allows participants of a reviewable terminal booking outcome to review each other.
 */
@Service
public class ReviewService {

    private final BookingService bookingService;
    private final UserProfileService userProfileService;
    private final ReviewDao reviewDao;
    private final ReviewEnforcementService reviewEnforcementService;
    private final BadgeEvaluationService badgeEvaluationService;
    private static final Set<String> REVIEWABLE_STATUSES = Set.of("COMPLETED", "CANCELLED", "NO_SHOW");

    public ReviewService(
            BookingService bookingService,
            UserProfileService userProfileService,
            ReviewDao reviewDao,
            ReviewEnforcementService reviewEnforcementService,
            BadgeEvaluationService badgeEvaluationService) {
        this.bookingService = bookingService;
        this.userProfileService = userProfileService;
        this.reviewDao = reviewDao;
        this.reviewEnforcementService = reviewEnforcementService;
        this.badgeEvaluationService = badgeEvaluationService;
    }

    /**
     * Submits a rating and review for a reviewable terminal booking.
     * Validates that the submitter is a participant, the booking is reviewable,
     * and that the submitter hasn't already reviewed this booking.
     * Updates the target user's aggregate rating statistics.
     *
     * @param authorId  The ID of the user submitting the review.
     * @param bookingId The ID of the reviewable booking.
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
            String comment,
            Boolean wouldBookAgain) {

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        if (!REVIEWABLE_STATUSES.contains(booking.status())) {
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

        if (!"COMPLETED".equals(booking.status())
                && !reviewEnforcementService.hasCaseForBookingAndUser(bookingId, authorId)) {
            return new ReviewSubmitResult(null, "BOOKING_NOT_COMPLETED");
        }

        // Role-specific rating validation (REQ-P1-SAFE-02)
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
                isCustomerReviewingTasker ? wouldBookAgain : null,
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
                isCustomerReviewingTasker ? wouldBookAgain : null,
                now);

        userProfileService.updateUserStats(targetUserId, reviewAverage, false);

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
