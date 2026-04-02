package mn.tasky.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QpayCallbackRequest(
        @JsonProperty("payment_id") @NotBlank @Size(max = 512) String paymentId,
        @JsonProperty("status") @NotBlank @Size(max = 64) String status,
        @JsonProperty("timestamp") @NotNull Long timestamp,
        @JsonProperty("signature") @NotBlank @Size(max = 512) String signature) {}
