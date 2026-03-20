package mn.tasky.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RescheduleRespondRequest(
        @NotNull @Size(max = 64) @Pattern(regexp = "ACCEPT|DECLINE", message = "action must be ACCEPT or DECLINE") String action) {}
