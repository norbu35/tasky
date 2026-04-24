package mn.tasky.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

public record CancelBookingRequest(@JsonProperty("reason") @Nullable @Size(max = 2000) String reason) {}
