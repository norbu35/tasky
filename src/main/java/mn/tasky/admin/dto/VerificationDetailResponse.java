package mn.tasky.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record VerificationDetailResponse(
    String id,
    @JsonProperty("user_id")
    String userId,
    @JsonProperty("user_phone")
    String userPhone,
    @JsonProperty("user_name")
    String userName,
    @JsonProperty("id_card_front_url")
    String idCardFrontUrl,
    @JsonProperty("id_card_back_url")
    String idCardBackUrl,
    String status,
    @JsonProperty("admin_notes")
    String adminNotes,
    @JsonProperty("submitted_at")
    String submittedAt,
    @JsonProperty("reviewed_at")
    String reviewedAt
) {
}
