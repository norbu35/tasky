package mn.tasky.common.security;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import mn.tasky.common.security.dto.RefreshToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtTokenService {

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final SecretKey signingKey;
    private final long accessTokenTtlSeconds;
    private final long refreshTokenTtlSeconds;

    @SuppressFBWarnings(
        value = "CT_CONSTRUCTOR_THROW",
        justification = "Constructor validates required signing key and fails fast on invalid runtime config.")
    public JwtTokenService(
        @Value("${tasky.security.jwt-secret}") String jwtSecret,
        @Value("${tasky.security.access-token-ttl-seconds:900}") long accessTokenTtlSeconds,
        @Value("${tasky.security.refresh-token-ttl-seconds:1209600}") long refreshTokenTtlSeconds) {
        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException("tasky.security.jwt-secret must be configured.");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    @PostConstruct
    void validateSigningKeyStrength() {
        if (signingKey.getEncoded().length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes.");
        }
    }

    public Optional<JwtPrincipal> parse(String token) {
        try {
            Claims claims = parseClaims(token);

            String tokenType = claims.get(TOKEN_TYPE_CLAIM,
                String.class);
            if (!ACCESS_TOKEN_TYPE.equalsIgnoreCase(tokenType)) {
                return Optional.empty();
            }

            String userId = claims.getSubject();
            String role = claims.get("role",
                String.class);
            String status = claims.get("status",
                String.class);

            if (!StringUtils.hasText(userId) || !StringUtils.hasText(role)) {
                return Optional.empty();
            }

            String normalizedStatus = StringUtils.hasText(status) ? status.toUpperCase(Locale.ROOT) : "ACTIVE";

            return Optional.of(new JwtPrincipal(userId,
                role.toUpperCase(Locale.ROOT),
                normalizedStatus));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String issueAccessToken(JwtPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(principal.userId())
            .claim("role",
                principal.role())
            .claim("status",
                principal.status())
            .claim(TOKEN_TYPE_CLAIM,
                ACCESS_TOKEN_TYPE)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessTokenTtlSeconds)))
            .signWith(signingKey,
                Jwts.SIG.HS256)
            .compact();
    }

    public RefreshToken issueRefreshToken(String userId) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(refreshTokenTtlSeconds);
        String tokenId = UUID.randomUUID()
            .toString();

        String token = Jwts.builder()
            .subject(userId)
            .id(tokenId)
            .claim(TOKEN_TYPE_CLAIM,
                REFRESH_TOKEN_TYPE)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey,
                Jwts.SIG.HS256)
            .compact();

        return new RefreshToken(token,
            tokenId,
            expiresAt);
    }

    public Optional<ParsedRefreshToken> parseRefreshToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String tokenType = claims.get(TOKEN_TYPE_CLAIM,
                String.class);
            if (!REFRESH_TOKEN_TYPE.equalsIgnoreCase(tokenType)) {
                return Optional.empty();
            }

            String userId = claims.getSubject();
            String tokenId = claims.getId();
            Date expiration = claims.getExpiration();

            if (!StringUtils.hasText(userId) || !StringUtils.hasText(tokenId) || expiration == null) {
                return Optional.empty();
            }

            return Optional.of(new ParsedRefreshToken(userId,
                tokenId,
                expiration.toInstant()));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
