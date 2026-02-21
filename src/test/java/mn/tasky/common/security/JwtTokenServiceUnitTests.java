package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

class JwtTokenServiceUnitTests {

    private static final String JWT_SECRET = "test-jwt-signing-secret-should-be-at-least-32-bytes";
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService(JWT_SECRET,
                                              900,
                                              1209600);
        jwtTokenService.validateSigningKeyStrength();
    }

    @Test
    void parseRejectsTokensWithoutTokenTypeClaim() {
        Instant now = Instant.now();
        String token = Jwts.builder()
                .subject("user-1")
                .claim("role",
                       "CUSTOMER")
                .claim("status",
                       "ACTIVE")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(900)))
                .signWith(Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8)),
                          Jwts.SIG.HS256)
                .compact();

        assertThat(jwtTokenService.parse(token)).isEmpty();
    }

    @Test
    void parseAcceptsAccessTokensWithTokenTypeClaim() {
        String accessToken = jwtTokenService.issueAccessToken(new JwtPrincipal(
                "user-1",
                "CUSTOMER",
                "ACTIVE"
        ));

        assertThat(jwtTokenService.parse(accessToken)).isPresent();
    }
}
