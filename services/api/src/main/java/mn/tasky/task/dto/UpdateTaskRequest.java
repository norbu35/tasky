package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateTaskRequest(
        @Size(min = 10, max = 2000) String description,
        @Min(20000) Integer budget,
        @JsonProperty("location_lat") Double locationLat,
        @JsonProperty("location_lng") Double locationLng,
        @JsonProperty("location_text") @Size(min = 5, max = 500) String locationText,
        @JsonProperty("scheduled_at") @Size(max = 64) String scheduledAt,
        @JsonProperty("photo_keys") @Size(max = 3) List<String> photoKeys) {}
