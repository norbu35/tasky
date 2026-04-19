package mn.tasky.review.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @JsonProperty("quality_rating") @Min(1) @Max(5) Integer qualityRating,
        @JsonProperty("punctuality_rating") @Min(1) @Max(5) Integer punctualityRating,
        @JsonProperty("communication_rating") @Min(1) @Max(5) Integer communicationRating,
        @JsonProperty("clarity_rating") @Min(1) @Max(5) Integer clarityRating,
        @JsonProperty("respectfulness_rating") @Min(1) @Max(5) Integer respectfulnessRating,
        @Size(max = 1000) String comment) {}
