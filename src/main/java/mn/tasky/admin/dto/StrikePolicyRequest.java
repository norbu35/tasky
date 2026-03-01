package mn.tasky.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StrikePolicyRequest(
    @Min(1) @Max(365)
    int strikeWindowDays,
    @Min(1) @Max(10)
    int strikeThreshold,
    @Min(1) @Max(365)
    int firstSuspensionDays,
    @Min(1) @Max(365)
    int repeatSuspensionDays,
    @Min(1) @Max(730)
    int repeatOffenseWindowDays,
    @NotNull
    Boolean autoUnsuspendEnabled
) {

}
