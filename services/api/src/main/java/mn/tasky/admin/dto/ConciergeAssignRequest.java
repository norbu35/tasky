package mn.tasky.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConciergeAssignRequest(
        @NotBlank @Size(max = 512) @JsonProperty("tasker_id") String taskerId,
        @NotBlank @Size(min = 3, max = 500) @JsonProperty("override_reason") String overrideReason,
        @NotNull @JsonProperty("liability_disclaimer_accepted") Boolean liabilityDisclaimerAccepted) {}
