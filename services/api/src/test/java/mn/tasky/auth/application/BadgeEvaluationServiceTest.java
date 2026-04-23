package mn.tasky.auth.application;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dto.TaskerBadge;
import mn.tasky.auth.dto.UserProfileState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("BadgeEvaluationService")
class BadgeEvaluationServiceTest {

    @Mock
    private BadgeDao badgeDao;

    @Mock
    private ProfileDao profileDao;

    private BadgeEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new BadgeEvaluationService(badgeDao, profileDao);
    }

    @Nested
    @DisplayName("evaluate(taskerId)")
    class Evaluate {

        @Test
        @DisplayName("assigns PRO badge when completed >= 15 and rating >= 4.5")
        void assignsProBadge() {
            when(profileDao.findByUserId("t1"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.7, 20, null)));

            service.evaluate("t1");

            verify(badgeDao).assign("t1", "PRO");
            verify(badgeDao, never()).revoke(anyString(), anyString());
        }

        @Test
        @DisplayName("assigns PRO badge at exact threshold (completed=15, rating=4.5)")
        void assignsProBadgeAtExactThreshold() {
            when(profileDao.findByUserId("t1"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.5, 15, null)));

            service.evaluate("t1");

            verify(badgeDao).assign("t1", "PRO");
        }

        @Test
        @DisplayName("revokes PRO badge when rating drops below 4.0")
        void revokesProBadgeWhenRatingBelow4() {
            when(profileDao.findByUserId("t2"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 3.8, 20, null)));

            service.evaluate("t2");

            verify(badgeDao).revoke("t2", "PRO");
            verify(badgeDao, never()).assign(anyString(), anyString());
        }

        @Test
        @DisplayName("no action in hysteresis band (rating 4.0-4.5, insufficient tasks)")
        void noActionInHysteresisBand() {
            when(profileDao.findByUserId("t3"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.2, 10, null)));

            service.evaluate("t3");

            verifyNoInteractions(badgeDao);
        }

        @Test
        @DisplayName("no action when rating >= 4.0 but completed < 15 (hysteresis keeps badge)")
        void noActionWhenLowTasksButRatingAboveRevoke() {
            when(profileDao.findByUserId("t3"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.3, 5, null)));

            service.evaluate("t3");

            verifyNoInteractions(badgeDao);
        }

        @Test
        @DisplayName("uses default state when profile not found")
        void usesDefaultStateWhenProfileNotFound() {
            when(profileDao.findByUserId("t4")).thenReturn(Optional.empty());

            service.evaluate("t4");

            verify(badgeDao).revoke("t4", "PRO");
        }
    }

    @Nested
    @DisplayName("sweepAllBadges()")
    class SweepAllBadges {

        @Test
        @DisplayName("revokes badge when tasker no longer qualifies")
        void revokesBadgeWhenNoLongerQualifies() {
            TaskerBadge badge = new TaskerBadge("t1", "PRO", null, null);
            when(badgeDao.findAllActive()).thenReturn(java.util.List.of(badge));
            when(profileDao.findByUserId("t1"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 3.5, 10, null)));

            service.sweepAllBadges();

            verify(badgeDao).revoke("t1", "PRO");
        }

        @Test
        @DisplayName("keeps badge when tasker still qualifies")
        void keepsBadgeWhenStillQualifies() {
            TaskerBadge badge = new TaskerBadge("t1", "PRO", null, null);
            when(badgeDao.findAllActive()).thenReturn(java.util.List.of(badge));
            when(profileDao.findByUserId("t1"))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.2, 20, null)));

            service.sweepAllBadges();

            verify(badgeDao, never()).revoke(anyString(), anyString());
        }

        @Test
        @DisplayName("skips non-PRO badges")
        void skipsNonProBadges() {
            TaskerBadge otherBadge = new TaskerBadge("t1", "ELITE", null, null);
            when(badgeDao.findAllActive()).thenReturn(java.util.List.of(otherBadge));

            service.sweepAllBadges();

            verify(profileDao, never()).findByUserId(anyString());
            verify(badgeDao, never()).revoke(anyString(), anyString());
        }

        @Test
        @DisplayName("handles empty active badges list")
        void handlesEmptyActiveBadges() {
            when(badgeDao.findAllActive()).thenReturn(java.util.List.of());

            service.sweepAllBadges();

            verify(profileDao, never()).findByUserId(anyString());
        }

        @Test
        @DisplayName("revokes when profile not found (default state)")
        void revokesWhenProfileNotFound() {
            TaskerBadge badge = new TaskerBadge("t1", "PRO", null, null);
            when(badgeDao.findAllActive()).thenReturn(java.util.List.of(badge));
            when(profileDao.findByUserId("t1")).thenReturn(Optional.empty());

            service.sweepAllBadges();

            verify(badgeDao).revoke("t1", "PRO");
        }
    }
}
