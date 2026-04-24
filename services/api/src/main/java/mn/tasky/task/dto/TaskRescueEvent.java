package mn.tasky.task.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record TaskRescueEvent(
        String id,
        String taskId,
        Instant triggeredAt,
        String triggerWindow,
        @Nullable String actionsJson,
        @Nullable String interventionType,
        @Nullable String interventionStage,
        Instant createdAt) {}
