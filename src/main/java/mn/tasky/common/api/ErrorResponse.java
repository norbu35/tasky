package mn.tasky.common.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ErrorResponse(String code, String message, @JsonProperty("trace_id") String traceId) {}
