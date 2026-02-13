package mn.tasky.verification;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.AuthService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/verification")
@Validated
public class VerificationController {

    private final AuthService authService;

    public VerificationController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/upload-url")
    public ResponseEntity<?> getUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody UploadUrlBody body,
        HttpServletRequest request
    ) {
        return authService.createVerificationUploadUrl(principal.userId(), body.contentType())
            .<ResponseEntity<?>>map(upload -> ResponseEntity.ok(
                Map.of(
                    "upload_url", upload.uploadUrl(),
                    "storage_key", upload.storageKey()
                )
            ))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "INVALID_CONTENT_TYPE",
                    "message", "Unsupported content type. Use image/jpeg or image/png.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitVerification(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody SubmitBody body,
        HttpServletRequest request
    ) {
        AuthService.VerificationSubmitResult result = authService.submitVerification(
            principal.userId(), body.idCardFrontKey(), body.idCardBackKey()
        );

        return switch (result.outcome()) {
            case AuthService.VerificationSubmitResult.SUCCESS -> ResponseEntity.ok(
                toStatusResponse(result.statusResponse())
            );
            case AuthService.VerificationSubmitResult.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "VERIFICATION_ALREADY_SUBMITTED",
                    "message", "Verification already submitted or approved.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case AuthService.VerificationSubmitResult.NOT_TASKER -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "NOT_TASKER",
                    "message", "User must activate TASKER role before submitting verification.",
                    "trace_id", resolveTraceId(request)
                )
            );
            default -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of(
                    "code", "USER_NOT_FOUND",
                    "message", "Authenticated user could not be resolved.",
                    "trace_id", resolveTraceId(request)
                )
            );
        };
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(
        @AuthenticationPrincipal JwtPrincipal principal
    ) {
        AuthService.VerificationStatusResponse status = authService.getVerificationStatus(principal.userId());
        return ResponseEntity.ok(toStatusResponse(status));
    }

    private VerificationStatusBody toStatusResponse(AuthService.VerificationStatusResponse status) {
        return new VerificationStatusBody(
            status.status(),
            status.adminNotes(),
            status.submittedAt(),
            status.reviewedAt()
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record UploadUrlBody(
        @JsonProperty("content_type")
        @NotBlank
        @Pattern(
            regexp = "^(image/jpeg|image/png)$",
            flags = Pattern.Flag.CASE_INSENSITIVE
        )
        String contentType
    ) {
    }

    public record SubmitBody(
        @JsonProperty("id_card_front_key")
        @NotBlank
        String idCardFrontKey,
        @JsonProperty("id_card_back_key")
        @NotBlank
        String idCardBackKey
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VerificationStatusBody(
        String status,
        @JsonProperty("admin_notes")
        String adminNotes,
        @JsonProperty("submitted_at")
        String submittedAt,
        @JsonProperty("reviewed_at")
        String reviewedAt
    ) {
    }
}
