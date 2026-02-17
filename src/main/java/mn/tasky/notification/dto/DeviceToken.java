package mn.tasky.notification.dto;

import java.time.Instant;

public record DeviceToken(String token, String platform, Instant createdAt) {

}
