package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VerificationStatusApiResponse(
    String status,
    @JsonProperty("admin_notes")
    String adminNotes,
    @JsonProperty("submitted_at")
    String submittedAt,
    @JsonProperty("reviewed_at")
    String reviewedAt
) {
}
