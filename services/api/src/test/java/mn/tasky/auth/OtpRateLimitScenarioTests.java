package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.OtpRateLimitService;
import mn.tasky.auth.dao.RateLimitCounterDao;
import mn.tasky.common.security.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for OtpRateLimitService scenarios SCN-AUTH-009 and SCN-AUTH-010.
 * Verifies that the service throws RateLimitExceededException when per-phone or
 * per-source limits are exceeded.
 */
class OtpRateLimitScenarioTests {

    // Default limits from @Value defaults: phone=3, ip=10
    private static final int DEFAULT_PHONE_LIMIT = 3;
    private static final int DEFAULT_IP_LIMIT = 10;

    private RateLimitCounterDao rateLimitCounterDao;
    private OtpRateLimitService service;

    @BeforeEach
    void setUp() {
        rateLimitCounterDao = mock(RateLimitCounterDao.class);
        service = new OtpRateLimitService(
                rateLimitCounterDao,
                new JwtTokenService("test-jwt-secret-key-minimum-32-chars-long-xxx", 900L, 1209600L),
                DEFAULT_PHONE_LIMIT,
                DEFAULT_IP_LIMIT,
                5, // otpVerifyLimitPerPhone
                20, // otpVerifyLimitPerIp
                10, // refreshLimitPerToken
                30); // refreshLimitPerIp
    }

    // ── SCN-AUTH-009 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-009: OTP request rate limit per phone returns 429 within the configured window")
    void otpRequestRateLimitPerPhoneExceeded() {
        // Given: phone key has exceeded its limit (DEFAULT_PHONE_LIMIT + 1)
        when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                .thenAnswer(inv -> {
                    String key = inv.getArgument(0);
                    // Phone key hits limit; IP key stays under
                    return key.startsWith("otp-request-phone:") ? DEFAULT_PHONE_LIMIT + 1 : 1;
                });

        // When/Then: assertRequestAllowed throws with rate-limit error code
        assertThatThrownBy(() -> service.assertRequestAllowed("+97699001122", "10.0.0.1"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("OTP");
    }

    @Test
    @DisplayName("SCN-AUTH-009: OTP request is allowed when under the per-phone limit")
    void otpRequestAllowedUnderPhoneLimit() {
        // Given: phone key is under limit
        when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                .thenReturn(1);

        // When/Then: no exception
        assertThatCode(() -> service.assertRequestAllowed("+97699001122", "10.0.0.1"))
                .doesNotThrowAnyException();
    }

    // ── SCN-AUTH-010 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-010: OTP request rate limit per request source returns 429 within the configured window")
    void otpRequestRateLimitPerSourceExceeded() {
        // Given: phone key is fine, but IP key has exceeded its limit
        when(rateLimitCounterDao.incrementAndGet(anyString(), any(), any(), any()))
                .thenAnswer(inv -> {
                    String key = inv.getArgument(0);
                    return key.startsWith("otp-request-ip:") ? DEFAULT_IP_LIMIT + 1 : 1;
                });

        // When/Then: assertRequestAllowed throws with rate-limit error code
        assertThatThrownBy(() -> service.assertRequestAllowed("+97699001122", "10.0.0.1"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("OTP");
    }
}
