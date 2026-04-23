package mn.tasky.common.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Per-user STOMP SEND rate limiter using Bucket4j token-bucket algorithm.
 *
 * <p>Allows up to 30 messages per minute per user. Buckets are lazily created and held
 * in-memory; they are evicted when the STOMP session disconnects.
 * Upgrade to a distributed bucket store (e.g. bucket4j-redis) if multi-instance.
 */
@Component
public class StompRateLimitInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompRateLimitInterceptor.class);

    private static final int MESSAGES_PER_MINUTE = 30;

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.SEND.equals(accessor.getCommand())) {
            return message;
        }

        String userId = resolveUserId(accessor);
        if (userId == null) {
            return message;
        }

        Bucket bucket = buckets.computeIfAbsent(userId, this::newBucket);
        if (!bucket.tryConsume(1)) {
            log.warn("STOMP rate limit exceeded for user={}", userId);
            throw new IllegalStateException("Rate limit exceeded: slow down message sending");
        }
        return message;
    }

    @EventListener
    public void onSessionDisconnect(SessionDisconnectEvent event) {
        if (event.getUser()
                        instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof JwtPrincipal principal) {
            String userId = principal.userId();
            if (buckets.remove(userId) != null) {
                log.debug("Evicted rate-limit bucket for user={}", userId);
            }
        }
    }

    private String resolveUserId(StompHeaderAccessor accessor) {
        if (accessor.getUser()
                        instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof JwtPrincipal principal) {
            return principal.userId();
        }
        return null;
    }

    @SuppressWarnings("PMD.UnusedFormalParameter")
    private Bucket newBucket(String userId) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(MESSAGES_PER_MINUTE)
                        .refillGreedy(MESSAGES_PER_MINUTE, Duration.ofMinutes(1))
                        .build())
                .build();
    }
}
