package mn.tasky.common.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.UUID;
import mn.tasky.auth.AccountRestrictedException;
import mn.tasky.auth.FacebookAuthException;
import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.common.idempotency.IdempotencyException;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(
            RateLimitExceededException ex, HttpServletRequest request) {
        return error(HttpStatus.TOO_MANY_REQUESTS, ex.code(), ex.getMessage(), request);
    }

    @ExceptionHandler(FacebookAuthException.class)
    public ResponseEntity<ErrorResponse> handleFacebookAuth(
            FacebookAuthException ex, HttpServletRequest request) {
        HttpStatus status = "AUTH_PROVIDER_UNAVAILABLE".equals(ex.code())
                ? HttpStatus.SERVICE_UNAVAILABLE
                : HttpStatus.UNAUTHORIZED;
        return error(status, ex.code(), ex.getMessage(), request);
    }

    @ExceptionHandler(AccountRestrictedException.class)
    public ResponseEntity<ErrorResponse> handleAccountRestricted(
            AccountRestrictedException ex, HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "ACCOUNT_RESTRICTED", ex.getMessage(), request);
    }

    @ExceptionHandler(IdempotencyException.class)
    public ResponseEntity<ErrorResponse> handleIdempotency(IdempotencyException ex, HttpServletRequest request) {
        return error(ex.status(), ex.code(), ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .orElse("Request validation failed.");
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
                .orElse("Request validation failed.");
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_JSON", "Malformed JSON request.", request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return error(
                HttpStatus.BAD_REQUEST,
                "INVALID_ARGUMENT",
                ex.getMessage() == null ? "Invalid request argument." : ex.getMessage(),
                request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(
            AccessDeniedException ex, HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", request);
    }

    private ResponseEntity<ErrorResponse> error(
            HttpStatus status, String code, String message, HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        String resolvedTraceId =
                traceId != null ? traceId.toString() : UUID.randomUUID().toString();
        return ResponseEntity.status(status)
                .body(new ErrorResponse(code, message, resolvedTraceId));
    }
}
