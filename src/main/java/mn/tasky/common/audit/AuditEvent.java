package mn.tasky.common.audit;

import java.time.Instant;

public record AuditEvent(
        String id,
        String actorUserId,
        String action,
        String resourceType,
        String resourceId,
        String metadataJson,
        Instant createdAt) {}
