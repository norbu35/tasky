package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDraftRequest(@JsonProperty("category_id") @NotBlank @Size(max = 512) String categoryId) {}
