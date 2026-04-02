package mn.tasky.notification.dto;

import jakarta.validation.constraints.Size;

public record UnregisterDeviceRequest(@Size(max = 512) String token) {}
