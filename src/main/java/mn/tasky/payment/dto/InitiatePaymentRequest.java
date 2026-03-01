package mn.tasky.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record InitiatePaymentRequest(
    @JsonProperty("liability_disclaimer_accepted")
    @NotNull
    @AssertTrue(message = "Liability disclaimer must be accepted to initiate payment.")
    Boolean liabilityDisclaimerAccepted) {
}
