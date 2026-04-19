package mn.tasky.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @JsonProperty("full_name") @Size(min = 1, max = 100) @Pattern(regexp = ".*\\S.*") String fullName,
        @JsonProperty("avatar_url")
                @Size(max = 512)
                @Pattern(regexp = "^(https://(?:cdn\\.tasky\\.mn|cdn\\.tasky\\.local)/\\S+|uploads/\\S+)$")
                String avatarUrl,
        @JsonProperty("bio") @Size(max = 200) String bio) {}
