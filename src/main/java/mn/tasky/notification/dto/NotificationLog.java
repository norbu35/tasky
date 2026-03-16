package mn.tasky.notification.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record NotificationLog(
        String id,
        String userId,
        String type,
        String channel,
        String status,
        @Nullable String eventKey,
        @Nullable String providerMessageId,
        @Nullable String errorCode,
        Instant createdAt) {}
