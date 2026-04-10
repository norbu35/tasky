package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record SchemaVersionResponse(
        String id,
        @JsonProperty("category_id") String categoryId,
        int version,
        @JsonProperty("schema_json") String schemaJson,
        String status,
        @JsonProperty("created_by") String createdBy,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("activated_at") Instant activatedAt) {}
