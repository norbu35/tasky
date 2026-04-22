package mn.tasky.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

public record ApplyTaskRequest(
        @NotBlank @Size(min = 1, max = 500) String message,
        @JsonProperty("quote_price") @Nullable @Min(5000) @Max(50_000_000) Integer quotePrice) {}
