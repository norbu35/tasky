package mn.tasky.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpRequest(
        @NotBlank
        @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$")
        String phone
) {

}
