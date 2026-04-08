package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerificationSubmitRequest(
        @JsonProperty("id_card_front_key") @NotBlank @Size(max = 512) String idCardFrontKey,
        @JsonProperty("id_card_back_key") @NotBlank @Size(max = 512) String idCardBackKey,
        @JsonProperty("selfie_key") @NotBlank @Size(max = 512) String selfieKey,
        @JsonProperty("consent_policy_version") @NotBlank @Size(max = 64) String consentPolicyVersion,
        @JsonProperty("consent_accepted") @NotNull Boolean consentAccepted) {}
