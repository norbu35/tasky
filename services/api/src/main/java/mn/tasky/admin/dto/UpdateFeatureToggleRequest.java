package mn.tasky.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateFeatureToggleRequest(
        @JsonProperty("feature_name") @NotBlank String featureName,
        @JsonProperty("is_enabled") @NotNull Boolean isEnabled) {}
