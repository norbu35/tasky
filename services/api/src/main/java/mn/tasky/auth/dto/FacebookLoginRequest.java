package mn.tasky.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FacebookLoginRequest(@NotBlank @Size(max = 512) @JsonProperty("access_token") String accessToken) {}
