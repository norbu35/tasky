package mn.tasky.auth;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dto.TaskerBadge;
import mn.tasky.auth.dto.UserProfileState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BadgeEvaluationTests {

    private BadgeDao badgeDao;
    private ProfileDao profileDao;
    private BadgeEvaluationService service;

    private static final String TASKER_ID = "00000000-0000-0000-0000-000000000001";

    @BeforeEach
    void setUp() {
        badgeDao = mock(BadgeDao.class);
        profileDao = mock(ProfileDao.class);
        service = new BadgeEvaluationService(badgeDao, profileDao);
    }

    @Test
    @DisplayName("Assign PRO badge when criteria met: completedTasks >= 15 AND ratingAvg >= 4.5")
    void assignProBadgeWhenCriteriaMet() {
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.7, 20)));

        service.evaluate(TASKER_ID);

        verify(badgeDao).assign(TASKER_ID, "PRO");
        verify(badgeDao, never()).revoke(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("No revoke when ratingAvg between 4.0 and 4.5 (hysteresis band)")
    void noRevokeInHysteresisRange() {
        // Rating 4.2 is between 4.0 (revoke) and 4.5 (assign) — should neither assign nor revoke
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.2, 20)));

        service.evaluate(TASKER_ID);

        verify(badgeDao, never()).assign(TASKER_ID, "PRO");
        verify(badgeDao, never()).revoke(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("Revoke PRO badge when ratingAvg drops below 4.0")
    void revokeProBadgeWhenBelowThreshold() {
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 3.8, 20)));

        service.evaluate(TASKER_ID);

        verify(badgeDao).revoke(TASKER_ID, "PRO");
        verify(badgeDao, never()).assign(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("No assign when completed tasks below 15 even if rating is high")
    void noAssignWhenInsufficientCompletedTasks() {
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.8, 10)));

        service.evaluate(TASKER_ID);

        verify(badgeDao, never()).assign(TASKER_ID, "PRO");
        verify(badgeDao, never()).revoke(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("Sweep revokes badge from tasker who no longer qualifies")
    void sweepRevokesUnqualifiedBadge() {
        TaskerBadge activeBadge = new TaskerBadge(TASKER_ID, "PRO", Instant.now(), null);
        when(badgeDao.findAllActive()).thenReturn(List.of(activeBadge));
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 3.5, 5)));

        service.sweepAllBadges();

        verify(badgeDao).revoke(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("Sweep keeps badge for tasker who still qualifies above revocation threshold")
    void sweepKeepsBadgeForQualifiedTasker() {
        TaskerBadge activeBadge = new TaskerBadge(TASKER_ID, "PRO", Instant.now(), null);
        when(badgeDao.findAllActive()).thenReturn(List.of(activeBadge));
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.3, 20)));

        service.sweepAllBadges();

        verify(badgeDao, never()).revoke(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("Assign at exact boundary: completedTasks == 15 AND ratingAvg == 4.5")
    void assignAtExactBoundary() {
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.5, 15)));

        service.evaluate(TASKER_ID);

        verify(badgeDao).assign(TASKER_ID, "PRO");
    }

    @Test
    @DisplayName("Revoke at exact 4.0 boundary — no revoke (only below 4.0)")
    void noRevokeAtExactFourPointZero() {
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test Tasker", null, 4.0, 20)));

        service.evaluate(TASKER_ID);

        // 4.0 is not < 4.0, so no revoke; also not >= 4.5 so no assign
        verify(badgeDao, never()).assign(TASKER_ID, "PRO");
        verify(badgeDao, never()).revoke(TASKER_ID, "PRO");
    }
}
