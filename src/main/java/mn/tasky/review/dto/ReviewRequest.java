package mn.tasky.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @Min(1) @Max(5) Integer qualityRating,
        @Min(1) @Max(5) Integer punctualityRating,
        @Min(1) @Max(5) Integer communicationRating,
        @Min(1) @Max(5) Integer clarityRating,
        @Min(1) @Max(5) Integer respectfulnessRating,
        @Size(max = 1000) String comment) {}
