package mn.tasky.runtime.publicapi.composition;

import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import org.springframework.stereotype.Component;

@Component
public class VerificationSubmissionService {

    private final IdentityCommandPort identityCommandPort;
    private final StorageKeyPolicy storageKeyPolicy;
    private final VerificationPublicCompositionService verificationPublicCompositionService;

    public VerificationSubmissionService(
            IdentityCommandPort identityCommandPort,
            StorageKeyPolicy storageKeyPolicy,
            VerificationPublicCompositionService verificationPublicCompositionService) {
        this.identityCommandPort = identityCommandPort;
        this.storageKeyPolicy = storageKeyPolicy;
        this.verificationPublicCompositionService = verificationPublicCompositionService;
    }

    public VerificationSubmissionOutcome submitVerification(String userId, VerificationSubmitRequest body) {
        if (!Boolean.TRUE.equals(body.consentAccepted())) {
            return VerificationSubmissionOutcome.failure(
                    VerificationSubmissionOutcome.Status.CONSENT_REQUIRED,
                    "CONSENT_REQUIRED",
                    "Consent must be accepted to submit verification.");
        }

        try {
            storageKeyPolicy.validateOwnedKey(body.idCardFrontKey(), StorageKeyPolicy.Namespace.VERIFICATION, userId);
            storageKeyPolicy.validateOwnedKey(body.idCardBackKey(), StorageKeyPolicy.Namespace.VERIFICATION, userId);
        } catch (IllegalArgumentException exception) {
            return VerificationSubmissionOutcome.failure(
                    VerificationSubmissionOutcome.Status.INVALID_VERIFICATION_KEY,
                    "INVALID_VERIFICATION_KEY",
                    "Verification keys must belong to the caller's verification namespace.");
        }

        VerificationSubmitResult result = identityCommandPort.submitVerification(
                userId, body.idCardFrontKey(), body.idCardBackKey(), body.consentPolicyVersion());
        return switch (result.outcome()) {
            case VerificationSubmitResult.SUCCESS -> VerificationSubmissionOutcome.success(
                    verificationPublicCompositionService.statusResponse(result.statusResponse()));
            case VerificationSubmitResult.CONFLICT -> VerificationSubmissionOutcome.failure(
                    VerificationSubmissionOutcome.Status.CONFLICT,
                    "VERIFICATION_ALREADY_SUBMITTED",
                    "Verification already submitted or approved.");
            case VerificationSubmitResult.NOT_TASKER -> VerificationSubmissionOutcome.failure(
                    VerificationSubmissionOutcome.Status.NOT_TASKER,
                    "NOT_TASKER",
                    "User must activate TASKER role before submitting verification.");
            default -> VerificationSubmissionOutcome.failure(
                    VerificationSubmissionOutcome.Status.USER_NOT_FOUND,
                    "USER_NOT_FOUND",
                    "Authenticated user could not be resolved.");
        };
    }
}
