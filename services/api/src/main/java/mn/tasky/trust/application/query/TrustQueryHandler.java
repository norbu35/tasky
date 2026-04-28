package mn.tasky.trust.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.Review;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Service;

@Service
public class TrustQueryHandler implements TrustQueryPort {
    private final ReviewService reviewService;
    private final DisputeService disputeService;
    private final ReviewEnforcementService reviewEnforcementService;

    public TrustQueryHandler(
            ReviewService reviewService,
            DisputeService disputeService,
            ReviewEnforcementService reviewEnforcementService) {
        this.reviewService = reviewService;
        this.disputeService = disputeService;
        this.reviewEnforcementService = reviewEnforcementService;
    }

    @Override
    public List<Review> listReviews(String userId, String cursor, int limit) {
        return reviewService.listReviews(userId, cursor, limit);
    }

    @Override
    public List<Dispute> listPendingDisputes(String cursor, int limit) {
        return disputeService.listPendingDisputes(cursor, limit);
    }

    @Override
    public Optional<Dispute> getDispute(String disputeId) {
        return disputeService.getDispute(disputeId);
    }

    @Override
    public Optional<Dispute> getDisputeForUser(String disputeId, String userId) {
        return disputeService.getDisputeForUser(disputeId, userId);
    }

    @Override
    public List<DisputeEvidence> getDisputeEvidence(String disputeId) {
        return disputeService.getDisputeEvidence(disputeId);
    }

    @Override
    public boolean hasOpenDispute(String bookingId) {
        return disputeService.hasOpenDispute(bookingId);
    }

    @Override
    public boolean isUserLocked(String userId) {
        return reviewEnforcementService.isUserLocked(userId);
    }
}
