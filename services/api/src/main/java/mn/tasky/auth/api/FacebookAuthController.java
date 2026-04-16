package mn.tasky.auth.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.auth.application.FacebookRateLimitService;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.FacebookLoginRequest;
import mn.tasky.common.security.ClientIpResolver;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/facebook")
@Validated
public class FacebookAuthController {

    private final IdentityCommandPort identityCommandPort;
    private final FacebookRateLimitService facebookRateLimitService;
    private final FacebookCircuitBreaker circuitBreaker;
    private final ClientIpResolver clientIpResolver;

    public FacebookAuthController(
            IdentityCommandPort identityCommandPort,
            FacebookRateLimitService facebookRateLimitService,
            FacebookCircuitBreaker circuitBreaker,
            ClientIpResolver clientIpResolver) {
        this.identityCommandPort = identityCommandPort;
        this.facebookRateLimitService = facebookRateLimitService;
        this.circuitBreaker = circuitBreaker;
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        boolean available = !circuitBreaker.isOpen();
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody FacebookLoginRequest body, HttpServletRequest request) {
        facebookRateLimitService.assertAllowed(clientIpResolver.resolve(request));
        AuthSession session = identityCommandPort.facebookLogin(body.accessToken());

        return ResponseEntity.ok(Map.of(
                "access_token",
                session.accessToken(),
                "refresh_token",
                session.refreshToken(),
                "user",
                session.user()));
    }
}
