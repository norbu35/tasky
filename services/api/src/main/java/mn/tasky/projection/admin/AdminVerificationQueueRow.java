package mn.tasky.projection.admin;

import java.time.Instant;

public record AdminVerificationQueueRow(
        String id,
        String userId,
        String encryptedUserPhone,
        String userName,
        String idCardFrontKey,
        String idCardBackKey,
        String status,
        String adminNotes,
        Instant submittedAt,
        Instant reviewedAt) {}
