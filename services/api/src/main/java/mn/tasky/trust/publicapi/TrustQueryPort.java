package mn.tasky.trust.publicapi;

import java.util.List;
import java.util.Optional;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.review.dto.Review;

public interface TrustQueryPort {
    List<Review> listReviews(String userId, String cursor, int limit);

    List<Dispute> listPendingDisputes(String cursor, int limit);

    Optional<Dispute> getDispute(String disputeId);

    Optional<Dispute> getDisputeForUser(String disputeId, String userId);

    List<DisputeEvidence> getDisputeEvidence(String disputeId);
}
