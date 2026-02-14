package mn.tasky.auth.dto;

import java.time.Instant;

public record AuditLogEntry(
    String id,
    String adminId,
    String action,
    String targetId,
    String reason,
    Instant createdAt
) {}
