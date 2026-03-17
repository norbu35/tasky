package mn.tasky.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RescheduleRespondRequest(
        @NotNull @Pattern(regexp = "ACCEPT|DECLINE", message = "action must be ACCEPT or DECLINE") String action) {}
