package mn.tasky.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AvatarUploadUrlRequest(
        @JsonProperty("content_type")
                @NotBlank
                @Size(max = 64)
                @Pattern(regexp = "^(image/jpeg|image/png|image/webp)$", flags = Pattern.Flag.CASE_INSENSITIVE)
                String contentType) {}
