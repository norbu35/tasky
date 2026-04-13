package mn.tasky.verification.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.runtime.publicapi.composition.VerificationPublicCompositionService;
import mn.tasky.runtime.publicapi.composition.VerificationSubmissionOutcome;
import mn.tasky.runtime.publicapi.composition.VerificationSubmissionService;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import mn.tasky.verification.dto.VerificationUploadUrlRequest;
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

    private final IdentityCommandPort identityCommandPort;
    private final VerificationPublicCompositionService verificationPublicCompositionService;
    private final VerificationSubmissionService verificationSubmissionService;

    public VerificationController(
            IdentityCommandPort identityCommandPort,
            VerificationPublicCompositionService verificationPublicCompositionService,
            VerificationSubmissionService verificationSubmissionService) {
        this.identityCommandPort = identityCommandPort;
        this.verificationPublicCompositionService = verificationPublicCompositionService;
        this.verificationSubmissionService = verificationSubmissionService;
    }

    @PostMapping("/upload-url")
    public ResponseEntity<?> getUploadUrl(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody VerificationUploadUrlRequest body,
            HttpServletRequest request) {
        return identityCommandPort
                .createVerificationUploadUrl(principal.userId(), body.contentType())
                .<ResponseEntity<?>>map(
                        upload -> ResponseEntity.ok(verificationPublicCompositionService.uploadUrlResponse(upload)))
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
        VerificationSubmissionOutcome outcome =
                verificationSubmissionService.submitVerification(principal.userId(), body);
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case CONSENT_REQUIRED, INVALID_VERIFICATION_KEY, NOT_TASKER -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
            case CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
            case USER_NOT_FOUND -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
        };
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(verificationPublicCompositionService.verificationStatus(principal.userId()));
    }
}
