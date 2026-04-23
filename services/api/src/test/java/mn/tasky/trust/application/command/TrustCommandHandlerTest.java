package mn.tasky.trust.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import mn.tasky.review.dto.ReviewSubmitResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TrustCommandHandlerTest {

    @Mock
    private ReviewService reviewService;

    @Mock
    private DisputeService disputeService;

    @Mock
    private ReviewEnforcementService reviewEnforcementService;

    private TrustCommandHandler handler;

    @BeforeEach
    void setUp() {
        handler = new TrustCommandHandler(reviewService, disputeService, reviewEnforcementService);
    }

    @Test
    void submitReview_delegatesToReviewService() {
        Review review = new Review("r1", "b1", "author1", "target1", 5, 4, 5, 5, 5, "great", true, Instant.now());
        ReviewSubmitResult expected = new ReviewSubmitResult(review, null);
        when(reviewService.submitReview("author1", "b1", 5, 4, 5, 5, 5, "great", true))
                .thenReturn(expected);

        ReviewSubmitResult result = handler.submitReview("author1", "b1", 5, 4, 5, 5, 5, "great", true);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void raiseDispute_delegatesToDisputeService() {
        Dispute dispute = new Dispute("d1", "b1", "u1", "reason", "OPEN", null, null, null, Instant.now(), null);
        DisputeRaiseResult expected = DisputeRaiseResult.success(dispute);
        when(disputeService.raiseDispute("u1", "b1", "reason", List.of())).thenReturn(expected);

        DisputeRaiseResult result = handler.raiseDispute("u1", "b1", "reason", List.of());

        assertThat(result).isSameAs(expected);
    }

    @Test
    void resolveDispute_delegatesToDisputeService() {
        Dispute dispute = new Dispute(
                "d1",
                "b1",
                "u1",
                "reason",
                "RESOLVED_TASKER",
                "RESOLVE_TASKER",
                "u1",
                "notes",
                Instant.now(),
                Instant.now());
        DisputeResolutionResult expected = DisputeResolutionResult.success(dispute);
        when(disputeService.resolveDispute("admin1", "d1", "RESOLVE_TASKER", "notes"))
                .thenReturn(expected);

        DisputeResolutionResult result = handler.resolveDispute("admin1", "d1", "RESOLVE_TASKER", "notes");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void createReviewEnforcementCases_delegatesToReviewEnforcementService() {
        handler.createReviewEnforcementCases("b1", "c1", "tasker1");

        verify(reviewEnforcementService).createCasesForBooking("b1", "c1", "tasker1");
    }
}
