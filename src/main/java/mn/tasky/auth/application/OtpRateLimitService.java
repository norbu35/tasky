package mn.tasky.auth.application;

import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.auth.dao.RateLimitCounterDao;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Distributed rate limiter for OTP and refresh-token flows.
 */
@Service
public class OtpRateLimitService {

    private static final Duration OTP_REQUEST_WINDOW = Duration.ofHours(1);
    private static final Duration OTP_VERIFY_WINDOW = Duration.ofMinutes(15);
    private static final Duration REFRESH_WINDOW = Duration.ofMinutes(1);

    private static final HexFormat HEX_FORMAT = HexFormat.of();

    private final RateLimitCounterDao rateLimitCounterDao;
    private final JwtTokenService jwtTokenService;
    private final int otpRequestLimitPerPhone;
    private final int otpRequestLimitPerIp;
    private final int otpVerifyLimitPerPhone;
    private final int otpVerifyLimitPerIp;
    private final int refreshLimitPerToken;
    private final int refreshLimitPerIp;

    public OtpRateLimitService(
        RateLimitCounterDao rateLimitCounterDao,
        JwtTokenService jwtTokenService,
        @Value("${tasky.auth.rate-limit.otp-request-per-phone:3}") int otpRequestLimitPerPhone,
        @Value("${tasky.auth.rate-limit.otp-request-per-ip:10}") int otpRequestLimitPerIp,
        @Value("${tasky.auth.rate-limit.otp-verify-per-phone:5}") int otpVerifyLimitPerPhone,
        @Value("${tasky.auth.rate-limit.otp-verify-per-ip:20}") int otpVerifyLimitPerIp,
        @Value("${tasky.auth.rate-limit.refresh-per-token:10}") int refreshLimitPerToken,
        @Value("${tasky.auth.rate-limit.refresh-per-ip:30}") int refreshLimitPerIp) {
        this.rateLimitCounterDao = rateLimitCounterDao;
        this.jwtTokenService = jwtTokenService;
        this.otpRequestLimitPerPhone = otpRequestLimitPerPhone;
        this.otpRequestLimitPerIp = otpRequestLimitPerIp;
        this.otpVerifyLimitPerPhone = otpVerifyLimitPerPhone;
        this.otpVerifyLimitPerIp = otpVerifyLimitPerIp;
        this.refreshLimitPerToken = refreshLimitPerToken;
        this.refreshLimitPerIp = refreshLimitPerIp;
    }

    /**
     * Enforces OTP request limits on both phone and client IP keys.
     *
     * @param phone    Normalized phone value.
     * @param clientIp Client IP address.
     * @throws RateLimitExceededException if either limit is exceeded.
     */
    public void assertRequestAllowed(String phone, String clientIp) {
        enforce("otp-request-phone:" + phone,
            otpRequestLimitPerPhone,
            OTP_REQUEST_WINDOW,
            "OTP_REQUEST_RATE_LIMITED");
        enforce("otp-request-ip:" + clientIp,
            otpRequestLimitPerIp,
            OTP_REQUEST_WINDOW,
            "OTP_REQUEST_RATE_LIMITED");
    }

    private void enforce(String key, int limit, Duration window, String errorCode) {
        Instant now = Instant.now();
        rateLimitCounterDao.deleteExpired(now);
        int attempts = rateLimitCounterDao.incrementAndGet(key,
            now,
            now.minus(window),
            now.plus(window));
        if (attempts > limit) {
            throw new RateLimitExceededException(errorCode,
                "Too many OTP attempts. Please try again later.");
        }
    }

    /**
     * Enforces OTP verification limits on both phone and client IP keys.
     *
     * @param phone    Normalized phone value.
     * @param clientIp Client IP address.
     * @throws RateLimitExceededException if either limit is exceeded.
     */
    public void assertVerifyAllowed(String phone, String clientIp) {
        enforce("otp-verify-phone:" + phone,
            otpVerifyLimitPerPhone,
            OTP_VERIFY_WINDOW,
            "OTP_VERIFY_RATE_LIMITED");
        enforce("otp-verify-ip:" + clientIp,
            otpVerifyLimitPerIp,
            OTP_VERIFY_WINDOW,
            "OTP_VERIFY_RATE_LIMITED");
    }

    /**
     * Enforces refresh-token limits on both token and client IP keys.
     *
     * @param refreshToken Raw refresh token string.
     * @param clientIp     Client IP address.
     * @throws RateLimitExceededException if either limit is exceeded.
     */
    public void assertRefreshAllowed(String refreshToken, String clientIp) {
        String tokenKey = jwtTokenService
            .parseRefreshToken(refreshToken)
            .map(ParsedRefreshToken::tokenId)
            .orElseGet(() -> "invalid-" + sha256(refreshToken));
        enforce("refresh-token:" + tokenKey,
            refreshLimitPerToken,
            REFRESH_WINDOW,
            "TOKEN_REFRESH_RATE_LIMITED");
        enforce("refresh-ip:" + clientIp,
            refreshLimitPerIp,
            REFRESH_WINDOW,
            "TOKEN_REFRESH_RATE_LIMITED");
    }

    private String sha256(String value) {
        String safeValue = StringUtils.hasText(value) ? value : "empty";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(safeValue.getBytes(StandardCharsets.UTF_8));
            return HEX_FORMAT.formatHex(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash refresh token for rate limiting",
                exception);
        }
    }
}
