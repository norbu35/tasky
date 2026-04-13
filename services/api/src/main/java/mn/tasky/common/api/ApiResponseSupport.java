package mn.tasky.common.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ApiResponseSupport {

    private ApiResponseSupport() {}

    public static ResponseEntity<Map<String, String>> idempotencyInProgress(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errorBody("IDEMPOTENCY_IN_PROGRESS", "An identical request is still being processed.", request));
    }

    public static ResponseEntity<Map<String, String>> featureDeferred(HttpServletRequest request, String message) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(errorBody("FEATURE_DEFERRED", message, request));
    }

    public static Map<String, String> errorBody(String code, String message, HttpServletRequest request) {
        return Map.of("code", code, "message", message, "trace_id", resolveTraceId(request));
    }

    public static String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public static ResponseEntity<Map<String, String>> idempotencyReplayMissing(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errorBody(
                        "IDEMPOTENCY_REPLAY_MISSING",
                        "Previous request exists but replay state could not be loaded.",
                        request));
    }
}
