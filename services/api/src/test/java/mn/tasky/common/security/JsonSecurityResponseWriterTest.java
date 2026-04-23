package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.UUID;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("JsonSecurityResponseWriter")
class JsonSecurityResponseWriterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private JsonSecurityResponseWriter writer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        writer = new JsonSecurityResponseWriter(objectMapper);
    }

    @Nested
    @DisplayName("write")
    class Write {

        @Test
        @DisplayName("writes JSON error body with status and content type")
        void writesJsonBody() throws Exception {
            when(response.isCommitted()).thenReturn(false);
            when(request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE))
                    .thenReturn("trace-123");
            StringWriter sw = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(sw));

            writer.write(request, response, 401, "UNAUTHORIZED", "Auth required");

            verify(response).setStatus(401);
            verify(response).setContentType("application/json");
            String body = sw.toString();
            assertThat(body).contains("\"code\":\"UNAUTHORIZED\"");
            assertThat(body).contains("\"message\":\"Auth required\"");
            assertThat(body).contains("\"trace_id\":\"trace-123\"");
        }

        @Test
        @DisplayName("generates UUID trace_id when attribute is missing")
        void generatesTraceId() throws Exception {
            when(response.isCommitted()).thenReturn(false);
            when(request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE))
                    .thenReturn(null);
            StringWriter sw = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(sw));

            writer.write(request, response, 403, "FORBIDDEN", "No access");

            String body = sw.toString();
            assertThat(body).contains("\"trace_id\":");
            // Verify it's a valid UUID format
            String traceId = objectMapper.readTree(body).get("trace_id").asText();
            assertThat(UUID.fromString(traceId)).isNotNull();
        }

        @Test
        @DisplayName("skips writing when response is already committed")
        void committedResponse() throws Exception {
            when(response.isCommitted()).thenReturn(true);

            writer.write(request, response, 401, "UNAUTHORIZED", "Auth required");

            // No status or content type should be set
            org.mockito.Mockito.verifyNoMoreInteractions(response);
        }
    }
}
