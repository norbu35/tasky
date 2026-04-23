package mn.tasky.trust.application.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TrustQueryHandlerTest {

    @Mock
    private ReviewService reviewService;

    @Mock
    private DisputeService disputeService;

    private TrustQueryHandler handler;

    @BeforeEach
    void setUp() {
        handler = new TrustQueryHandler(reviewService, disputeService);
    }

    @Test
    void listReviews_delegatesToReviewService() {
        List<Review> reviews = List.of();
        when(reviewService.listReviews("u1", "c1", 10)).thenReturn(reviews);

        List<Review> result = handler.listReviews("u1", "c1", 10);

        assertThat(result).isEmpty();
        verify(reviewService).listReviews("u1", "c1", 10);
    }

    @Test
    void listPendingDisputes_delegatesToDisputeService() {
        List<Dispute> disputes = List.of();
        when(disputeService.listPendingDisputes("c1", 10)).thenReturn(disputes);

        List<Dispute> result = handler.listPendingDisputes("c1", 10);

        assertThat(result).isEmpty();
        verify(disputeService).listPendingDisputes("c1", 10);
    }

    @Test
    void getDispute_returnsDispute() {
        Dispute dispute = new Dispute("d1", "b1", "c1", "t1", "OPEN", null, null, null, null, null);
        when(disputeService.getDispute("d1")).thenReturn(Optional.of(dispute));

        Optional<Dispute> result = handler.getDispute("d1");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("d1");
    }

    @Test
    void getDispute_returnsEmptyWhenNotFound() {
        when(disputeService.getDispute("missing")).thenReturn(Optional.empty());

        Optional<Dispute> result = handler.getDispute("missing");

        assertThat(result).isEmpty();
    }

    @Test
    void getDisputeForUser_delegatesToDisputeService() {
        Dispute dispute = new Dispute("d1", "b1", "c1", "t1", "OPEN", null, null, null, null, null);
        when(disputeService.getDisputeForUser("d1", "u1")).thenReturn(Optional.of(dispute));

        Optional<Dispute> result = handler.getDisputeForUser("d1", "u1");

        assertThat(result).isPresent();
        verify(disputeService).getDisputeForUser("d1", "u1");
    }

    @Test
    void getDisputeEvidence_delegatesToDisputeService() {
        List<DisputeEvidence> evidence = List.of();
        when(disputeService.getDisputeEvidence("d1")).thenReturn(evidence);

        List<DisputeEvidence> result = handler.getDisputeEvidence("d1");

        assertThat(result).isEmpty();
        verify(disputeService).getDisputeEvidence("d1");
    }

    @Test
    void hasOpenDispute_delegatesToDisputeService() {
        when(disputeService.hasOpenDispute("b1")).thenReturn(true);

        boolean result = handler.hasOpenDispute("b1");

        assertThat(result).isTrue();
        verify(disputeService).hasOpenDispute("b1");
    }

    @Test
    void hasOpenDispute_returnsFalse() {
        when(disputeService.hasOpenDispute("b2")).thenReturn(false);

        boolean result = handler.hasOpenDispute("b2");

        assertThat(result).isFalse();
    }
}
