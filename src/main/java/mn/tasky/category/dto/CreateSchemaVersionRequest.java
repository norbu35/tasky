package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSchemaVersionRequest(@JsonProperty("schema_json") @NotBlank @Size(max = 5000) String schemaJson) {}
