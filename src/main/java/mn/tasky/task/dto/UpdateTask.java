package mn.tasky.task.dto;

import java.util.List;

public record UpdateTask(
        String description,
        Integer budget,
        Double locationLat,
        Double locationLng,
        String locationText,
        String scheduledAt,
        List<String> photoKeys) {}
