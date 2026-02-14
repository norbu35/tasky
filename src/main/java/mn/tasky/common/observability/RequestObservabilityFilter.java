package mn.tasky.common.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestObservabilityFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String CORRELATION_ID_ATTRIBUTE = "tasky.correlation_id";
    public static final String TRACE_ID_ATTRIBUTE = "tasky.trace_id";
    public static final String CORRELATION_ID_MDC_KEY = "correlation_id";
    public static final String TRACE_ID_MDC_KEY = "trace_id";

    private static final Logger log = LoggerFactory.getLogger(RequestObservabilityFilter.class);

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String correlationId = resolveOrCreateId(request.getHeader(CORRELATION_ID_HEADER));
        String traceId = resolveOrCreateId(request.getHeader(TRACE_ID_HEADER));
        long startedAt = System.nanoTime();

        request.setAttribute(CORRELATION_ID_ATTRIBUTE, correlationId);
        request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        MDC.put(TRACE_ID_MDC_KEY, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info(
                "request_completed method={} path={} status={} duration_ms={} correlation_id={} trace_id={}",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                durationMs,
                correlationId,
                traceId
            );
            MDC.remove(CORRELATION_ID_MDC_KEY);
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }

    private String resolveOrCreateId(String value) {
        if (StringUtils.hasText(value)) {
            return value.trim();
        }
        return UUID.randomUUID().toString();
    }
}
