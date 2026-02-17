package mn.tasky.task.dto;

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
        Instant createdAt
) {

}
