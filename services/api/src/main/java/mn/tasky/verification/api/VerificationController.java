package mn.tasky.verification.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.api.generated.VerificationApi;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.runtime.publicapi.composition.VerificationPublicCompositionService;
import mn.tasky.runtime.publicapi.composition.VerificationSubmissionOutcome;
import mn.tasky.runtime.publicapi.composition.VerificationSubmissionService;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import mn.tasky.verification.dto.VerificationUploadUrlRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1/verification")
@Validated
@SuppressWarnings("unchecked")
public class VerificationController implements VerificationApi {

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

    @Override
    @GetMapping("/status")
    public ResponseEntity<mn.tasky.api.generated.model.VerificationStatus> getVerificationStatus() {
        JwtPrincipal principal = getPrincipal();
        return (ResponseEntity<mn.tasky.api.generated.model.VerificationStatus>) (ResponseEntity<?>)
                ResponseEntity.ok(verificationPublicCompositionService.verificationStatus(principal.userId()));
    }

    @Override
    @PostMapping(
            value = "/upload-url",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.PresignedUrlResponse> getVerificationUploadUrl(
            @Valid @RequestBody
                    mn.tasky.api.generated.model.GetVerificationUploadUrlRequest getVerificationUploadUrlRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        var domainBody = new VerificationUploadUrlRequest(getVerificationUploadUrlRequest.getContentType());
        return identityCommandPort
                .createVerificationUploadUrl(principal.userId(), domainBody.contentType())
                .<ResponseEntity<mn.tasky.api.generated.model.PresignedUrlResponse>>map(upload ->
                        (ResponseEntity<mn.tasky.api.generated.model.PresignedUrlResponse>) (ResponseEntity<?>)
                                ResponseEntity.ok(verificationPublicCompositionService.uploadUrlResponse(upload)))
                .orElseGet(() -> (ResponseEntity<mn.tasky.api.generated.model.PresignedUrlResponse>)
                        (ResponseEntity<?>) ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                        "code",
                                        "INVALID_CONTENT_TYPE",
                                        "message",
                                        "Unsupported content type. Use image/jpeg or image/png.",
                                        "trace_id",
                                        resolveTraceId(request))));
    }

    @Override
    @PostMapping(
            value = "/submit",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.VerificationStatus> submitVerification(
            @Valid @RequestBody mn.tasky.api.generated.model.SubmitVerificationRequest submitVerificationRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        VerificationSubmitRequest domainBody = new VerificationSubmitRequest(
                submitVerificationRequest.getIdCardFrontKey(),
                submitVerificationRequest.getIdCardBackKey(),
                submitVerificationRequest.getConsentPolicyVersion(),
                submitVerificationRequest.getConsentAccepted());
        VerificationSubmissionOutcome outcome =
                verificationSubmissionService.submitVerification(principal.userId(), domainBody);
        return switch (outcome.status()) {
            case SUCCESS -> (ResponseEntity<mn.tasky.api.generated.model.VerificationStatus>)
                    (ResponseEntity<?>) ResponseEntity.ok(outcome.body());
            case CONSENT_REQUIRED, INVALID_VERIFICATION_KEY, NOT_TASKER -> (ResponseEntity<
                            mn.tasky.api.generated.model.VerificationStatus>)
                    (ResponseEntity<?>) ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of(
                                    "code",
                                    outcome.errorCode(),
                                    "message",
                                    outcome.errorMessage(),
                                    "trace_id",
                                    resolveTraceId(request)));
            case CONFLICT -> (ResponseEntity<mn.tasky.api.generated.model.VerificationStatus>)
                    (ResponseEntity<?>) ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of(
                                    "code",
                                    outcome.errorCode(),
                                    "message",
                                    outcome.errorMessage(),
                                    "trace_id",
                                    resolveTraceId(request)));
            case USER_NOT_FOUND -> (ResponseEntity<mn.tasky.api.generated.model.VerificationStatus>)
                    (ResponseEntity<?>) ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                    "code",
                                    outcome.errorCode(),
                                    "message",
                                    outcome.errorMessage(),
                                    "trace_id",
                                    resolveTraceId(request)));
        };
    }

    @Override
    @PostMapping(
            value = "/dan/verify",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.VerificationStatus> verifyWithDan(
            @Valid @RequestBody mn.tasky.api.generated.model.VerifyWithDanRequest verifyWithDanRequest) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private HttpServletRequest getRequest() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
