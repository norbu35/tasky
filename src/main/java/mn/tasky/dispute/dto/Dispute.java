package mn.tasky.dispute.dto;

import java.time.Instant;

public record Dispute(
    String id,
    String bookingId,
    String raiserId,
    String reason,
    String status,
    String outcome,
    String resolvedBy,
    String resolutionNotes,
    Instant createdAt,
    Instant resolvedAt) {
}
