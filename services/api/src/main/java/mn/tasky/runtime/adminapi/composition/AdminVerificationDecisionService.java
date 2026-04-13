package mn.tasky.runtime.adminapi.composition;

import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminVerificationDecisionService {

    private final IdentityCommandPort identityCommandPort;
    private final IdentityQueryPort identityQueryPort;
    private final AdminVerificationCompositionService adminVerificationCompositionService;

    public AdminVerificationDecisionService(
            IdentityCommandPort identityCommandPort,
            IdentityQueryPort identityQueryPort,
            AdminVerificationCompositionService adminVerificationCompositionService) {
        this.identityCommandPort = identityCommandPort;
        this.identityQueryPort = identityQueryPort;
        this.adminVerificationCompositionService = adminVerificationCompositionService;
    }

    public AdminVerificationDecisionOutcome approve(String verificationId) {
        return identityCommandPort
                .approveVerification(verificationId)
                .map(adminVerificationCompositionService::detailResponse)
                .map(AdminVerificationDecisionOutcome::success)
                .orElseGet(() -> identityQueryPort.verificationExists(verificationId)
                        ? AdminVerificationDecisionOutcome.failure(
                                AdminVerificationDecisionOutcome.Status.NOT_PENDING,
                                "NOT_PENDING",
                                "Verification is not in PENDING status.")
                        : AdminVerificationDecisionOutcome.failure(
                                AdminVerificationDecisionOutcome.Status.NOT_FOUND,
                                "NOT_FOUND",
                                "Verification not found."));
    }

    public AdminVerificationDecisionOutcome reject(String verificationId, String reason) {
        return identityCommandPort
                .rejectVerification(verificationId, reason)
                .map(adminVerificationCompositionService::detailResponse)
                .map(AdminVerificationDecisionOutcome::success)
                .orElseGet(() -> AdminVerificationDecisionOutcome.failure(
                        AdminVerificationDecisionOutcome.Status.NOT_FOUND,
                        "NOT_FOUND",
                        "Verification not found or not in PENDING status."));
    }
}
