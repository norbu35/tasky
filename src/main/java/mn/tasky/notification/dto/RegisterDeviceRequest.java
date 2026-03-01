package mn.tasky.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterDeviceRequest(
    @NotBlank String token, @NotBlank @Pattern(regexp = "IOS|ANDROID|WEB") String platform) {
}
