package mn.tasky.task.dto;

import java.util.List;
import org.springframework.lang.Nullable;

public record CreateTask(
        String categoryId,
        String description,
        @Nullable Integer budget,
        double locationLat,
        double locationLng,
        String locationText,
        String scheduledAt,
        String pricingMode,
        List<String> photoKeys,
        String intakeAnswersJson,
        Integer intakeSchemaVersion,
        String scopeSummary,
        String draftId) {}
