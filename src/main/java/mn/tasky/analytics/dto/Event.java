package mn.tasky.analytics.dto;

import java.time.Instant;
import java.util.Map;

public record Event(
    String id,
    String name,
    String userId,
    Map<String, Object> properties,
    Instant timestamp
) {}
