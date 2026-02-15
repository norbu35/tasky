package mn.tasky.messaging.dto;

import java.time.Instant;

public record Message(
    String id,
    String conversationId,
    String senderId,
    String content,
    Instant sentAt
) {}
