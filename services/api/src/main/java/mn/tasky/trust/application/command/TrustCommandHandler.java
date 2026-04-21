package mn.tasky.trust.application.command;

import java.util.List;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.application.ReviewService;
import mn.tasky.review.dto.ReviewSubmitResult;
import mn.tasky.trust.publicapi.TrustCommandPort;
import org.springframework.stereotype.Service;

@Service
public class TrustCommandHandler implements TrustCommandPort {
    private final ReviewService reviewService;
    private final DisputeService disputeService;
    private final ReviewEnforcementService reviewEnforcementService;

    public TrustCommandHandler(
            ReviewService reviewService,
            DisputeService disputeService,
            ReviewEnforcementService reviewEnforcementService) {
        this.reviewService = reviewService;
        this.disputeService = disputeService;
        this.reviewEnforcementService = reviewEnforcementService;
    }

    @Override
    public ReviewSubmitResult submitReview(
            String authorId,
            String bookingId,
            Integer qualityRating,
            Integer punctualityRating,
            Integer communicationRating,
            Integer clarityRating,
            Integer respectfulnessRating,
            String comment) {
        return reviewService.submitReview(
                authorId,
                bookingId,
                qualityRating,
                punctualityRating,
                communicationRating,
                clarityRating,
                respectfulnessRating,
                comment);
    }

    @Override
    public DisputeRaiseResult raiseDispute(
            String userId, String bookingId, String reason, List<DisputeRequest.EvidenceItem> evidenceItems) {
        return disputeService.raiseDispute(userId, bookingId, reason, evidenceItems);
    }

    @Override
    public DisputeResolutionResult resolveDispute(
            String adminId, String disputeId, String outcome, String resolutionNotes) {
        return disputeService.resolveDispute(adminId, disputeId, outcome, resolutionNotes);
    }

    @Override
    public void createReviewEnforcementCases(String bookingId, String customerId, String taskerId) {
        reviewEnforcementService.createCasesForBooking(bookingId, customerId, taskerId);
    }
}
