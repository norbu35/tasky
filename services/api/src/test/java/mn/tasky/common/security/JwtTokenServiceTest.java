package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mn.tasky.common.security.dto.RefreshToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("JwtTokenService")
class JwtTokenServiceTest {

    private static String validSecret() {
        byte[] key = new byte[32];
        java.util.Arrays.fill(key, (byte) 'S');
        return new String(key, java.nio.charset.StandardCharsets.UTF_8);
    }

    private JwtTokenService service;

    @BeforeEach
    void setUp() {
        service = new JwtTokenService(validSecret(), 900, 1209600);
    }

    @Nested
    @DisplayName("constructor validation")
    class Constructor {
        @Test
        @DisplayName("rejects blank jwt secret")
        void blankSecret() {
            assertThatThrownBy(() -> new JwtTokenService("", 900, 1209600))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("jwt-secret");
        }

        @Test
        @DisplayName("rejects short jwt secret at construction time")
        void shortSecret() {
            assertThatThrownBy(() -> new JwtTokenService("too-short", 900, 1209600))
                    .isInstanceOf(Exception.class);
        }
    }

    @Nested
    @DisplayName("issueAccessToken / parse")
    class AccessToken {
        @Test
        @DisplayName("round-trips access token")
        void roundTrip() {
            JwtPrincipal principal = new JwtPrincipal("user1", "CUSTOMER", "ACTIVE", null);
            String token = service.issueAccessToken(principal);
            assertThat(token).isNotBlank();
            var parsed = service.parse(token);
            assertThat(parsed).isPresent();
            assertThat(parsed.get().userId()).isEqualTo("user1");
            assertThat(parsed.get().role()).isEqualTo("CUSTOMER");
            assertThat(parsed.get().status()).isEqualTo("ACTIVE");
            assertThat(parsed.get().jti()).isNotNull();
        }

        @Test
        @DisplayName("parse returns empty for refresh token")
        void refreshTokenRejected() {
            RefreshToken refreshToken = service.issueRefreshToken("user1");
            assertThat(service.parse(refreshToken.token())).isEmpty();
        }

        @Test
        @DisplayName("parse returns empty for tampered token")
        void tamperedToken() {
            JwtPrincipal principal = new JwtPrincipal("user1", "CUSTOMER", "ACTIVE", null);
            String token = service.issueAccessToken(principal);
            String tampered = token.substring(0, token.length() - 5) + "XXXXX";
            assertThat(service.parse(tampered)).isEmpty();
        }

        @Test
        @DisplayName("parse returns empty for garbage string")
        void garbage() {
            assertThat(service.parse("not-a-token")).isEmpty();
        }

        @Test
        @DisplayName("normalizes role and status to uppercase")
        void normalizesCase() {
            JwtPrincipal principal = new JwtPrincipal("user1", "customer", "active", null);
            String token = service.issueAccessToken(principal);
            var parsed = service.parse(token);
            assertThat(parsed).isPresent();
            assertThat(parsed.get().role()).isEqualTo("CUSTOMER");
            assertThat(parsed.get().status()).isEqualTo("ACTIVE");
        }
    }

    @Nested
    @DisplayName("issueRefreshToken / parseRefreshToken")
    class RefreshTokenTests {
        @Test
        @DisplayName("round-trips refresh token")
        void roundTrip() {
            RefreshToken refreshToken = service.issueRefreshToken("user1");
            assertThat(refreshToken.token()).isNotBlank();
            assertThat(refreshToken.tokenId()).isNotNull();
            assertThat(refreshToken.expiresAt()).isAfter(java.time.Instant.now());

            var parsed = service.parseRefreshToken(refreshToken.token());
            assertThat(parsed).isPresent();
            assertThat(parsed.get().userId()).isEqualTo("user1");
            assertThat(parsed.get().tokenId()).isEqualTo(refreshToken.tokenId());
            assertThat(parsed.get().expiresAt().getEpochSecond())
                    .isEqualTo(refreshToken.expiresAt().getEpochSecond());
        }

        @Test
        @DisplayName("parseRefreshToken returns empty for access token")
        void accessTokenRejected() {
            JwtPrincipal principal = new JwtPrincipal("user1", "CUSTOMER", "ACTIVE", null);
            String accessToken = service.issueAccessToken(principal);
            assertThat(service.parseRefreshToken(accessToken)).isEmpty();
        }

        @Test
        @DisplayName("parseRefreshToken returns empty for tampered token")
        void tamperedToken() {
            RefreshToken refreshToken = service.issueRefreshToken("user1");
            String tampered =
                    refreshToken.token().substring(0, refreshToken.token().length() - 5) + "XXXXX";
            assertThat(service.parseRefreshToken(tampered)).isEmpty();
        }

        @Test
        @DisplayName("parseRefreshToken returns empty for garbage")
        void garbage() {
            assertThat(service.parseRefreshToken("garbage")).isEmpty();
        }
    }
}
