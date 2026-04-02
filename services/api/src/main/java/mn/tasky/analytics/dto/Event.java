package mn.tasky.analytics.dto;

import java.time.Instant;
import java.util.Map;
import org.jdbi.v3.json.Json;

public record Event(String id, String name, String userId, @Json Map<String, Object> properties, Instant timestamp) {}
