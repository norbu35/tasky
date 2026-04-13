package mn.tasky.auth.application;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.ModerationPolicy;
import org.springframework.stereotype.Component;

@Component
public class UserStatusResolver {

    private final ModerationPolicyDao moderationPolicyDao;
    private final UserDao userDao;
    private final SuspensionEventDao suspensionEventDao;

    public UserStatusResolver(
            ModerationPolicyDao moderationPolicyDao,
            UserDao userDao,
            SuspensionEventDao suspensionEventDao) {
        this.moderationPolicyDao = moderationPolicyDao;
        this.userDao = userDao;
        this.suspensionEventDao = suspensionEventDao;
    }

    /**
     * Resolves the effective user status, auto-unspending a suspended user
     * when their suspension period has elapsed and auto-unsuspend is enabled.
     *
     * @param userId       The user ID.
     * @param currentStatus The current status from the users table.
     * @return The effective status (may be "ACTIVE" if auto-unsuspended).
     */
    public String resolve(String userId, String currentStatus) {
        if (!"SUSPENDED".equals(currentStatus)) {
            return currentStatus;
        }

        ModerationPolicy policy = moderationPolicy();
        if (!policy.autoUnsuspendEnabled()) {
            return currentStatus;
        }

        Optional<Instant> suspensionEnd = userDao.findSuspensionEndAt(userId);
        if (suspensionEnd.isEmpty()) {
            return currentStatus;
        }
        if (suspensionEnd.get().isAfter(Instant.now())) {
            return currentStatus;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "ACTIVE", null);
        suspensionEventDao.markUnsuspended(userId, Instant.now());
        return "ACTIVE";
    }

    private ModerationPolicy moderationPolicy() {
        return moderationPolicyDao.findActive().orElse(ModerationPolicy.DEFAULT);
    }
}
