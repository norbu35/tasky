package mn.tasky.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenBody(
    @JsonProperty("refresh_token")
    @NotBlank
    String refreshToken
) {
}
