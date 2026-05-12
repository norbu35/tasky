package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.auth.dao.RateLimitCounterDao;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpRateLimitService")
class OtpRateLimitServiceTest {

    @Mock
    private RateLimitCounterDao rateLimitCounterDao;

    @Mock
    private JwtTokenService jwtTokenService;

    private OtpRateLimitService service;

    @BeforeEach
    void setUp() {
        service = new OtpRateLimitService(rateLimitCounterDao, jwtTokenService, 3, 10, 5, 20, 10, 30);
    }

    @Nested
    @DisplayName("assertRequestAllowed()")
    class AssertRequestAllowed {

        @Test
        @DisplayName("allows request when under limit")
        void allowsWhenUnderLimit() {
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 1);

            assertThatCode(() -> service.assertRequestAllowed("99112233", "10.0.0.1"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("throws when phone limit exceeded")
        void throwsWhenPhoneLimitExceeded() {
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(4, 1);

            assertThatThrownBy(() -> service.assertRequestAllowed("99112233", "10.0.0.1"))
                    .isInstanceOf(RateLimitExceededException.class);
        }

        @Test
        @DisplayName("throws when IP limit exceeded")
        void throwsWhenIpLimitExceeded() {
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 11);

            assertThatThrownBy(() -> service.assertRequestAllowed("99112233", "10.0.0.1"))
                    .isInstanceOf(RateLimitExceededException.class);
        }
    }

    @Nested
    @DisplayName("assertVerifyAllowed()")
    class AssertVerifyAllowed {

        @Test
        @DisplayName("allows verify when under limit")
        void allowsWhenUnderLimit() {
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 1);

            assertThatCode(() -> service.assertVerifyAllowed("99112233", "10.0.0.1"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("throws when verify phone limit exceeded")
        void throwsWhenPhoneLimitExceeded() {
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(6, 1);

            assertThatThrownBy(() -> service.assertVerifyAllowed("99112233", "10.0.0.1"))
                    .isInstanceOf(RateLimitExceededException.class);
        }
    }

    @Nested
    @DisplayName("assertRefreshAllowed()")
    class AssertRefreshAllowed {

        @Test
        @DisplayName("allows refresh when under limit")
        void allowsWhenUnderLimit() {
            ParsedRefreshToken token = new ParsedRefreshToken("user1", "token-abc", null);
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(token));
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 1);

            assertThatCode(() -> service.assertRefreshAllowed("refresh-token", "10.0.0.1"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("uses token ID from parsed refresh token as rate limit key")
        void usesTokenIdAsKey() {
            ParsedRefreshToken token = new ParsedRefreshToken("user1", "token-abc", null);
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(token));
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 1);

            service.assertRefreshAllowed("refresh-token", "10.0.0.1");

            verify(rateLimitCounterDao, atLeastOnce()).incrementAndGet(anyString(), any(), any(), any());
        }

        @Test
        @DisplayName("falls back to hashed token when parsing fails")
        void fallsBackToHashedTokenWhenParsingFails() {
            when(jwtTokenService.parseRefreshToken("bad-token")).thenReturn(Optional.empty());
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 1);

            assertThatCode(() -> service.assertRefreshAllowed("bad-token", "10.0.0.1"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("throws when refresh token limit exceeded")
        void throwsWhenRefreshLimitExceeded() {
            ParsedRefreshToken token = new ParsedRefreshToken("user1", "token-abc", null);
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(token));
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(11, 1);

            assertThatThrownBy(() -> service.assertRefreshAllowed("refresh-token", "10.0.0.1"))
                    .isInstanceOf(RateLimitExceededException.class);
        }

        @Test
        @DisplayName("throws when refresh IP limit exceeded")
        void throwsWhenRefreshIpLimitExceeded() {
            ParsedRefreshToken token = new ParsedRefreshToken("user1", "token-abc", null);
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(token));
            when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                    .thenReturn(1, 31);

            assertThatThrownBy(() -> service.assertRefreshAllowed("refresh-token", "10.0.0.1"))
                    .isInstanceOf(RateLimitExceededException.class);
        }
    }
}
