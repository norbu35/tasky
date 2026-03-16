package mn.tasky.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record FacebookLoginRequest(@NotBlank @JsonProperty("access_token") String accessToken) {}
