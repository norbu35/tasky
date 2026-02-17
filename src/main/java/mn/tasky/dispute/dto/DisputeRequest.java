package mn.tasky.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
    @NotBlank
    @Size(min = 10, max = 2000)
    String reason
) {}
