package mn.tasky.category.dto;

import java.time.Instant;

public record CategorySchemaVersion(
        String id,
        String categoryId,
        int version,
        String schemaJson,
        String status,
        String createdBy,
        Instant createdAt,
        Instant activatedAt) {}
