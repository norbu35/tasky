package mn.tasky.common.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import java.time.Instant;
import mn.tasky.auth.dao.RateLimitCounterDao;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class RateLimitFilterTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void qpayCallbackUsesDedicatedUnauthenticatedRateLimitKey() throws Exception {
        RateLimitCounterDao rateLimitCounterDao = mock(RateLimitCounterDao.class);
        ClientIpResolver clientIpResolver = mock(ClientIpResolver.class);
        FilterChain filterChain = mock(FilterChain.class);
        RateLimitFilter filter =
                new RateLimitFilter(rateLimitCounterDao, new ObjectMapper(), clientIpResolver, 100, 30);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/payments/qpay/callback");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(clientIpResolver.resolve(request)).thenReturn("203.0.113.9");
        when(rateLimitCounterDao.incrementAndGet(
                        eq("api-qpay-callback:203.0.113.9"),
                        any(Instant.class),
                        any(Instant.class),
                        any(Instant.class)))
                .thenReturn(1);

        filter.doFilterInternal(request, response, filterChain);

        verify(rateLimitCounterDao).deleteExpired(any(Instant.class));
        verify(rateLimitCounterDao)
                .incrementAndGet(
                        eq("api-qpay-callback:203.0.113.9"),
                        any(Instant.class),
                        any(Instant.class),
                        any(Instant.class));
        verify(filterChain).doFilter(request, response);
    }
}
