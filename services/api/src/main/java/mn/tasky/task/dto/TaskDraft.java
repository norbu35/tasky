package mn.tasky.task.dto;

import java.time.Instant;

public record TaskDraft(
        String id,
        String customerId,
        String categoryId,
        String intakeAnswersJson,
        int intakeSchemaVersion,
        String summaryDraft,
        Double locationLat,
        Double locationLng,
        String locationText,
        Instant createdAt,
        Instant expiresAt) {}
