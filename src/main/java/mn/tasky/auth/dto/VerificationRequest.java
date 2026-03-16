package mn.tasky.auth.dto;

import java.time.Instant;

public record VerificationRequest(
        String id,
        String userId,
        String idCardFrontKey,
        String idCardBackKey,
        String status,
        Instant submittedAt,
        String adminNotes,
        Instant reviewedAt) {}
