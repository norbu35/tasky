package mn.tasky.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BookingOverrideStatusRequest(
        @NotBlank @Pattern(regexp = "ASSIGNED|PAID|COMPLETED|CANCELLED") @JsonProperty("new_status") String newStatus,
        @NotNull @Size(min = 3, max = 500) String reason) {}
