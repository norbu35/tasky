package mn.tasky.auth;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final JwtTokenService jwtTokenService;
    private final long otpTtlSeconds;
    private final String staticOtpCode;

    private final ConcurrentHashMap<String, AuthUser> usersByPhone = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AuthUser> usersById = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OtpChallenge> otpChallengesByPhone = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RefreshSession> refreshSessionsByTokenId = new ConcurrentHashMap<>();

    public AuthService(
        JwtTokenService jwtTokenService,
        @Value("${tasky.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
        @Value("${tasky.auth.otp-code:123456}") String staticOtpCode
    ) {
        this.jwtTokenService = jwtTokenService;
        this.otpTtlSeconds = otpTtlSeconds;
        this.staticOtpCode = staticOtpCode;
    }

    public String requestOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        ensureUser(phone);

        otpChallengesByPhone.put(
            phone,
            new OtpChallenge(staticOtpCode, Instant.now().plusSeconds(otpTtlSeconds))
        );

        return maskPhone(phone);
    }

    public Optional<AuthSession> verifyOtp(String rawPhone, String code) {
        String phone = normalizePhone(rawPhone);
        OtpChallenge challenge = otpChallengesByPhone.get(phone);
        if (challenge == null) {
            return Optional.empty();
        }

        if (challenge.expiresAt().isBefore(Instant.now())) {
            otpChallengesByPhone.remove(phone);
            return Optional.empty();
        }

        if (!challenge.code().equals(code)) {
            return Optional.empty();
        }

        otpChallengesByPhone.remove(phone);
        AuthUser user = ensureUser(phone);
        return Optional.of(issueSession(user));
    }

    public Optional<AuthTokens> refreshToken(String refreshToken) {
        Optional<JwtTokenService.ParsedRefreshToken> parsedOpt = jwtTokenService.parseRefreshToken(
            refreshToken
        );
        if (parsedOpt.isEmpty()) {
            return Optional.empty();
        }

        JwtTokenService.ParsedRefreshToken parsed = parsedOpt.get();
        RefreshSession session = refreshSessionsByTokenId.remove(parsed.tokenId());
        if (session == null) {
            return Optional.empty();
        }

        if (!session.userId().equals(parsed.userId()) || session.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        AuthUser user = usersById.get(parsed.userId());
        if (user == null) {
            return Optional.empty();
        }

        AuthSession rotated = issueSession(user);
        return Optional.of(new AuthTokens(rotated.accessToken(), rotated.refreshToken()));
    }

    private AuthSession issueSession(AuthUser user) {
        JwtPrincipal principal = new JwtPrincipal(user.id(), user.role(), user.status());
        String accessToken = jwtTokenService.issueAccessToken(principal);
        JwtTokenService.RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionsByTokenId.put(
            refreshToken.tokenId(),
            new RefreshSession(user.id(), refreshToken.expiresAt())
        );

        return new AuthSession(
            accessToken,
            refreshToken.token(),
            Map.of(
                "id", user.id(),
                "phone", user.phone(),
                "role", user.role(),
                "status", user.status(),
                "created_at", user.createdAt().toString()
            )
        );
    }

    private AuthUser ensureUser(String phone) {
        return usersByPhone.computeIfAbsent(phone, key -> {
            AuthUser created = new AuthUser(
                UUID.randomUUID().toString(),
                key,
                "CUSTOMER",
                "PENDING",
                Instant.now()
            );
            usersById.put(created.id(), created);
            return created;
        });
    }

    private String normalizePhone(String phone) {
        return StringUtils.trimAllWhitespace(phone);
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0, Math.min(6, phone.length())) + "****";
    }

    private record AuthUser(
        String id,
        String phone,
        String role,
        String status,
        Instant createdAt
    ) {
    }

    private record OtpChallenge(String code, Instant expiresAt) {
    }

    private record RefreshSession(String userId, Instant expiresAt) {
    }

    public record AuthSession(String accessToken, String refreshToken, Map<String, String> user) {
    }

    public record AuthTokens(String accessToken, String refreshToken) {
    }
}
