package mn.tasky.messaging.dto;

import java.time.Instant;

public record Conversation(
    String id,
    String taskId,
    String participant1Id,
    String participant2Id,
    Instant createdAt
) {

}
