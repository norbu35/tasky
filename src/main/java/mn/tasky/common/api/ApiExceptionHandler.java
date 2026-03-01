package mn.tasky.common.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import mn.tasky.auth.AccountRestrictedException;
import mn.tasky.auth.FacebookAuthException;
import mn.tasky.auth.RateLimitExceededException;
import mn.tasky.common.idempotency.IdempotencyException;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
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
        return error(HttpStatus.TOO_MANY_REQUESTS,
            ex.code(),
            ex.getMessage(),
            request);
    }

    private ResponseEntity<Map<String, String>> error(
        HttpStatus status,
        String code,
        String message,
        HttpServletRequest request
    ) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        String resolvedTraceId = traceId != null
            ? traceId.toString()
            : UUID.randomUUID()
            .toString();
        return ResponseEntity.status(status)
            .body(
                Map.of(
                    "code",
                    code,
                    "message",
                    message,
                    "trace_id",
                    resolvedTraceId
                )
            );
    }

    @ExceptionHandler(FacebookAuthException.class)
    public ResponseEntity<Map<String, String>> handleFacebookAuth(
        FacebookAuthException ex,
        HttpServletRequest request
    ) {
        return error(HttpStatus.UNAUTHORIZED,
            ex.code(),
            ex.getMessage(),
            request);
    }

    @ExceptionHandler(AccountRestrictedException.class)
    public ResponseEntity<Map<String, String>> handleAccountRestricted(
        AccountRestrictedException ex,
        HttpServletRequest request
    ) {
        return error(HttpStatus.FORBIDDEN,
            "ACCOUNT_RESTRICTED",
            ex.getMessage(),
            request);
    }

    @ExceptionHandler(IdempotencyException.class)
    public ResponseEntity<Map<String, String>> handleIdempotency(
        IdempotencyException ex,
        HttpServletRequest request
    ) {
        return error(ex.status(),
            ex.code(),
            ex.getMessage(),
            request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .findFirst()
            .map(error -> error.getField() + " " + error.getDefaultMessage())
            .orElse("Request validation failed.");
        return error(HttpStatus.BAD_REQUEST,
            "VALIDATION_ERROR",
            message,
            request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(
        ConstraintViolationException ex,
        HttpServletRequest request
    ) {
        String message = ex.getConstraintViolations()
            .stream()
            .findFirst()
            .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
            .orElse("Request validation failed.");
        return error(HttpStatus.BAD_REQUEST,
            "VALIDATION_ERROR",
            message,
            request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(
        HttpMessageNotReadableException ex,
        HttpServletRequest request
    ) {
        return error(HttpStatus.BAD_REQUEST,
            "INVALID_JSON",
            "Malformed JSON request.",
            request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(
        IllegalArgumentException ex,
        HttpServletRequest request
    ) {
        return error(
            HttpStatus.BAD_REQUEST,
            "INVALID_ARGUMENT",
            ex.getMessage() == null
                ? "Invalid request argument."
                : ex.getMessage(),
            request
        );
    }
}
