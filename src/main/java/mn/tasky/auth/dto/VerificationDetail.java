package mn.tasky.auth.dto;

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
    String reviewedAt
) {
}
