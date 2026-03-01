package mn.tasky.notification.dto;

import java.time.Instant;

public record NotificationLog(
    String id, String userId, String type, String channel, String status, Instant createdAt) {
}
