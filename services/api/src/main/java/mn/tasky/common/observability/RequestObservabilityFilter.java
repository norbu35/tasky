package mn.tasky.common.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestObservabilityFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String CLIENT_PLATFORM_HEADER = "X-Client-Platform";
    public static final String CORRELATION_ID_ATTRIBUTE = "tasky.correlation_id";
    public static final String TRACE_ID_ATTRIBUTE = "tasky.trace_id";
    public static final String CORRELATION_ID_MDC_KEY = "correlation_id";
    public static final String TRACE_ID_MDC_KEY = "trace_id";
    public static final String LOCALE_MDC_KEY = "locale";
    public static final String PLATFORM_MDC_KEY = "platform";

    private static final Logger log = LoggerFactory.getLogger(RequestObservabilityFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = resolveOrCreateId(request.getHeader(CORRELATION_ID_HEADER));
        String traceId = resolveOrCreateId(request.getHeader(TRACE_ID_HEADER));
        String locale = resolveLocale(request.getHeader("Accept-Language"));
        String platform = resolvePlatform(request.getHeader(CLIENT_PLATFORM_HEADER), request.getHeader("User-Agent"));
        long startedAt = System.nanoTime();

        request.setAttribute(CORRELATION_ID_ATTRIBUTE, correlationId);
        request.setAttribute(TRACE_ID_ATTRIBUTE, traceId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        MDC.put(TRACE_ID_MDC_KEY, traceId);
        MDC.put(LOCALE_MDC_KEY, locale);
        MDC.put(PLATFORM_MDC_KEY, platform);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info(
                    "request_completed method={} path={} status={} duration_ms={} " + "correlation_id={} trace_id={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    durationMs,
                    correlationId,
                    traceId);
            MDC.remove(CORRELATION_ID_MDC_KEY);
            MDC.remove(TRACE_ID_MDC_KEY);
            MDC.remove(LOCALE_MDC_KEY);
            MDC.remove(PLATFORM_MDC_KEY);
        }
    }

    private static final java.util.regex.Pattern SAFE_ID_PATTERN =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9._-]{1,128}$");

    private String resolveOrCreateId(String value) {
        if (StringUtils.hasText(value)) {
            String trimmed = value.trim();
            if (SAFE_ID_PATTERN.matcher(trimmed).matches()) {
                return trimmed;
            }
        }
        return UUID.randomUUID().toString();
    }

    private String resolveLocale(String acceptLanguage) {
        if (!StringUtils.hasText(acceptLanguage)) {
            return "mn";
        }
        String firstPreference = acceptLanguage.split(",")[0].trim();
        int qualitySeparator = firstPreference.indexOf(';');
        if (qualitySeparator >= 0) {
            firstPreference = firstPreference.substring(0, qualitySeparator).trim();
        }
        return StringUtils.hasText(firstPreference) ? firstPreference : "mn";
    }

    private String resolvePlatform(String explicitPlatform, String userAgent) {
        if (StringUtils.hasText(explicitPlatform)) {
            String normalized = explicitPlatform.trim().toUpperCase(Locale.ROOT);
            if ("WEB".equals(normalized) || "ANDROID".equals(normalized) || "IOS".equals(normalized)) {
                return normalized;
            }
        }

        String normalizedUserAgent = userAgent == null ? "" : userAgent.toLowerCase(Locale.ROOT);
        if (normalizedUserAgent.contains("android")) {
            return "ANDROID";
        }
        if (normalizedUserAgent.contains("iphone")
                || normalizedUserAgent.contains("ipad")
                || normalizedUserAgent.contains("ios")) {
            return "IOS";
        }
        if (normalizedUserAgent.contains("mozilla")
                || normalizedUserAgent.contains("chrome")
                || normalizedUserAgent.contains("safari")
                || normalizedUserAgent.contains("firefox")
                || normalizedUserAgent.contains("edg")) {
            return "WEB";
        }
        return "UNKNOWN";
    }
}
