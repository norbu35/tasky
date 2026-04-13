package mn.tasky.kernel.idempotency;

import java.time.Instant;

public record EventIdempotencyRecord(String eventId, String eventType, String handler, Instant processedAt) {}
