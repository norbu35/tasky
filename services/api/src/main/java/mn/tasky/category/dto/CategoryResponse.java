package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CategoryResponse(
        String id,
        String name,
        @JsonProperty("name_mn") String nameMn,
        @JsonProperty("icon_url") String iconUrl,
        @JsonProperty("is_active") boolean isActive,
        @JsonProperty("sort_order") int sortOrder,
        @JsonProperty("intake_enabled") boolean intakeEnabled,
        @JsonProperty("intake_schema_version") int intakeSchemaVersion,
        @JsonProperty("intake_schema_json") Object intakeSchemaJson) {}
