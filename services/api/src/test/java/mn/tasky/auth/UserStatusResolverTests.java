package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.UserStatusResolver;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.ModerationPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for UserStatusResolver.
 * Covers auto-unsuspend logic: policy checks, suspension window expiry,
 * and edge cases where unsuspend is disabled or suspension is still active.
 */
@ExtendWith(MockitoExtension.class)
class UserStatusResolverTests {

    private static final String USER_ID = UUID.randomUUID().toString();

    @Mock private ModerationPolicyDao moderationPolicyDao;
    @Mock private UserDao userDao;
    @Mock private SuspensionEventDao suspensionEventDao;

    private UserStatusResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new UserStatusResolver(moderationPolicyDao, userDao, suspensionEventDao);
    }

    // ── Non-SUSPENDED statuses pass through ───────────────────────────────

    @Nested
    @DisplayName("passthrough for non-SUSPENDED statuses")
    class Passthrough {

        @Test
        @DisplayName("ACTIVE status passes through unchanged")
        void activePassesThrough() {
            assertThat(resolver.resolve(USER_ID, "ACTIVE")).isEqualTo("ACTIVE");
        }

        @Test
        @DisplayName("BANNED status passes through unchanged")
        void bannedPassesThrough() {
            assertThat(resolver.resolve(USER_ID, "BANNED")).isEqualTo("BANNED");
        }

        @Test
        @DisplayName("VERIFIED status passes through unchanged")
        void verifiedPassesThrough() {
            assertThat(resolver.resolve(USER_ID, "VERIFIED")).isEqualTo("VERIFIED");
        }

        @Test
        @DisplayName("DELETED status passes through unchanged")
        void deletedPassesThrough() {
            assertThat(resolver.resolve(USER_ID, "DELETED")).isEqualTo("DELETED");
        }
    }

    // ── SUSPENDED with auto-unsuspend disabled ────────────────────────────

    @Nested
    @DisplayName("SUSPENDED with auto-unsuspend disabled")
    class AutoUnsuspendDisabled {

        @Test
        @DisplayName("Returns SUSPENDED when autoUnsuspendEnabled is false")
        void remainsSuspended() {
            ModerationPolicy noAutoUnsuspend = new ModerationPolicy(30, 3, 7, 14, 180, false, Instant.EPOCH);
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(noAutoUnsuspend));

            assertThat(resolver.resolve(USER_ID, "SUSPENDED")).isEqualTo("SUSPENDED");
            verify(userDao, never()).findSuspensionEndAt(anyString());
        }
    }

    // ── SUSPENDED with auto-unsuspend enabled ─────────────────────────────

    @Nested
    @DisplayName("SUSPENDED with auto-unsuspend enabled")
    class AutoUnsuspendEnabled {

        @BeforeEach
        void enableAutoUnsuspend() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.of(ModerationPolicy.DEFAULT));
        }

        @Test
        @DisplayName("Returns SUSPENDED when suspension end is missing from DB")
        void missingEndDateRemainsSuspended() {
            when(userDao.findSuspensionEndAt(USER_ID)).thenReturn(Optional.empty());

            assertThat(resolver.resolve(USER_ID, "SUSPENDED")).isEqualTo("SUSPENDED");
        }

        @Test
        @DisplayName("Returns SUSPENDED when suspension end is in the future")
        void futureEndRemainsSuspended() {
            Instant futureEnd = Instant.now().plus(5, ChronoUnit.DAYS);
            when(userDao.findSuspensionEndAt(USER_ID)).thenReturn(Optional.of(futureEnd));

            assertThat(resolver.resolve(USER_ID, "SUSPENDED")).isEqualTo("SUSPENDED");
            verify(userDao, never()).updateStatusAndSuspensionEnd(anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Auto-unsuspends and returns ACTIVE when suspension end is in the past")
        void pastEndAutoUnsuspends() {
            Instant pastEnd = Instant.now().minus(1, ChronoUnit.HOURS);
            when(userDao.findSuspensionEndAt(USER_ID)).thenReturn(Optional.of(pastEnd));

            String result = resolver.resolve(USER_ID, "SUSPENDED");

            assertThat(result).isEqualTo("ACTIVE");
            verify(userDao).updateStatusAndSuspensionEnd(USER_ID, "ACTIVE", null);
            verify(suspensionEventDao).markUnsuspended(eq(USER_ID), any(Instant.class));
        }

        @Test
        @DisplayName("Uses default policy when no policy row exists in DB")
        void usesDefaultPolicy() {
            when(moderationPolicyDao.findActive()).thenReturn(Optional.empty());
            Instant pastEnd = Instant.now().minus(1, ChronoUnit.HOURS);
            when(userDao.findSuspensionEndAt(USER_ID)).thenReturn(Optional.of(pastEnd));

            // Default policy has autoUnsuspendEnabled=true
            String result = resolver.resolve(USER_ID, "SUSPENDED");
            assertThat(result).isEqualTo("ACTIVE");
        }
    }
}
