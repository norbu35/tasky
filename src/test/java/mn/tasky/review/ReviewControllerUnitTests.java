package mn.tasky.review;

import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.review.api.ReviewController;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewRequest;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewControllerUnitTests {

    @Mock
    private ReviewService reviewService;

    private ReviewController controller;

    @BeforeEach
    void setUp() {
        controller = new ReviewController(reviewService);
    }

    @Test
    void submitReviewMapsKnownErrors() {
        JwtPrincipal principal = new JwtPrincipal(uuid(1),
            "CUSTOMER",
            "ACTIVE");
        when(reviewService.submitReview(principal.userId(),
            uuid(2),
            5,
            "great"))
            .thenReturn(new ReviewSubmitResult(null,
                "ALREADY_REVIEWED"));

        ResponseEntity<?> response = controller.submitReview(
            principal,
            uuid(2),
            new ReviewRequest(5,
                "great")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "ALREADY_REVIEWED");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d",
            suffix);
    }

    @Test
    void submitReviewReturnsCreatedWhenServiceSucceeds() {
        JwtPrincipal principal = new JwtPrincipal(uuid(3),
            "CUSTOMER",
            "ACTIVE");
        Review review = new Review(
            uuid(4),
            uuid(5),
            principal.userId(),
            uuid(6),
            5,
            "great",
            Instant.parse("2026-02-17T00:00:00Z")
        );
        when(reviewService.submitReview(principal.userId(),
            review.bookingId(),
            review.rating(),
            review.comment()))
            .thenReturn(new ReviewSubmitResult(review,
                null));

        ResponseEntity<?> response = controller.submitReview(
            principal,
            review.bookingId(),
            new ReviewRequest(review.rating(),
                review.comment())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id",
            review.id());
    }
}
