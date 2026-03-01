package mn.tasky.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveRequest(
    @NotBlank
    @Size(max = 32)
    String outcome,
    @Size(max = 2000)
    String notes
) {

}
