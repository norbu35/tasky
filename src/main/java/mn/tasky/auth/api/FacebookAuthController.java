package mn.tasky.auth.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.FacebookRateLimitService;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.FacebookLoginRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/facebook")
@Validated
public class FacebookAuthController {

    private final AuthService authService;
    private final FacebookRateLimitService facebookRateLimitService;

    public FacebookAuthController(AuthService authService, FacebookRateLimitService facebookRateLimitService) {
        this.authService = authService;
        this.facebookRateLimitService = facebookRateLimitService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> login(
        @Valid @RequestBody FacebookLoginRequest body, HttpServletRequest request) {
        facebookRateLimitService.assertAllowed(resolveClientIp(request));
        AuthSession session = authService.facebookLogin(body.accessToken());

        return ResponseEntity.ok(Map.of(
                "access_token",
                session.accessToken(),
                "refresh_token",
                session.refreshToken(),
                "user",
            session.user()));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
