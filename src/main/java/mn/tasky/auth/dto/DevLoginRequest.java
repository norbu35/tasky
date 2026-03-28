package mn.tasky.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DevLoginRequest(
        @NotBlank @Size(max = 64) @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phone,
        @NotBlank @Size(max = 64) @Pattern(regexp = "^(CUSTOMER|TASKER)$") String role) {}
