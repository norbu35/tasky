package mn.tasky.task.dto;

import java.time.Instant;
import java.util.List;

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
    List<String> photoKeys,
    Instant createdAt,
    Instant updatedAt
) {
}
