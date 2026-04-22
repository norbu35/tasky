package mn.tasky.task.dto;

import java.time.Instant;
import java.util.List;
import org.springframework.lang.Nullable;

public record TaskState(
        String id,
        String customerId,
        String categoryId,
        String description,
        @Nullable Integer budget,
        double locationLat,
        double locationLng,
        String locationText,
        String status,
        Instant scheduledAt,
        String pricingMode,
        @Nullable List<String> photoKeys,
        @Nullable String intakeAnswersJson,
        @Nullable Integer intakeSchemaVersion,
        @Nullable String scopeSummarySource,
        Instant createdAt,
        Instant updatedAt) {}
