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

    /**
     * Checks if the given booking has an open dispute.
     * Used by booking completion to block completion when a dispute is active.
     */
    boolean hasOpenDispute(String bookingId);

    /**
     * Returns true when a user's unresolved review obligations block new marketplace actions.
     */
    boolean isUserLocked(String userId);
}
