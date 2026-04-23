package mn.tasky.trust.publicapi;

import java.util.List;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.review.dto.ReviewSubmitResult;

public interface TrustCommandPort {
    ReviewSubmitResult submitReview(
            String authorId,
            String bookingId,
            Integer qualityRating,
            Integer punctualityRating,
            Integer communicationRating,
            Integer clarityRating,
            Integer respectfulnessRating,
            String comment,
            Boolean wouldBookAgain);

    DisputeRaiseResult raiseDispute(
            String userId, String bookingId, String reason, List<DisputeRequest.EvidenceItem> evidenceItems);

    DisputeResolutionResult resolveDispute(String adminId, String disputeId, String outcome, String resolutionNotes);

    /**
     * Create review enforcement cases for a completed booking's participants.
     */
    void createReviewEnforcementCases(String bookingId, String customerId, String taskerId);
}
