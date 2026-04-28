package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewRequest;
import mn.tasky.review.dto.ReviewSubmitResult;
import mn.tasky.trust.publicapi.TrustCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewSubmissionServiceTests {

    @Mock
    private TrustCommandPort trustCommandPort;

    @Mock
    private ReviewPublicCompositionService reviewPublicCompositionService;

    private ReviewSubmissionService service;

    private final String userId = "user-001";
    private final String bookingId = "booking-001";

    private ReviewRequest defaultRequest() {
        return new ReviewRequest(5, 4, 5, 4, 5, true, "Great work!");
    }

    private Review defaultReview() {
        return new Review(
                "review-001", bookingId, userId, "tasker-001", 5, 4, 5, 4, 5, "Great work!", true, Instant.now());
    }

    @BeforeEach
    void setUp() {
        service = new ReviewSubmissionService(trustCommandPort, reviewPublicCompositionService);
    }

    @Nested
    @DisplayName("submitReview")
    class SubmitReview {

        @Test
        @DisplayName("Successful review submission returns SUCCESS")
        void success() {
            Review review = defaultReview();
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(review, null));
            when(reviewPublicCompositionService.reviewResponse(review)).thenReturn(Map.of("id", "review-001"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", "review-001");
        }

        @Test
        @DisplayName("INVALID_RATING error returns INVALID_RATING outcome")
        void invalidRating() {
            when(trustCommandPort.submitReview(userId, bookingId, 6, 4, 5, 4, 5, "Bad", true))
                    .thenReturn(new ReviewSubmitResult(null, "INVALID_RATING"));

            ReviewRequest badRequest = new ReviewRequest(6, 4, 5, 4, 5, true, "Bad");
            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, badRequest);

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.INVALID_RATING);
            assertThat(outcome.errorCode()).isEqualTo("INVALID_RATING");
        }

        @Test
        @DisplayName("BOOKING_NOT_FOUND error returns NOT_FOUND outcome")
        void bookingNotFound() {
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(null, "BOOKING_NOT_FOUND"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.NOT_FOUND);
        }

        @Test
        @DisplayName("BOOKING_NOT_COMPLETED error returns BOOKING_NOT_COMPLETED outcome")
        void bookingNotCompleted() {
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(null, "BOOKING_NOT_COMPLETED"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.BOOKING_NOT_COMPLETED);
        }

        @Test
        @DisplayName("NOT_PARTICIPANT error returns FORBIDDEN outcome")
        void notParticipant() {
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(null, "NOT_PARTICIPANT"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("ALREADY_REVIEWED error returns ALREADY_REVIEWED outcome")
        void alreadyReviewed() {
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(null, "ALREADY_REVIEWED"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.ALREADY_REVIEWED);
        }

        @Test
        @DisplayName("Unknown error returns INTERNAL_ERROR outcome")
        void unknownError() {
            when(trustCommandPort.submitReview(userId, bookingId, 5, 4, 5, 4, 5, "Great work!", true))
                    .thenReturn(new ReviewSubmitResult(null, "UNKNOWN"));

            ReviewSubmissionOutcome outcome = service.submitReview(userId, bookingId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(ReviewSubmissionOutcome.Status.INTERNAL_ERROR);
        }
    }
}
