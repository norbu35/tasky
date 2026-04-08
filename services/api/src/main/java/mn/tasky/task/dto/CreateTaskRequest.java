package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateTaskRequest(
        @JsonProperty("category_id") @NotBlank @Size(max = 512) String categoryId,
        @NotBlank @Size(min = 10, max = 2000) String description,
        @Min(5000) @Max(50_000_000) int budget,
        @JsonProperty("location_lat") @NotNull @Min(-90) @Max(90) double locationLat,
        @JsonProperty("location_lng") @NotNull @Min(-180) @Max(180) double locationLng,
        @JsonProperty("location_text") @NotBlank @Size(min = 5, max = 500) String locationText,
        @JsonProperty("scheduled_at") @NotBlank @Size(max = 64) String scheduledAt,
        @JsonProperty("photo_keys") @Size(max = 3) List<String> photoKeys,
        @JsonProperty("intake_answers") @NotNull JsonNode intakeAnswersJson,
        @JsonProperty("intake_schema_version") Integer intakeSchemaVersion,
        @JsonProperty("scope_summary") @Size(max = 2000) String scopeSummary,
        @JsonProperty("draft_id") @Size(max = 512) String draftId) {}
