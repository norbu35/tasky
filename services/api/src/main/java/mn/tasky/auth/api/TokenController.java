package mn.tasky.auth.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.auth.application.OtpRateLimitService;
import mn.tasky.auth.dto.RefreshTokenRequest;
import mn.tasky.common.security.ClientIpResolver;
import mn.tasky.identity.publicapi.IdentityCommandPort;
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

    private final IdentityCommandPort identityCommandPort;
    private final OtpRateLimitService otpRateLimitService;
    private final ClientIpResolver clientIpResolver;

    public TokenController(
            IdentityCommandPort identityCommandPort,
            OtpRateLimitService otpRateLimitService,
            ClientIpResolver clientIpResolver) {
        this.identityCommandPort = identityCommandPort;
        this.otpRateLimitService = otpRateLimitService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest body, HttpServletRequest request) {
        otpRateLimitService.assertRefreshAllowed(body.refreshToken(), clientIpResolver.resolve(request));

        return identityCommandPort
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
}
