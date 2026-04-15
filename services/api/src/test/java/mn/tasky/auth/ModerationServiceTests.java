package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.auth.application.UserStatusResolver;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.common.audit.AuditEventDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for ModerationService.
 * Covers strike-to-suspension escalation, ban/unban with audit, policy validation,
 * and account deletion.
 */
@ExtendWith(MockitoExtension.class)
class ModerationServiceTests {

    private static final String USER_ID = UUID.randomUUID().toString();
    private static final String ADMIN_ID = "admin-001";

    @Mock
    private StrikeDao strikeDao;

    @Mock
    private SuspensionEventDao suspensionEventDao;

    @Mock
    private ModerationPolicyDao moderationPolicyDao;

    @Mock
    private UserDao userDao;

    @Mock
    private AuditEventDao auditEventDao;

    @Mock
    private UserStatusResolver userStatusResolver;

    private ModerationService service;

    private AuthUser activeUser() {
        return new AuthUser(USER_ID, null, null, "CUSTOMER", "ACTIVE", "FACEBOOK", Instant.now(), Instant.now());
    }

    @BeforeEach
    void setUp() {
        service = new ModerationService(
                strikeDao, suspensionEventDao, moderationPolicyDao, userDao, auditEventDao, userStatusResolver);
    }

    // ── addStrike ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("addStrike")
    class AddStrike {

        @Test
        @DisplayName("Strike below threshold does not suspend")
        void belowThresholdNoSuspension() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(2L); // threshold=3

            service.addStrike(USER_ID);

            verify(strikeDao).insert(anyString(), eq(USER_ID), any(), any(), any(Instant.class));
            verify(userDao, never()).updateStatusAndSuspensionEnd(anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Strike at threshold triggers first-time suspension")
        void atThresholdTriggersSuspension() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(3L); // meets threshold
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(activeUser()));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(suspensionEventDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(0L); // no prior

            service.addStrike(USER_ID);

            verify(userDao).updateStatusAndSuspensionEnd(eq(USER_ID), eq("SUSPENDED"), any(Instant.class));
            verify(suspensionEventDao).insert(anyString(), eq(USER_ID), eq(3), eq(7), any(Instant.class), any());
        }

        @Test
        @DisplayName("Repeat offender gets longer suspension")
        void repeatOffenderLongerSuspension() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(3L);
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(activeUser()));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(suspensionEventDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(1L); // has prior

            service.addStrike(USER_ID);

            verify(suspensionEventDao).insert(anyString(), eq(USER_ID), eq(3), eq(14), any(Instant.class), any());
        }

        @Test
        @DisplayName("Already BANNED user is not suspended again")
        void bannedUserNotSuspended() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(5L);
            AuthUser bannedUser =
                    new AuthUser(USER_ID, null, null, "CUSTOMER", "BANNED", "FACEBOOK", Instant.now(), Instant.now());
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(bannedUser));
            when(userStatusResolver.resolve(USER_ID, "BANNED")).thenReturn("BANNED");

            service.addStrike(USER_ID);

            verify(userDao, never()).updateStatusAndSuspensionEnd(anyString(), eq("SUSPENDED"), any());
        }

        @Test
        @DisplayName("Already SUSPENDED user is not double-suspended")
        void suspendedUserNotDoubled() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(5L);
            AuthUser suspendedUser = new AuthUser(
                    USER_ID, null, null, "CUSTOMER", "SUSPENDED", "FACEBOOK", Instant.now(), Instant.now());
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(suspendedUser));
            when(userStatusResolver.resolve(USER_ID, "SUSPENDED")).thenReturn("SUSPENDED");

            service.addStrike(USER_ID);

            verify(userDao, never()).updateStatusAndSuspensionEnd(anyString(), eq("SUSPENDED"), any());
        }

        @Test
        @DisplayName("Three-arg overload delegates to single-arg logic")
        void threeArgDelegatesToSingleArg() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
            when(strikeDao.countSince(eq(USER_ID), any(Instant.class))).thenReturn(1L);

            service.addStrike(USER_ID, "NO_SHOW", "booking-123");

            verify(strikeDao).insert(anyString(), eq(USER_ID), any(), any(), any(Instant.class));
        }
    }

    // ── banUser / unbanUser ────────────────────────────────────────────────

    @Nested
    @DisplayName("banUser/unbanUser")
    class BanUnban {

        @Test
        @DisplayName("banUser sets BANNED status and writes audit event")
        void banSetsStatusAndAudits() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(activeUser()));

            boolean result = service.banUser(ADMIN_ID, USER_ID, "policy violation");

            assertThat(result).isTrue();
            verify(userDao).updateStatusAndSuspensionEnd(USER_ID, "BANNED", null);
            verify(auditEventDao).insert(eq(ADMIN_ID), eq("BAN_USER"), eq("USER"), eq(USER_ID), anyString());
        }

        @Test
        @DisplayName("banUser returns false when user does not exist")
        void banMissingUserReturnsFalse() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());

            assertThat(service.banUser(ADMIN_ID, USER_ID, "reason")).isFalse();
            verify(auditEventDao, never()).insert(anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("unbanUser restores ACTIVE status and writes audit event")
        void unbanRestoresActiveAndAudits() {
            AuthUser bannedUser =
                    new AuthUser(USER_ID, null, null, "CUSTOMER", "BANNED", "FACEBOOK", Instant.now(), Instant.now());
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(bannedUser));

            boolean result = service.unbanUser(ADMIN_ID, USER_ID, "appeal granted");

            assertThat(result).isTrue();
            verify(userDao).updateStatusAndSuspensionEnd(USER_ID, "ACTIVE", null);
            verify(auditEventDao).insert(eq(ADMIN_ID), eq("UNBAN_USER"), eq("USER"), eq(USER_ID), anyString());
        }
    }

    // ── updateModerationPolicy ─────────────────────────────────────────────

    @Nested
    @DisplayName("updateModerationPolicy")
    class UpdateModerationPolicy {

        @Test
        @DisplayName("Valid policy values are persisted and returned")
        void validPolicyIsPersisted() {
            ModerationPolicy expected = new ModerationPolicy(60, 5, 14, 30, 365, true, Instant.now());
            when(moderationPolicyDao.update(60, 5, 14, 30, 365, true, any(Instant.class)))
                    .thenReturn(1);
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(expected));

            ModerationPolicy result = service.updateModerationPolicy(60, 5, 14, 30, 365, true);

            assertThat(result.strikeWindowDays()).isEqualTo(60);
            assertThat(result.strikeThreshold()).isEqualTo(5);
        }

        @Test
        @DisplayName("strikeWindowDays below 1 throws IAE")
        void strikeWindowBelowMinThrows() {
            assertThatThrownBy(() -> service.updateModerationPolicy(0, 3, 7, 14, 180, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("strikeWindowDays");
        }

        @Test
        @DisplayName("strikeThreshold above 10 throws IAE")
        void strikeThresholdAboveMaxThrows() {
            assertThatThrownBy(() -> service.updateModerationPolicy(30, 11, 7, 14, 180, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("strikeThreshold");
        }

        @Test
        @DisplayName("repeatSuspensionDays less than firstSuspensionDays throws IAE")
        void repeatLessThanFirstThrows() {
            assertThatThrownBy(() -> service.updateModerationPolicy(30, 3, 14, 7, 180, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("repeatSuspensionDays");
        }

        @Test
        @DisplayName("repeatOffenseWindowDays less than strikeWindowDays throws IAE")
        void repeatWindowLessThanStrikeWindowThrows() {
            assertThatThrownBy(() -> service.updateModerationPolicy(30, 3, 7, 14, 20, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("repeatOffenseWindowDays");
        }

        @Test
        @DisplayName("Missing moderation policy row throws ISE")
        void missingPolicyRowThrowsISE() {
            when(moderationPolicyDao.update(
                            anyInt(), anyInt(), anyInt(), anyInt(), anyInt(), any(Boolean.class), any(Instant.class)))
                    .thenReturn(0);

            assertThatThrownBy(() -> service.updateModerationPolicy(30, 3, 7, 14, 180, true))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("missing");
        }
    }

    // ── requestAccountDeletion ─────────────────────────────────────────────

    @Nested
    @DisplayName("requestAccountDeletion")
    class RequestAccountDeletion {

        @Test
        @DisplayName("Marks user as DELETED and writes audit event")
        void marksDeletedAndAudits() {
            service.requestAccountDeletion(USER_ID);

            verify(userDao).updateStatus(USER_ID, "DELETED");
            verify(auditEventDao)
                    .insert(eq(USER_ID), eq("USER_SELF_DELETE_REQUEST"), eq("USER"), eq(USER_ID), anyString());
        }
    }
}
