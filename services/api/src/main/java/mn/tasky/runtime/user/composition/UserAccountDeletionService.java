package mn.tasky.runtime.user.composition;

import java.util.Map;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.stereotype.Component;

@Component
public class UserAccountDeletionService {

    private static final String DELETION_MESSAGE =
            "Account deletion requested. Data will be removed after 90-day retention period.";

    private final IdentityCommandPort identityCommandPort;

    public UserAccountDeletionService(IdentityCommandPort identityCommandPort) {
        this.identityCommandPort = identityCommandPort;
    }

    public Map<String, String> deleteMyAccount(String userId) {
        identityCommandPort.requestAccountDeletion(userId);
        return Map.of("message", DELETION_MESSAGE);
    }
}
