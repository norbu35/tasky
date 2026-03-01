package mn.tasky.common.outbox;

import java.time.Instant;
import java.util.UUID;

public record OutboxEvent(
    UUID id,
    String eventType,
    String aggregateType,
    UUID aggregateId,
    String payload,
    String status,
    int attempts,
    Instant availableAt,
    Instant createdAt,
    Instant processedAt,
    String lastError) {
}
