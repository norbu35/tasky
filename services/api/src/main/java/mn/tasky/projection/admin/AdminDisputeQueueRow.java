package mn.tasky.projection.admin;

import java.time.Instant;

public record AdminDisputeQueueRow(
        String id,
        String bookingId,
        String raisedBy,
        String reason,
        String status,
        String resolutionAction,
        String wrongfulPartyUserId,
        String resolutionNotes,
        Instant createdAt,
        Instant resolvedAt) {}
