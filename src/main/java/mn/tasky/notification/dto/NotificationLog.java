package mn.tasky.notification.dto;

import org.springframework.lang.Nullable;

import java.time.Instant;

public record NotificationLog(
    String id, String userId, String type, String channel, String status,
    @Nullable String eventKey, @Nullable String providerMessageId, @Nullable String errorCode,
    Instant createdAt) {
}
