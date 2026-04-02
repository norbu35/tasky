package mn.tasky.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OtpVerifyRequest(
        @NotBlank @Size(max = 64) @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phone,
        @NotBlank @Size(max = 64) @Pattern(regexp = "^[0-9]{4,6}$") String code,
        @JsonProperty("facebook_access_token") @Size(max = 512) String facebookAccessToken) {}
