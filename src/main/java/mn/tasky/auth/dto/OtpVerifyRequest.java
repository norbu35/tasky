package mn.tasky.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
    @NotBlank
    @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$")
    String phone,
    @NotBlank
    @Pattern(regexp = "^[0-9]{4,6}$")
    String code
) {
}
