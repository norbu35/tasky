package mn.tasky.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.lang.Nullable;

public record CreateBookingIntentRequest(
        @NotBlank @Pattern(regexp = "REBOOK") String source,
        @NotBlank @JsonProperty("tasker_id") String taskerId,
        @Nullable @JsonProperty("original_booking_id") String originalBookingId) {}
