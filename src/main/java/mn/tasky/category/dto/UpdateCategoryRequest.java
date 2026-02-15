package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
    @Size(min = 1, max = 120)
    @Pattern(regexp = ".*\\S.*")
    String name,
    @JsonProperty("name_mn")
    @Size(min = 1, max = 120)
    @Pattern(regexp = ".*\\S.*")
    String nameMn,
    @JsonProperty("icon_url")
    @Size(max = 512)
    @Pattern(regexp = "^https?://\\S+$")
    String iconUrl,
    @JsonProperty("is_active")
    Boolean isActive,
    @JsonProperty("sort_order")
    @Min(0)
    Integer sortOrder
) {
}
