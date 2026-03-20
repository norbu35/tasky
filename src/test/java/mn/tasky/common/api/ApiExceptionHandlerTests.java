package mn.tasky.common.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.Set;
import mn.tasky.auth.FacebookAuthException;
import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

class ApiExceptionHandlerTests {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void handleRateLimitUsesTraceIdFromRequest() {
        MockHttpServletRequest request = requestWithTraceId("trace-1");

        var response = handler.handleRateLimit(
                new RateLimitExceededException("OTP_RATE_LIMIT", "Too many attempts."), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody().code()).isEqualTo("OTP_RATE_LIMIT");
        assertThat(response.getBody().traceId()).isEqualTo("trace-1");
    }

    private MockHttpServletRequest requestWithTraceId(String traceId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, traceId);
        return request;
    }

    @Test
    void handleMethodArgumentNotValidReturnsFieldMessage() throws Exception {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "body");
        bindingResult.addError(new FieldError("body", "rating", "must be between 1 and 5"));
        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(methodParameter(), bindingResult);

        var response = handler.handleMethodArgumentNotValid(exception, new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().message()).isEqualTo("rating must be between 1 and 5");
        assertThat(response.getBody().traceId()).isNotBlank();
    }

    private MethodParameter methodParameter() throws Exception {
        Method method = ApiExceptionHandlerTests.class.getDeclaredMethod("sampleMethod", Map.class);
        return new MethodParameter(method, 0);
    }

    @Test
    void handleConstraintViolationReturnsViolationMessage() {
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("limit");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must be greater than 0");

        ConstraintViolationException exception = new ConstraintViolationException(Set.of(violation));
        HttpServletRequest request = new MockHttpServletRequest();

        var response = handler.handleConstraintViolation(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().message()).isEqualTo("limit must be greater than 0");
    }

    @Test
    void handleNotReadableReturnsInvalidJsonCode() {
        var response = handler.handleNotReadable(
                new HttpMessageNotReadableException("Malformed payload", new MockHttpInputMessage(new byte[0])),
                new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo("INVALID_JSON");
        assertThat(response.getBody().message()).isEqualTo("Malformed JSON request.");
    }

    @Test
    void handleIllegalArgumentUsesFallbackMessageWhenMissing() {
        var response = handler.handleIllegalArgument(
                new IllegalArgumentException((String) null), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo("INVALID_ARGUMENT");
        assertThat(response.getBody().message()).isEqualTo("Invalid request argument.");
    }

    @Test
    void handleFacebookAuthProviderUnavailableReturnsServiceUnavailable() {
        var response = handler.handleFacebookAuth(
                new FacebookAuthException("AUTH_PROVIDER_UNAVAILABLE", "Facebook provider is unavailable."),
                requestWithTraceId("trace-provider-down"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody().code()).isEqualTo("AUTH_PROVIDER_UNAVAILABLE");
        assertThat(response.getBody().traceId()).isEqualTo("trace-provider-down");
    }

    @Test
    void handleFacebookAuthTokenInvalidReturnsUnauthorized() {
        var response = handler.handleFacebookAuth(
                new FacebookAuthException("FACEBOOK_TOKEN_INVALID", "Facebook token is invalid."),
                new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().code()).isEqualTo("FACEBOOK_TOKEN_INVALID");
    }

    @Test
    void handleAccessDeniedReturnsForbidden() {
        MockHttpServletRequest request = requestWithTraceId("trace-forbidden");

        var response = handler.handleForbidden(new AccessDeniedException("Denied"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().code()).isEqualTo("FORBIDDEN");
        assertThat(response.getBody().message()).isEqualTo("Access denied");
        assertThat(response.getBody().traceId()).isEqualTo("trace-forbidden");
    }

    @Test
    void handleUnexpectedExceptionReturnsInternalServerError() {
        MockHttpServletRequest request = requestWithTraceId("trace-unexpected");

        var response = handler.handleUnexpected(new RuntimeException("something broke"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().traceId()).isEqualTo("trace-unexpected");
    }

    @Test
    void handleUnexpectedExceptionGeneratesTraceIdWhenMissing() {
        var response = handler.handleUnexpected(new RuntimeException("oops"), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().traceId()).isNotBlank();
    }

    @SuppressWarnings("unused")
    private void sampleMethod(Map<String, Object> body) {}
}
