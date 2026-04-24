package mn.tasky.category.dto;

import jakarta.validation.constraints.NotBlank;

public record ActivateSchemaVersionRequest(@NotBlank String mode) {}
