package mn.tasky.dispute.dto;

import java.time.Instant;

public record Dispute(
    String id,
    String bookingId,
    String raisedBy,
    String reason,
    String status,
    String resolutionAction,
    String wrongfulPartyUserId,
    String resolutionNotes,
    Instant createdAt,
    Instant resolvedAt) {
}
