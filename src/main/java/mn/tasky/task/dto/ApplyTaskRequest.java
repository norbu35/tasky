package mn.tasky.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyTaskRequest(
    @NotBlank
    @Size(min = 1, max = 500)
    String message
) {

}
