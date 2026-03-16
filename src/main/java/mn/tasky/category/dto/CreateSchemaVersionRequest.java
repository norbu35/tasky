package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record CreateSchemaVersionRequest(
    @JsonProperty("schema_json") @NotBlank String schemaJson) {
}
