package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record VerificationSubmitRequest(
    @JsonProperty("id_card_front_key")
    @NotBlank
    String idCardFrontKey,
    @JsonProperty("id_card_back_key")
    @NotBlank
    String idCardBackKey
) {

}
