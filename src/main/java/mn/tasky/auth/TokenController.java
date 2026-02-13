package mn.tasky.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/token")
@Validated
public class TokenController {

    private final AuthService authService;

    public TokenController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(
        @Valid @RequestBody RefreshTokenBody body,
        HttpServletRequest request
    ) {
        return authService.refreshToken(body.refreshToken())
            .map(tokens -> ResponseEntity.ok(
                Map.of(
                    "access_token", tokens.accessToken(),
                    "refresh_token", tokens.refreshToken()
                )
            ))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of(
                    "code", "REFRESH_TOKEN_INVALID",
                    "message", "Invalid or expired refresh token.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record RefreshTokenBody(
        @JsonProperty("refresh_token")
        @NotBlank
        String refreshToken
    ) {
    }
}
