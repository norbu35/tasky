package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateTaskRequest(
        @JsonProperty("category_id")
        @NotBlank
        String categoryId,

        @NotBlank
        @Size(min = 10, max = 2000)
        String description,

        @Min(5000)
        int budget,

        @JsonProperty("location_lat")
        @NotNull
        double locationLat,

        @JsonProperty("location_lng")
        @NotNull
        double locationLng,

        @JsonProperty("location_text")
        @NotBlank
        @Size(min = 5, max = 500)
        String locationText,

        @JsonProperty("scheduled_at")
        @NotBlank
        String scheduledAt,

        @JsonProperty("photo_keys")
        @Size(max = 3)
        List<String> photoKeys
) {

}
