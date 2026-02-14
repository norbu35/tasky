package mn.tasky.common.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleRateLimit(
        RateLimitExceededException ex,
        HttpServletRequest request
    ) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        String resolvedTraceId = traceId != null ? traceId.toString() : UUID.randomUUID().toString();

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
            Map.of(
                "code", ex.code(),
                "message", ex.getMessage(),
                "trace_id", resolvedTraceId
            )
        );
    }
}
