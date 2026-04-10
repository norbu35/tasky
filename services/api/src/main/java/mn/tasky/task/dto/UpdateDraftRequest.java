package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record UpdateDraftRequest(
        @JsonProperty("intake_answers") JsonNode intakeAnswers,
        @JsonProperty("summary_draft") @Size(max = 2000) String summaryDraft,
        @JsonProperty("location_lat") @DecimalMin("-90.0") @DecimalMax("90.0") Double locationLat,
        @JsonProperty("location_lng") @DecimalMin("-180.0") @DecimalMax("180.0") Double locationLng,
        @JsonProperty("location_text") @Size(max = 500) String locationText) {

    @AssertTrue(message = "location_lat and location_lng must both be present or both be absent")
    @JsonIgnore
    public boolean isLocationPairValid() {
        return (locationLat == null) == (locationLng == null);
    }
}
