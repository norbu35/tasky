package mn.tasky.messaging.dto;

import java.time.Instant;

public record Conversation(String id, String taskId, String customerId, String taskerId, Instant createdAt) {
}
