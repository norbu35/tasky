package mn.tasky.runtime.adminapi.composition;

import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.stereotype.Component;

@Component
public class AdminModerationPolicyUpdateService {

    private final IdentityCommandPort identityCommandPort;
    private final AuditEventDao auditEventDao;
    private final AdminModerationCompositionService adminModerationCompositionService;

    public AdminModerationPolicyUpdateService(
            IdentityCommandPort identityCommandPort,
            AuditEventDao auditEventDao,
            AdminModerationCompositionService adminModerationCompositionService) {
        this.identityCommandPort = identityCommandPort;
        this.auditEventDao = auditEventDao;
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
        auditEventDao.insert(adminUserId, "MODERATION_POLICY_UPDATED", "MODERATION_POLICY", null, null);
        return AdminModerationPolicyUpdateOutcome.success(
                adminModerationCompositionService.strikePolicyResponse(updated));
    }
}
