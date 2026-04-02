package mn.tasky.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ConfirmBookingIntentRequest(
        @JsonProperty("liability_disclaimer_accepted") Boolean liabilityDisclaimerAccepted) {}
