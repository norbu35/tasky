package mn.tasky.auth.dto;

public record VerificationStatusResponse(
    String status,
    String adminNotes,
    String submittedAt,
    String reviewedAt
) {
}
