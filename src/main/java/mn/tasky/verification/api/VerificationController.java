package mn.tasky.verification.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.verification.dto.VerificationStatusApiResponse;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import mn.tasky.verification.dto.VerificationUploadUrlRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

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
        @Valid @RequestBody VerificationUploadUrlRequest body,
        HttpServletRequest request) {
        return authService
            .createVerificationUploadUrl(principal.userId(),
                body.contentType())
            .<ResponseEntity<?>>map(upload ->
                ResponseEntity.ok(Map.of("upload_url",
                    upload.uploadUrl(),
                    "storage_key",
                    upload.storageKey())))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "code",
                    "INVALID_CONTENT_TYPE",
                    "message",
                    "Unsupported content type. Use image/jpeg or image/png.",
                    "trace_id",
                    resolveTraceId(request))));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitVerification(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody VerificationSubmitRequest body,
        HttpServletRequest request) {
        if (!Boolean.TRUE.equals(body.consentAccepted())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "code",
                    "CONSENT_REQUIRED",
                    "message",
                    "Consent must be accepted to submit verification.",
                    "trace_id",
                    resolveTraceId(request)));
        }

        VerificationSubmitResult result =
            authService.submitVerification(principal.userId(),
                body.idCardFrontKey(),
                body.idCardBackKey(),
                body.consentPolicyVersion());

        return switch (result.outcome()) {
            case VerificationSubmitResult.SUCCESS -> ResponseEntity.ok(toStatusResponse(result.statusResponse()));
            case VerificationSubmitResult.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                    "code",
                    "VERIFICATION_ALREADY_SUBMITTED",
                    "message",
                    "Verification already submitted or approved.",
                    "trace_id",
                    resolveTraceId(request)));
            case VerificationSubmitResult.NOT_TASKER -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "code",
                    "NOT_TASKER",
                    "message",
                    "User must activate TASKER role before submitting " + "verification.",
                    "trace_id",
                    resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "code",
                    "USER_NOT_FOUND",
                    "message",
                    "Authenticated user could not be resolved.",
                    "trace_id",
                    resolveTraceId(request)));
        };
    }

    private VerificationStatusApiResponse toStatusResponse(VerificationStatusResponse status) {
        return new VerificationStatusApiResponse(
            status.status(),
            status.adminNotes(),
            status.submittedAt(),
            status.reviewedAt());
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@AuthenticationPrincipal JwtPrincipal principal) {
        VerificationStatusResponse status = authService.getVerificationStatus(principal.userId());
        return ResponseEntity.ok(toStatusResponse(status));
    }
}
