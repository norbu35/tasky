package mn.tasky.task.dto;

import java.util.List;

public record CreateTask(
    String categoryId,
    String description,
    int budget,
    double locationLat,
    double locationLng,
    String locationText,
    String scheduledAt,
    List<String> photoKeys
) {

}
