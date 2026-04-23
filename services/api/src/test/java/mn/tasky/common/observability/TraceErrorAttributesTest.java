package mn.tasky.common.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.WebRequest;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TraceErrorAttributesTest {

    private TraceErrorAttributes traceErrorAttributes;

    @Mock
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        traceErrorAttributes = new TraceErrorAttributes();
    }

    @Test
    void setsTraceIdFromRequestAttribute() {
        String expectedTraceId = "abc-123-def-456";
        when(webRequest.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST))
                .thenReturn(expectedTraceId);

        Map<String, Object> attrs =
                traceErrorAttributes.getErrorAttributes(webRequest, ErrorAttributeOptions.defaults());

        assertThat(attrs.get("trace_id")).isEqualTo(expectedTraceId);
    }

    @Test
    void fallsBackToUuidWhenTraceIdAttributeIsNull() {
        when(webRequest.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST))
                .thenReturn(null);

        Map<String, Object> attrs =
                traceErrorAttributes.getErrorAttributes(webRequest, ErrorAttributeOptions.defaults());

        assertThat(attrs.get("trace_id")).isNotNull().isInstanceOf(String.class);
        String traceId = (String) attrs.get("trace_id");
        assertThat(traceId).matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }
}
