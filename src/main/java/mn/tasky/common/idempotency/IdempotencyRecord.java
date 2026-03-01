package mn.tasky.common.idempotency;

import java.time.Instant;
import java.util.UUID;

public record IdempotencyRecord(
    UUID id,
    UUID userId,
    String operation,
    String idempotencyKey,
    String status,
    String resourceType,
    UUID resourceId,
    Instant createdAt,
    Instant updatedAt) {
}
