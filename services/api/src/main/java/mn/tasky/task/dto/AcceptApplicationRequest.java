package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record AcceptApplicationRequest(
        @NotNull(message = "liability_disclaimer_accepted is required") @JsonProperty("liability_disclaimer_accepted")
                Boolean liabilityDisclaimerAccepted) {

    @AssertTrue(message = "liability_disclaimer_accepted must be true")
    public boolean isLiabilityDisclaimerAccepted() {
        return Boolean.TRUE.equals(liabilityDisclaimerAccepted);
    }
}
