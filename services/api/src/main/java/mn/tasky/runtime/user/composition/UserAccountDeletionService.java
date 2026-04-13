package mn.tasky.runtime.user.composition;

import java.util.Map;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Component;

@Component
public class UserAccountDeletionService {

    private static final String DELETION_MESSAGE =
            "Account deletion requested. Data will be removed after 90-day retention period.";

    private final UserDao userDao;
    private final AuditEventDao auditEventDao;

    public UserAccountDeletionService(UserDao userDao, AuditEventDao auditEventDao) {
        this.userDao = userDao;
        this.auditEventDao = auditEventDao;
    }

    public Map<String, String> deleteMyAccount(String userId) {
        userDao.updateStatus(userId, "DELETED");
        auditEventDao.insert(
                userId, "USER_SELF_DELETE_REQUEST", "USER", userId, "{\"reason\":\"USER_SELF_DELETE_REQUEST\"}");
        return Map.of("message", DELETION_MESSAGE);
    }
}
