package mn.tasky.auth.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.OtpRateLimitService;
import mn.tasky.auth.dto.RefreshTokenRequest;
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
    private final OtpRateLimitService otpRateLimitService;

    public TokenController(AuthService authService, OtpRateLimitService otpRateLimitService) {
        this.authService = authService;
        this.otpRateLimitService = otpRateLimitService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest body, HttpServletRequest request) {
        otpRateLimitService.assertRefreshAllowed(body.refreshToken(), resolveClientIp(request));

        return authService
                .refreshToken(body.refreshToken())
                .map(tokens -> ResponseEntity.ok(
                        Map.of("access_token", tokens.accessToken(), "refresh_token", tokens.refreshToken())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "code",
                                "REFRESH_TOKEN_INVALID",
                                "message",
                                "Invalid or expired refresh token.",
                                "trace_id",
                                resolveTraceId(request))));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
