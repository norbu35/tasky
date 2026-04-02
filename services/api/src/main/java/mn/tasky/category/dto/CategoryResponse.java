package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CategoryResponse(
        String id,
        String name,
        @JsonProperty("name_mn") String nameMn,
        @JsonProperty("icon_url") String iconUrl,
        @JsonProperty("is_active") boolean isActive,
        @JsonProperty("sort_order") int sortOrder) {}
