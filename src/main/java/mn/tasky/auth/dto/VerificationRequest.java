package mn.tasky.auth.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

public record VerificationRequest(
        @Size(max = 512) String id,
        @Size(max = 512) String userId,
        @Size(max = 512) String idCardFrontKey,
        @Size(max = 512) String idCardBackKey,
        @Size(max = 64) String status,
        Instant submittedAt,
        @Size(max = 2000) String adminNotes,
        Instant reviewedAt) {}
