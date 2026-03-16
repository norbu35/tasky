package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record CreateDraftRequest(@JsonProperty("category_id") @NotBlank String categoryId) {}
