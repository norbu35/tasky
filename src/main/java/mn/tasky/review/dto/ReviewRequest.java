package mn.tasky.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotNull @Min(1) @Max(5) Integer qualityRating,
        @NotNull @Min(1) @Max(5) Integer punctualityRating,
        @NotNull @Min(1) @Max(5) Integer communicationRating,
        @NotNull @Min(1) @Max(5) Integer clarityRating,
        @NotNull @Min(1) @Max(5) Integer respectfulnessRating,
        @Size(max = 1000) String comment) {}
