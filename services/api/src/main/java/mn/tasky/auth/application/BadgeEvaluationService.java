package mn.tasky.auth.application;

import java.util.List;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dto.TaskerBadge;
import mn.tasky.auth.dto.UserProfileState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Evaluates and manages tasker badges.
 * PRO badge criteria: completedTasks >= 15 AND ratingAvg >= 4.5.
 * Revocation uses hysteresis: only revokes when ratingAvg drops below 4.0
 * (not between 4.0 and 4.5) to prevent badge flapping.
 */
@Service
public class BadgeEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(BadgeEvaluationService.class);
    private static final String BADGE_PRO = "PRO";
    private static final int PRO_MIN_COMPLETED_TASKS = 15;
    private static final double PRO_ASSIGN_RATING_THRESHOLD = 4.5;
    private static final double PRO_REVOKE_RATING_THRESHOLD = 4.0;

    private final BadgeDao badgeDao;
    private final ProfileDao profileDao;

    public BadgeEvaluationService(BadgeDao badgeDao, ProfileDao profileDao) {
        this.badgeDao = badgeDao;
        this.profileDao = profileDao;
    }

    /**
     * Evaluates whether the given tasker qualifies for the PRO badge.
     * Assigns the badge if completedTasks >= 15 and ratingAvg >= 4.5.
     * Revokes only if ratingAvg drops below 4.0 (hysteresis band between 4.0-4.5).
     *
     * @param taskerId the tasker's user ID
     */
    public void evaluate(String taskerId) {
        UserProfileState profile = profileDao.findByUserId(taskerId).orElse(UserProfileState.defaultState());

        if (profile.completedTasks() >= PRO_MIN_COMPLETED_TASKS && profile.ratingAvg() >= PRO_ASSIGN_RATING_THRESHOLD) {
            badgeDao.assign(taskerId, BADGE_PRO);
            log.info(
                    "Assigned PRO badge to tasker {} (completed={}, rating={})",
                    taskerId,
                    profile.completedTasks(),
                    profile.ratingAvg());
        } else if (profile.ratingAvg() < PRO_REVOKE_RATING_THRESHOLD) {
            badgeDao.revoke(taskerId, BADGE_PRO);
            log.info(
                    "Revoked PRO badge from tasker {} (rating={} < {})",
                    taskerId,
                    profile.ratingAvg(),
                    PRO_REVOKE_RATING_THRESHOLD);
        }
        // Between 4.0 and 4.5: no action (hysteresis — keep current state)
    }

    /**
     * Sweeps all active badges and revokes those whose holders no longer qualify.
     * Intended to be called by a daily scheduled job.
     */
    public void sweepAllBadges() {
        List<TaskerBadge> activeBadges = badgeDao.findAllActive();
        log.info("Badge sweep: checking {} active badges", activeBadges.size());

        for (TaskerBadge badge : activeBadges) {
            if (!BADGE_PRO.equals(badge.badgeType())) {
                continue;
            }
            UserProfileState profile =
                    profileDao.findByUserId(badge.taskerId()).orElse(UserProfileState.defaultState());

            boolean qualifies = profile.completedTasks() >= PRO_MIN_COMPLETED_TASKS
                    && profile.ratingAvg() >= PRO_REVOKE_RATING_THRESHOLD;

            if (!qualifies) {
                badgeDao.revoke(badge.taskerId(), BADGE_PRO);
                log.info(
                        "Sweep revoked PRO badge from tasker {} (completed={}, rating={})",
                        badge.taskerId(),
                        profile.completedTasks(),
                        profile.ratingAvg());
            }
        }
    }
}
