package mn.tasky.verification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerificationUploadUrlRequest(
        @JsonProperty("content_type")
                @NotBlank
                @Size(max = 64)
                @Pattern(regexp = "^(image/jpeg|image/png)$", flags = Pattern.Flag.CASE_INSENSITIVE)
                String contentType) {}
