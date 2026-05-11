package mn.tasky.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.Optional;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.provider.AppleIdentityTokenValidator;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.RefreshToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/apple")
@Validated
public class AppleAuthController {

    private static final Logger log = LoggerFactory.getLogger(AppleAuthController.class);

    private final AppleIdentityTokenValidator tokenValidator;
    private final UserDao userDao;
    private final JwtTokenService jwtTokenService;
    private final AuditEventDao auditEventDao;

    public AppleAuthController(
            AppleIdentityTokenValidator tokenValidator,
            UserDao userDao,
            JwtTokenService jwtTokenService,
            AuditEventDao auditEventDao) {
        this.tokenValidator = tokenValidator;
        this.userDao = userDao;
        this.jwtTokenService = jwtTokenService;
        this.auditEventDao = auditEventDao;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> appleLogin(@Valid @RequestBody AppleLoginRequest request) {
        auditEventDao.insert((String) null, "APPLE_AUTH_ATTEMPT", "user", (String) null, null);

        String appleSub;
        try {
            appleSub = tokenValidator.validate(request.identityToken());
        } catch (IllegalArgumentException e) {
            log.warn("Apple identity token validation failed: {}", e.getMessage());
            auditEventDao.insert(
                    (String) null, "APPLE_AUTH_FAILURE", "user", (String) null, "{\"reason\":\"invalid_token\"}");
            return ResponseEntity.status(401)
                    .body(Map.of("error", "invalid_apple_token", "message", "Apple identity token validation failed"));
        }

        Optional<AuthUser> existingUser = userDao.findByAppleSub(appleSub);
        AuthUser user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = userDao.createWithApple(appleSub);
            log.info("Created new user via Apple auth: appleSub={}", appleSub);
        }

        auditEventDao.insert(
                user.id().toString(), "APPLE_AUTH_SUCCESS", "user", user.id().toString(), null);

        JwtPrincipal principal = new JwtPrincipal(user.id(), user.role(), user.status(), null);
        String accessToken = jwtTokenService.issueAccessToken(principal);
        RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.token(),
                "user",
                        Map.of(
                                "id", user.id(),
                                "role", user.role(),
                                "status", user.status())));
    }

    public record AppleLoginRequest(@NotBlank String identityToken, String fullName) {}
}
