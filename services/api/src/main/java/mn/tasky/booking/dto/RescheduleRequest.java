package mn.tasky.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

public record RescheduleRequest(
        @NotNull @Size(max = 64) @JsonProperty("proposed_scheduled_at") String proposedScheduledAt,
        @Nullable @Size(max = 2000) String reason) {}
