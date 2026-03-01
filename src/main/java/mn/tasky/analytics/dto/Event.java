package mn.tasky.analytics.dto;

import org.jdbi.v3.json.Json;

import java.time.Instant;
import java.util.Map;

public record Event(
    String id,
    String name,
    String userId,
    @Json
    Map<String, Object> properties,
    Instant timestamp
) {

}
