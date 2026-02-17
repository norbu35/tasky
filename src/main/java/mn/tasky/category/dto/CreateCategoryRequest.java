package mn.tasky.category.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank
        @Size(max = 120)
        String name,
        @JsonProperty("name_mn")
        @NotBlank
        @Size(max = 120)
        String nameMn,
        @JsonProperty("icon_url")
        @NotBlank
        @Size(max = 512)
        @Pattern(regexp = "^https?://\\S+$")
        String iconUrl,
        @JsonProperty("sort_order")
        @NotNull
        @Min(0)
        Integer sortOrder
) {

}
