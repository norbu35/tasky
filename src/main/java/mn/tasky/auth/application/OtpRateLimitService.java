package mn.tasky.auth.application;

import mn.tasky.auth.RateLimitExceededException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpRateLimitService {

    private static final Duration OTP_REQUEST_WINDOW = Duration.ofHours(1);
    private static final Duration OTP_VERIFY_WINDOW = Duration.ofMinutes(15);
    private static final Duration REFRESH_WINDOW = Duration.ofMinutes(1);

    private static final int OTP_REQUEST_LIMIT_PER_PHONE = 3;
    private static final int OTP_REQUEST_LIMIT_PER_IP = 10;
    private static final int OTP_VERIFY_LIMIT_PER_PHONE = 5;
    private static final int OTP_VERIFY_LIMIT_PER_IP = 20;
    private static final int REFRESH_LIMIT_PER_TOKEN = 10;
    private static final int REFRESH_LIMIT_PER_IP = 30;

    private final ConcurrentHashMap<String, Deque<Long>> attemptsByKey = new ConcurrentHashMap<>();

    public void assertRequestAllowed(String phone, String clientIp) {
        enforce(
            "otp-request-phone:" + phone,
            OTP_REQUEST_LIMIT_PER_PHONE,
            OTP_REQUEST_WINDOW,
            "OTP_REQUEST_RATE_LIMITED"
        );
        enforce(
            "otp-request-ip:" + clientIp,
            OTP_REQUEST_LIMIT_PER_IP,
            OTP_REQUEST_WINDOW,
            "OTP_REQUEST_RATE_LIMITED"
        );
    }

    public void assertVerifyAllowed(String phone, String clientIp) {
        enforce(
            "otp-verify-phone:" + phone,
            OTP_VERIFY_LIMIT_PER_PHONE,
            OTP_VERIFY_WINDOW,
            "OTP_VERIFY_RATE_LIMITED"
        );
        enforce(
            "otp-verify-ip:" + clientIp,
            OTP_VERIFY_LIMIT_PER_IP,
            OTP_VERIFY_WINDOW,
            "OTP_VERIFY_RATE_LIMITED"
        );
    }

    public void assertRefreshAllowed(String refreshToken, String clientIp) {
        String tokenKey = Integer.toHexString(refreshToken.hashCode());
        enforce(
            "refresh-token:" + tokenKey,
            REFRESH_LIMIT_PER_TOKEN,
            REFRESH_WINDOW,
            "TOKEN_REFRESH_RATE_LIMITED"
        );
        enforce(
            "refresh-ip:" + clientIp,
            REFRESH_LIMIT_PER_IP,
            REFRESH_WINDOW,
            "TOKEN_REFRESH_RATE_LIMITED"
        );
    }

    private void enforce(
        String key,
        int limit,
        Duration window,
        String errorCode
    ) {
        Deque<Long> attempts = attemptsByKey.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        long cutoff = now - window.toMillis();

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst() <= cutoff) {
                attempts.pollFirst();
            }

            if (attempts.size() >= limit) {
                throw new RateLimitExceededException(
                    errorCode,
                    "Too many OTP attempts. Please try again later."
                );
            }

            attempts.addLast(now);
        }
    }
}
