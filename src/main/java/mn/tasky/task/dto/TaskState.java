package mn.tasky.task.dto;

import java.time.Instant;
import java.util.List;
import org.springframework.lang.Nullable;

public record TaskState(
    String id,
    String customerId,
    String categoryId,
    String description,
    int budget,
    double locationLat,
    double locationLng,
    String locationText,
    String status,
    Instant scheduledAt,
    @Nullable List<String> photoKeys,
    Instant createdAt,
    Instant updatedAt
) {
}
