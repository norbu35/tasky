package mn.tasky.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
public class JsonSecurityResponseWriter {

    private final ObjectMapper objectMapper;

    public JsonSecurityResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(
        HttpServletRequest request,
        HttpServletResponse response,
        int status,
        String code,
        String message
    ) throws IOException {
        if (response.isCommitted()) {
            return;
        }

        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        String resolvedTraceId = traceId != null ? traceId.toString() : UUID.randomUUID().toString();

        Map<String, String> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        body.put("trace_id", resolvedTraceId);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
