package mn.tasky.runtime.adminapi.composition;

import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.springframework.stereotype.Component;

/**
 * Runtime admin composition service for user management.
 * Delegates identity queries and admin actions through the identity module's public ports.
 */
@Component
public class AdminUserCompositionService {

    private final IdentityCommandPort identityCommandPort;
    private final IdentityQueryPort identityQueryPort;

    public AdminUserCompositionService(IdentityCommandPort identityCommandPort, IdentityQueryPort identityQueryPort) {
        this.identityCommandPort = identityCommandPort;
        this.identityQueryPort = identityQueryPort;
    }

    public UserProfilePage searchByName(String name, String cursor, int limit) {
        return identityQueryPort.searchUsersByName(name, cursor, limit);
    }

    public UserProfilePage searchByFacebookId(String facebookId, String cursor, int limit) {
        return identityQueryPort.searchUsersByFacebookId(facebookId, cursor, limit);
    }

    public UserProfilePage searchByPhone(String phone, String cursor, int limit) {
        return identityQueryPort.searchUsersByPhone(phone, cursor, limit);
    }

    public boolean banUser(String adminUserId, String targetUserId, String reason) {
        return identityCommandPort.banUser(adminUserId, targetUserId, reason);
    }

    public boolean unbanUser(String adminUserId, String targetUserId, String reason) {
        return identityCommandPort.unbanUser(adminUserId, targetUserId, reason);
    }
}
