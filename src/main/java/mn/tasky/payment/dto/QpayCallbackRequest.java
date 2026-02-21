package mn.tasky.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QpayCallbackRequest(
        @JsonProperty("payment_id")
        @NotBlank
        String paymentId,
        @JsonProperty("status")
        @NotBlank
        String status,
        @JsonProperty("timestamp")
        @NotNull
        Long timestamp,
        @JsonProperty("signature")
        @NotBlank
        String signature
) {

}
