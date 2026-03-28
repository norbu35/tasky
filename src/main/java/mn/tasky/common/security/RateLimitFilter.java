package mn.tasky.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.auth.dao.RateLimitCounterDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Global API rate-limiting filter using a sliding window backed by the
 * {@code rate_limit_counters} table.
 *
 * <p>Authenticated requests are keyed by user ID (100 req/min default).
 * Unauthenticated requests are keyed by client IP (30 req/min default).
 * Paths under {@code /actuator/} and {@code /ws/} are excluded.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RateLimitCounterDao rateLimitCounterDao;
    private final ObjectMapper objectMapper;
    private final ClientIpResolver clientIpResolver;
    private final int authenticatedRpm;
    private final int unauthenticatedRpm;

    public RateLimitFilter(
            RateLimitCounterDao rateLimitCounterDao,
            ObjectMapper objectMapper,
            ClientIpResolver clientIpResolver,
            @Value("${tasky.rate-limit.authenticated-rpm:100}") int authenticatedRpm,
            @Value("${tasky.rate-limit.unauthenticated-rpm:30}") int unauthenticatedRpm) {
        this.rateLimitCounterDao = rateLimitCounterDao;
        this.objectMapper = objectMapper;
        this.clientIpResolver = clientIpResolver;
        this.authenticatedRpm = authenticatedRpm;
        this.unauthenticatedRpm = unauthenticatedRpm;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/") || path.startsWith("/ws/") || "/ws".equals(path);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = authentication != null && authentication.isAuthenticated();

        String rateKey;
        int limit;
        if (authenticated) {
            rateKey = "api-user:" + authentication.getName();
            limit = authenticatedRpm;
        } else {
            rateKey = "api-ip:" + clientIpResolver.resolve(request);
            limit = unauthenticatedRpm;
        }

        if (!authenticated && "/api/v1/payments/qpay/callback".equals(request.getRequestURI())) {
            rateKey = "api-qpay-callback:" + clientIpResolver.resolve(request);
            limit = 10;
        }

        Instant now = Instant.now();
        Instant cutoff = now.minus(WINDOW);
        Instant expiresAt = now.plus(WINDOW);

        rateLimitCounterDao.deleteExpired(now);
        int attempts = rateLimitCounterDao.incrementAndGet(rateKey, now, cutoff, expiresAt);

        if (attempts > limit) {
            long retryAfter = WINDOW.toSeconds();
            log.warn("Rate limit exceeded for key={} attempts={} limit={}", rateKey, attempts, limit);
            writeRateLimitResponse(response, retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response, long retryAfter) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfter));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", "RATE_LIMITED");
        body.put("message", "Too many requests");
        body.put("retry_after", retryAfter);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
