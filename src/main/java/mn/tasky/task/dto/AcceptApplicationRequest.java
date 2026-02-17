package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AcceptApplicationRequest(
    @JsonProperty("liability_disclaimer_accepted") Boolean liabilityDisclaimerAccepted
) {
}
