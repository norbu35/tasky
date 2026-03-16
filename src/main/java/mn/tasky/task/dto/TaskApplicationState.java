package mn.tasky.task.dto;

import org.springframework.lang.Nullable;

import java.time.Instant;

public record TaskApplicationState(
    String id,
    String taskId,
    String taskerId,
    String taskerFullName,
    String taskerAvatarUrl,
    double taskerRatingAvg,
    int taskerCompletedTasks,
    boolean taskerIsPro,
    String message,
    String status,
    @Nullable Double relevanceScore,
    @Nullable Boolean recommended,
    @Nullable Instant selectedAt,
    @Nullable Instant respondByAt,
    Instant createdAt) {
}
