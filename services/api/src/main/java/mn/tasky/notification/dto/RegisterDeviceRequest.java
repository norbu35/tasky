package mn.tasky.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterDeviceRequest(
        @NotBlank @Size(max = 512) String token,
        @NotBlank @Size(max = 32) @Pattern(regexp = "IOS|ANDROID|WEB") String platform) {}
