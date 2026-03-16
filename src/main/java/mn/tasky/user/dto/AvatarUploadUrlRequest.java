package mn.tasky.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AvatarUploadUrlRequest(
        @JsonProperty("content_type")
                @NotBlank
                @Pattern(regexp = "^(image/jpeg|image/png|image/webp)$", flags = Pattern.Flag.CASE_INSENSITIVE)
                String contentType) {}
