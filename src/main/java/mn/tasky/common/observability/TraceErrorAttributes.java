package mn.tasky.common.observability;

import java.util.Map;
import java.util.UUID;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.servlet.error.DefaultErrorAttributes;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.WebRequest;

@Component
public class TraceErrorAttributes extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
        Map<String, Object> attributes = super.getErrorAttributes(webRequest, options);
        Object traceId =
                webRequest.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
        }
        attributes.put("trace_id", traceId.toString());
        return attributes;
    }
}
