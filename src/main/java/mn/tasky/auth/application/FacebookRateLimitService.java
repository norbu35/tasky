package mn.tasky.auth.application;

import mn.tasky.auth.RateLimitExceededException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory per-IP throttle for Facebook OAuth attempts.
 */
@Service
public class FacebookRateLimitService {

    private static final Duration WINDOW = Duration.ofHours(1);
    private static final int REQUEST_LIMIT_PER_IP = 10;

    private final ConcurrentHashMap<String, Deque<Long>> attemptsByIp = new ConcurrentHashMap<>();

    /**
     * Verifies that a client IP has not exceeded the OAuth attempt limit for the current window.
     *
     * @param clientIp Client IP address.
     * @throws RateLimitExceededException when the IP exceeds the configured limit.
     */
    public void assertAllowed(String clientIp) {
        Deque<Long> attempts = attemptsByIp.computeIfAbsent(clientIp,
                                                            ignored -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        long cutoff = now - WINDOW.toMillis();

        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst() <= cutoff) {
                attempts.pollFirst();
            }

            if (attempts.size() >= REQUEST_LIMIT_PER_IP) {
                throw new RateLimitExceededException(
                        "OAUTH_RATE_LIMITED",
                        "Too many OAuth attempts. Please try again later."
                );
            }

            attempts.addLast(now);
        }
    }
}
