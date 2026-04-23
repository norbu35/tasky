package mn.tasky.runtime.publicapi.composition;

import mn.tasky.review.dto.ReviewRequest;
import mn.tasky.trust.publicapi.TrustCommandPort;
import org.springframework.stereotype.Component;

@Component
public class ReviewSubmissionService {

    private final TrustCommandPort trustCommandPort;
    private final ReviewPublicCompositionService reviewPublicCompositionService;

    public ReviewSubmissionService(
            TrustCommandPort trustCommandPort, ReviewPublicCompositionService reviewPublicCompositionService) {
        this.trustCommandPort = trustCommandPort;
        this.reviewPublicCompositionService = reviewPublicCompositionService;
    }

    public ReviewSubmissionOutcome submitReview(String userId, String bookingId, ReviewRequest body) {
        var result = trustCommandPort.submitReview(
                userId,
                bookingId,
                body.qualityRating(),
                body.punctualityRating(),
                body.communicationRating(),
                body.clarityRating(),
                body.respectfulnessRating(),
                body.comment(),
                body.wouldBookAgain());

        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "INVALID_RATING" -> ReviewSubmissionOutcome.failure(
                        ReviewSubmissionOutcome.Status.INVALID_RATING,
                        "INVALID_RATING",
                        "Rating must be between 1 and 5");
                case "BOOKING_NOT_FOUND" -> ReviewSubmissionOutcome.failure(
                        ReviewSubmissionOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found");
                case "BOOKING_NOT_COMPLETED" -> ReviewSubmissionOutcome.failure(
                        ReviewSubmissionOutcome.Status.BOOKING_NOT_COMPLETED,
                        "BOOKING_NOT_COMPLETED",
                        "Reviews allowed only on completed bookings");
                case "NOT_PARTICIPANT" -> ReviewSubmissionOutcome.failure(
                        ReviewSubmissionOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only booking participants can leave reviews");
                case "ALREADY_REVIEWED" -> ReviewSubmissionOutcome.failure(
                        ReviewSubmissionOutcome.Status.ALREADY_REVIEWED,
                        "ALREADY_REVIEWED",
                        "You have already reviewed this booking");
                default -> ReviewSubmissionOutcome.internalError();
            };
        }

        return ReviewSubmissionOutcome.success(reviewPublicCompositionService.reviewResponse(result.review()));
    }
}
