package mn.tasky.auth.api;

import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.DevLoginRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/dev")
@Validated
@ConditionalOnProperty(name = "tasky.dev-auth.enabled", havingValue = "true")
public class DevAuthController {

    private final AuthService authService;

    public DevAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> devLogin(@Valid @RequestBody DevLoginRequest body) {
        AuthSession session = authService.devLogin(body.phone(), body.role());
        return ResponseEntity.ok(Map.of(
                "access_token",
                session.accessToken(),
                "refresh_token",
                session.refreshToken(),
                "user",
                session.user()));
    }
}
