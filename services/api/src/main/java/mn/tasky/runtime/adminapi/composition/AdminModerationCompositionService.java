package mn.tasky.runtime.adminapi.composition;

import mn.tasky.admin.dto.StrikePolicyResponse;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminModerationCompositionService {

    private final IdentityQueryPort identityQueryPort;

    public AdminModerationCompositionService(IdentityQueryPort identityQueryPort) {
        this.identityQueryPort = identityQueryPort;
    }

    public StrikePolicyResponse currentStrikePolicy() {
        return strikePolicyResponse(identityQueryPort.getModerationPolicy());
    }

    public StrikePolicyResponse strikePolicyResponse(ModerationPolicy policy) {
        return new StrikePolicyResponse(
                policy.strikeWindowDays(),
                policy.strikeThreshold(),
                policy.firstSuspensionDays(),
                policy.repeatSuspensionDays(),
                policy.repeatOffenseWindowDays(),
                policy.autoUnsuspendEnabled(),
                policy.updatedAt() != null ? policy.updatedAt().toString() : null);
    }
}
