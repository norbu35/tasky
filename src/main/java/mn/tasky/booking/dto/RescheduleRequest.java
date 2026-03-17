package mn.tasky.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record RescheduleRequest(
        @NotNull @JsonProperty("proposed_scheduled_at") String proposedScheduledAt,
        String reason) {}
