package mn.tasky.auth.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

/**
 * Moderation service.
 * Handles strike tracking, suspension enforcement, ban/unban actions,
 * and moderation policy configuration.
 */
@Service
public class ModerationService {

    private final StrikeDao strikeDao;
    private final SuspensionEventDao suspensionEventDao;
    private final ModerationPolicyDao moderationPolicyDao;
    private final UserDao userDao;
    private final AuditEventDao auditEventDao;
    private final UserStatusResolver userStatusResolver;

    public ModerationService(
            StrikeDao strikeDao,
            SuspensionEventDao suspensionEventDao,
            ModerationPolicyDao moderationPolicyDao,
            UserDao userDao,
            AuditEventDao auditEventDao,
            UserStatusResolver userStatusResolver) {
        this.strikeDao = strikeDao;
        this.suspensionEventDao = suspensionEventDao;
        this.moderationPolicyDao = moderationPolicyDao;
        this.userDao = userDao;
        this.auditEventDao = auditEventDao;
        this.userStatusResolver = userStatusResolver;
    }

    /**
     * Adds a moderation strike and applies suspension policy when thresholds are reached.
     *
     * @param userId Target user identifier.
     */
    public void addStrike(String userId) {
        Instant now = Instant.now();
        strikeDao.insert(UUID.randomUUID().toString(), userId, null, null, now);

        ModerationPolicy policy = moderationPolicy();
        Instant windowStart = now.minus(policy.strikeWindowDays(), ChronoUnit.DAYS);
        long recentStrikes = strikeDao.countSince(userId, windowStart);

        if (recentStrikes < policy.strikeThreshold()) {
            return;
        }

        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }
        AuthUser user = userOpt.get();
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            return;
        }

        Instant repeatLookback = now.minus(policy.repeatOffenseWindowDays(), ChronoUnit.DAYS);
        long priorSuspensions = suspensionEventDao.countSince(userId, repeatLookback);
        int suspensionDays = priorSuspensions > 0 ? policy.repeatSuspensionDays() : policy.firstSuspensionDays();
        Instant suspensionEndAt = now.plus(suspensionDays, ChronoUnit.DAYS);

        userDao.updateStatusAndSuspensionEnd(userId, "SUSPENDED", suspensionEndAt);
        suspensionEventDao.insert(
                UUID.randomUUID().toString(), userId, Math.toIntExact(recentStrikes), suspensionDays, now, null);
    }

    /**
     * Adds a moderation strike with optional reason and booking context.
     * Delegates to the single-arg overload for the suspension logic.
     *
     * @param userId    Target user identifier.
     * @param reason    Human-readable reason (for audit; not persisted separately).
     * @param bookingId Booking context (for audit; not persisted separately).
     */
    public void addStrike(String userId, String reason, String bookingId) {
        addStrike(userId);
    }

    /**
     * Bans a user and writes an admin audit log entry.
     *
     * @param adminId Admin identifier.
     * @param userId  Target user identifier.
     * @param reason  Ban reason.
     * @return {@code true} when user exists and was updated.
     */
    public boolean banUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "BANNED", null);
        auditEventDao.insert(adminId, "BAN_USER", "USER", userId, "{\"reason\":\"" + reason + "\"}");
        return true;
    }

    /**
     * Removes ban/suspension status from a user and writes an admin audit log entry.
     *
     * @param adminId Admin identifier.
     * @param userId  Target user identifier.
     * @param reason  Unban reason.
     * @return {@code true} when user exists and was updated.
     */
    public boolean unbanUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "ACTIVE", null);
        auditEventDao.insert(adminId, "UNBAN_USER", "USER", userId, "{\"reason\":\"" + reason + "\"}");
        return true;
    }

    /**
     * Returns the active moderation policy, or default policy when no row is present.
     *
     * @return Current moderation policy.
     */
    public ModerationPolicy getModerationPolicy() {
        return moderationPolicy();
    }

    /**
     * Updates moderation policy after validating value ranges.
     *
     * @param strikeWindowDays        Strike rolling window in days.
     * @param strikeThreshold         Strike count that triggers suspension.
     * @param firstSuspensionDays     First suspension duration in days.
     * @param repeatSuspensionDays    Repeat suspension duration in days.
     * @param repeatOffenseWindowDays Lookback window for repeat offense escalation.
     * @param autoUnsuspendEnabled    Whether automatic unsuspend is enabled.
     * @return Updated moderation policy.
     * @throws IllegalArgumentException if provided values fail validation constraints.
     * @throws IllegalStateException    if moderation policy row is missing at update time.
     */
    public ModerationPolicy updateModerationPolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays,
            boolean autoUnsuspendEnabled) {
        validatePolicy(
                strikeWindowDays, strikeThreshold, firstSuspensionDays, repeatSuspensionDays, repeatOffenseWindowDays);
        Instant now = Instant.now();
        int updated = moderationPolicyDao.update(
                strikeWindowDays,
                strikeThreshold,
                firstSuspensionDays,
                repeatSuspensionDays,
                repeatOffenseWindowDays,
                autoUnsuspendEnabled,
                now);
        if (updated == 0) {
            throw new IllegalStateException("Moderation policy row is missing.");
        }
        return moderationPolicyDao
                .findActive()
                .orElse(new ModerationPolicy(
                        strikeWindowDays,
                        strikeThreshold,
                        firstSuspensionDays,
                        repeatSuspensionDays,
                        repeatOffenseWindowDays,
                        autoUnsuspendEnabled,
                        now));
    }

    /**
     * Request self-service account deletion.
     * Marks user as DELETED and records audit event.
     */
    public void requestAccountDeletion(String userId) {
        userDao.updateStatus(userId, "DELETED");
        auditEventDao.insert(
                userId, "USER_SELF_DELETE_REQUEST", "USER", userId, "{\"reason\":\"USER_SELF_DELETE_REQUEST\"}");
    }

    private ModerationPolicy moderationPolicy() {
        return moderationPolicyDao.findActive().orElse(ModerationPolicy.DEFAULT);
    }

    private void validatePolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays) {
        if (strikeWindowDays < 1 || strikeWindowDays > 365) {
            throw new IllegalArgumentException("strikeWindowDays must be between 1 and 365");
        }
        if (strikeThreshold < 1 || strikeThreshold > 10) {
            throw new IllegalArgumentException("strikeThreshold must be between 1 and 10");
        }
        if (firstSuspensionDays < 1 || firstSuspensionDays > 365) {
            throw new IllegalArgumentException("firstSuspensionDays must be between 1 and 365");
        }
        if (repeatSuspensionDays < firstSuspensionDays || repeatSuspensionDays > 365) {
            throw new IllegalArgumentException("repeatSuspensionDays must be between " + "firstSuspensionDays and 365");
        }
        if (repeatOffenseWindowDays < strikeWindowDays || repeatOffenseWindowDays > 730) {
            throw new IllegalArgumentException("repeatOffenseWindowDays must be between " + "strikeWindowDays and 730");
        }
    }
}
