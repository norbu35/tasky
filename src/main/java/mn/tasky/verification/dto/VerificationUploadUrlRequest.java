package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerificationUploadUrlRequest(
    @JsonProperty("content_type")
    @NotBlank
    @Pattern(
        regexp = "^(image/jpeg|image/png)$",
        flags = Pattern.Flag.CASE_INSENSITIVE
    )
    String contentType
) {
}
