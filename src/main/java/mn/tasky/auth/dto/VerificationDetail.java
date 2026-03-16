package mn.tasky.auth.dto;

import java.time.Instant;

public record VerificationDetail(
    String id,
    String userId,
    String userPhone,
    String userName,
    String idCardFrontUrl,
    String idCardBackUrl,
    String status,
    String adminNotes,
    String submittedAt,
    String reviewedAt,
    String consentPolicyVersion,
    Instant consentAcceptedAt,
    String danReference) {
}
