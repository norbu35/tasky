package mn.tasky.common.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

public final class ApiResponseSupport {

    private ApiResponseSupport() {
    }

    public static ResponseEntity<Map<String, String>> idempotencyInProgress(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of(
                "code",
                "IDEMPOTENCY_IN_PROGRESS",
                "message",
                "An identical request is still being processed.",
                "trace_id",
                resolveTraceId(request)));
    }

    public static String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID()
            .toString();
    }

    public static ResponseEntity<Map<String, String>> idempotencyReplayMissing(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of(
                "code",
                "IDEMPOTENCY_REPLAY_MISSING",
                "message",
                "Previous request exists but replay state could not be loaded.",
                "trace_id",
                resolveTraceId(request)));
    }
}
