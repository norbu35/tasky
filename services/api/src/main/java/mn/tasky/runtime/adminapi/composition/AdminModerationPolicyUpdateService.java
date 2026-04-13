package mn.tasky.runtime.adminapi.composition;

import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.stereotype.Component;

@Component
public class AdminModerationPolicyUpdateService {

    private final IdentityCommandPort identityCommandPort;
    private final AdminAuditCommandPort adminAuditCommandPort;
    private final AdminModerationCompositionService adminModerationCompositionService;

    public AdminModerationPolicyUpdateService(
            IdentityCommandPort identityCommandPort,
            AdminAuditCommandPort adminAuditCommandPort,
            AdminModerationCompositionService adminModerationCompositionService) {
        this.identityCommandPort = identityCommandPort;
        this.adminAuditCommandPort = adminAuditCommandPort;
        this.adminModerationCompositionService = adminModerationCompositionService;
    }

    public AdminModerationPolicyUpdateOutcome updatePolicy(String adminUserId, StrikePolicyRequest body) {
        if (body.repeatSuspensionDays() < body.firstSuspensionDays()) {
            return AdminModerationPolicyUpdateOutcome.invalidPolicy(
                    "repeatSuspensionDays must be greater than or equal to firstSuspensionDays");
        }
        if (body.repeatOffenseWindowDays() < body.strikeWindowDays()) {
            return AdminModerationPolicyUpdateOutcome.invalidPolicy(
                    "repeatOffenseWindowDays must be greater than or equal to strikeWindowDays");
        }

        ModerationPolicy updated = identityCommandPort.updateModerationPolicy(
                body.strikeWindowDays(),
                body.strikeThreshold(),
                body.firstSuspensionDays(),
                body.repeatSuspensionDays(),
                body.repeatOffenseWindowDays(),
                body.autoUnsuspendEnabled());
        adminAuditCommandPort.recordAdminAction(
                adminUserId, "MODERATION_POLICY_UPDATED", "MODERATION_POLICY", null, null);
        return AdminModerationPolicyUpdateOutcome.success(
                adminModerationCompositionService.strikePolicyResponse(updated));
    }
}
