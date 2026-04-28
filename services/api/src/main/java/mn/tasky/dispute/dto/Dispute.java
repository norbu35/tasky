package mn.tasky.dispute.dto;

import java.time.Instant;
import org.jdbi.v3.core.mapper.reflect.JdbiConstructor;

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
        Instant resolvedAt,
        Instant evidenceReminderSentAt,
        Instant evidenceDueAt) {

    @JdbiConstructor
    public Dispute {}

    public Dispute(
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
        this(
                id,
                bookingId,
                raisedBy,
                reason,
                status,
                resolutionAction,
                wrongfulPartyUserId,
                resolutionNotes,
                createdAt,
                resolvedAt,
                null,
                null);
    }
}
