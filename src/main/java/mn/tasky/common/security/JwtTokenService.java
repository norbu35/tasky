package mn.tasky.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class JwtTokenService {

    private final SecretKey signingKey;

    public JwtTokenService(
        @Value("${tasky.security.jwt-secret:tasky-dev-signing-secret-key-with-minimum-32-bytes}")
        String jwtSecret
    ) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Optional<JwtPrincipal> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            String status = claims.get("status", String.class);

            if (!StringUtils.hasText(userId) || !StringUtils.hasText(role)) {
                return Optional.empty();
            }

            String normalizedStatus = StringUtils.hasText(status)
                ? status.toUpperCase(Locale.ROOT)
                : "ACTIVE";

            return Optional.of(
                new JwtPrincipal(
                    userId,
                    role.toUpperCase(Locale.ROOT),
                    normalizedStatus
                )
            );
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
