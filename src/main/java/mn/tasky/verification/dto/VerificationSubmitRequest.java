package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerificationSubmitRequest(
        @JsonProperty("id_card_front_key") @NotBlank String idCardFrontKey,
        @JsonProperty("id_card_back_key") @NotBlank String idCardBackKey,
        @JsonProperty("consent_policy_version") @NotBlank String consentPolicyVersion,
        @JsonProperty("consent_accepted") @NotNull Boolean consentAccepted) {}
