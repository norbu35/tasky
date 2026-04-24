package mn.tasky.runtime.adminapi.composition;

import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AdminVerificationDecisionService {

    private static final Logger log = LoggerFactory.getLogger(AdminVerificationDecisionService.class);
    private static final String NOTIFICATION_TYPE = "VERIFICATION_DECISION";

    private final IdentityCommandPort identityCommandPort;
    private final IdentityQueryPort identityQueryPort;
    private final AdminVerificationCompositionService adminVerificationCompositionService;
    private final NotificationCommandPort notificationCommandPort;

    public AdminVerificationDecisionService(
            IdentityCommandPort identityCommandPort,
            IdentityQueryPort identityQueryPort,
            AdminVerificationCompositionService adminVerificationCompositionService,
            NotificationCommandPort notificationCommandPort) {
        this.identityCommandPort = identityCommandPort;
        this.identityQueryPort = identityQueryPort;
        this.adminVerificationCompositionService = adminVerificationCompositionService;
        this.notificationCommandPort = notificationCommandPort;
    }

    public AdminVerificationDecisionOutcome approve(String verificationId) {
        return identityCommandPort
                .approveVerification(verificationId)
                .map(detail -> notifyVerificationDecision(detail, "APPROVED"))
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
                .map(detail -> notifyVerificationDecision(detail, "REJECTED"))
                .map(adminVerificationCompositionService::detailResponse)
                .map(AdminVerificationDecisionOutcome::success)
                .orElseGet(() -> AdminVerificationDecisionOutcome.failure(
                        AdminVerificationDecisionOutcome.Status.NOT_FOUND,
                        "NOT_FOUND",
                        "Verification not found or not in PENDING status."));
    }

    private VerificationDetail notifyVerificationDecision(VerificationDetail detail, String decision) {
        String title = "APPROVED".equals(decision) ? "Verification approved" : "Verification rejected";
        String body = "APPROVED".equals(decision)
                ? "Your Tasky verification was approved. You can now apply to tasks."
                : "Your Tasky verification was rejected. Check the reason and submit updated documents.";
        try {
            notificationCommandPort.sendPushWithEventKey(
                    detail.userId(),
                    title,
                    body,
                    NOTIFICATION_TYPE,
                    "verification-decision:" + detail.id() + ":" + decision);
        } catch (RuntimeException exception) {
            log.warn("Failed to send verification decision notification: verification={}", detail.id(), exception);
        }
        return detail;
    }
}
