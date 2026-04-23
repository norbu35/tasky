package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.application.UserStatusResolver;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.TaskerBadge;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for UserProfileService.
 * No Spring context. All DAOs and external services are mocked.
 */
@ExtendWith(MockitoExtension.class)
class UserProfileServiceTests {

    private static final String TEST_JWT_SECRET = "test-jwt-secret-key-minimum-32-chars-long-xxx";
    private static final String USER_ID = UUID.randomUUID().toString();

    @Mock
    private UserDao userDao;

    @Mock
    private ProfileDao profileDao;

    @Mock
    private BadgeDao badgeDao;

    @Mock
    private S3PresignedUrlService storageService;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    @Mock
    private UserStatusResolver userStatusResolver;

    @Mock
    private CryptoService cryptoService;

    @Mock
    private RefreshSessionDao refreshSessionDao;

    private UserProfileService service;

    private AuthUser activeCustomer() {
        return new AuthUser(
                USER_ID, "encrypted-phone", "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", Instant.now(), Instant.now());
    }

    @BeforeEach
    void setUp() {
        JwtTokenService jwtTokenService = new JwtTokenService(TEST_JWT_SECRET, 900L, 1209600L);
        service = new UserProfileService(
                userDao,
                profileDao,
                badgeDao,
                storageService,
                storageKeyPolicy,
                userStatusResolver,
                cryptoService,
                jwtTokenService,
                refreshSessionDao,
                false,
                false,
                3);
    }

    // ── getProfile ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getProfile")
    class GetProfile {

        @Test
        @DisplayName("Returns empty when user does not exist")
        void returnsEmptyForMissingUser() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());
            assertThat(service.getProfile(USER_ID)).isEmpty();
        }

        @Test
        @DisplayName("Returns profile with resolved effective status")
        void returnsProfileWithResolvedStatus() {
            AuthUser user = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("Test User", null, "Reliable helper", 4.5, 10, null)));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(USER_ID)).thenReturn(List.of());
            when(cryptoService.decrypt("encrypted-phone")).thenReturn("+97699001122");

            Optional<UserProfile> result = service.getProfile(USER_ID);

            assertThat(result).isPresent();
            UserProfile profile = result.get();
            assertThat(profile.id()).isEqualTo(USER_ID);
            assertThat(profile.role()).isEqualTo("CUSTOMER");
            assertThat(profile.status()).isEqualTo("ACTIVE");
            assertThat(profile.fullName()).isEqualTo("Test User");
            assertThat(profile.bio()).isEqualTo("Reliable helper");
            assertThat(profile.ratingAvg()).isEqualTo(4.5);
            assertThat(profile.completedTasks()).isEqualTo(10);
            assertThat(profile.phone()).isEqualTo("+97699001122");
        }

        @Test
        @DisplayName("PRO badge is resolved from active badges")
        void resolvesProBadge() {
            AuthUser user = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileDao.findByUserId(USER_ID)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(USER_ID))
                    .thenReturn(List.of(new TaskerBadge(USER_ID, "PRO", Instant.now(), null)));

            Optional<UserProfile> result = service.getProfile(USER_ID);

            assertThat(result).isPresent();
            assertThat(result.get().isPro()).isTrue();
        }

        @Test
        @DisplayName("Default profile state is used when no profile row exists")
        void usesDefaultProfileState() {
            AuthUser user = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileDao.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(USER_ID)).thenReturn(List.of());

            Optional<UserProfile> result = service.getProfile(USER_ID);

            assertThat(result).isPresent();
            assertThat(result.get().fullName()).isEqualTo("Tasky User");
            assertThat(result.get().ratingAvg()).isNull();
            assertThat(result.get().completedTasks()).isZero();
        }
    }

    // ── updateProfile ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateProfile")
    class UpdateProfile {

        @Test
        @DisplayName("Returns empty when user does not exist")
        void returnsEmptyForMissingUser() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());
            assertThat(service.updateProfile(USER_ID, new ProfileUpdate("New Name", null, null)))
                    .isEmpty();
        }

        @Test
        @DisplayName("Updates name and bio and preserves existing avatar when avatarUrl is null")
        void updatesNameAndBioPreservesAvatar() {
            AuthUser user = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(
                            Optional.of(new UserProfileState("Old Name", "old-avatar.jpg", "Old bio", 0.0, 0, null)));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(USER_ID)).thenReturn(List.of());

            service.updateProfile(USER_ID, new ProfileUpdate("New Name", null, "New bio"));

            verify(profileDao).updateProfileDetails(USER_ID, "New Name", "old-avatar.jpg", "New bio");
        }
    }

    // ── updateUserStats ────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUserStats")
    class UpdateUserStats {

        @Test
        @DisplayName("First rating sets the average directly")
        void firstRatingSetsAverage() {
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 0.0, 0, null)));

            service.updateUserStats(USER_ID, 4.0, false);

            verify(profileDao).updateStats(USER_ID, 4.0, 0);
        }

        @Test
        @DisplayName("Subsequent rating computes weighted average")
        void subsequentRatingComputesAverage() {
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.0, 2, null)));

            service.updateUserStats(USER_ID, 5.0, false);

            // (4.0 * 2 + 5.0) / 3 = 4.333...
            verify(profileDao)
                    .updateStats(
                            eq(USER_ID),
                            org.mockito.ArgumentMatchers.doubleThat(d -> Math.abs(d - 4.333) < 0.01),
                            eq(2));
        }

        @Test
        @DisplayName("Increment completed tasks when requested")
        void incrementsCompletedTasks() {
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.0, 5, null)));

            service.updateUserStats(USER_ID, 0, true);

            verify(profileDao).updateStats(USER_ID, 4.0, 6);
        }

        @Test
        @DisplayName("Zero rating does not change average")
        void zeroRatingPreservesAverage() {
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.5, 3, null)));

            service.updateUserStats(USER_ID, 0, false);

            verify(profileDao).updateStats(USER_ID, 4.5, 3);
        }

        @Test
        @DisplayName("Perfect 5.0 stays 5.0 when existing average is also 5.0")
        void perfectRatingStaysPerfect() {
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("User", null, null, 5.0, 3, null)));

            service.updateUserStats(USER_ID, 5.0, false);

            verify(profileDao).updateStats(USER_ID, 5.0, 3);
        }
    }

    // ── activateTaskerRole ─────────────────────────────────────────────────

    @Nested
    @DisplayName("activateTaskerRole")
    class ActivateTaskerRole {

        @Test
        @DisplayName("Upgrades CUSTOMER to TASKER and issues new session")
        void upgradesCustomerToTasker() {
            AuthUser customer = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(userStatusResolver.resolve(eq(USER_ID), anyString())).thenReturn("ACTIVE");

            Optional<RoleActivationResult> result = service.activateTaskerRole(USER_ID);

            assertThat(result).isPresent();
            verify(userDao).updateRole(USER_ID, "TASKER");
            assertThat(result.get().accessToken()).isNotBlank();
            assertThat(result.get().refreshToken()).isNotBlank();
            assertThat(result.get().user()).containsEntry("role", "TASKER");
        }

        @Test
        @DisplayName("Returns empty when user is already TASKER")
        void alreadyTaskerReturnsEmpty() {
            AuthUser tasker =
                    new AuthUser(USER_ID, null, "fb-123", "TASKER", "ACTIVE", "FACEBOOK", Instant.now(), Instant.now());
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(tasker));

            assertThat(service.activateTaskerRole(USER_ID)).isEmpty();
            verify(userDao, never()).updateRole(anyString(), anyString());
        }

        @Test
        @DisplayName("Returns empty when user is ADMIN")
        void adminReturnsEmpty() {
            AuthUser admin =
                    new AuthUser(USER_ID, null, null, "ADMIN", "ACTIVE", "FACEBOOK", Instant.now(), Instant.now());
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(admin));

            assertThat(service.activateTaskerRole(USER_ID)).isEmpty();
        }

        @Test
        @DisplayName("SCN-VERIF-001: User requests tasker role activation before verification")
        void customerActivatesTaskerRoleRemainsVerificationGated() {
            // Given an authenticated user with role CUSTOMER
            AuthUser customer = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(userStatusResolver.resolve(eq(USER_ID), anyString())).thenReturn("ACTIVE");

            // When the user requests tasker role activation
            Optional<RoleActivationResult> result = service.activateTaskerRole(USER_ID);

            // Then the user role is updated to reflect tasker-role request
            assertThat(result).isPresent();
            verify(userDao).updateRole(USER_ID, "TASKER");

            // And the user remains verification-gated -- status does NOT become VERIFIED
            verify(userDao, never()).updateStatus(anyString(), eq("VERIFIED"));
            assertThat(result.get().user()).containsEntry("role", "TASKER");
            assertThat(result.get().user()).containsEntry("status", "ACTIVE");
        }
    }

    // ── currentUserStatus ─────────────────────────────────────────────────

    @Nested
    @DisplayName("currentUserStatus")
    class CurrentUserStatus {

        @Test
        @DisplayName("Returns empty for invalid UUID")
        void invalidUuidReturnsEmpty() {
            assertThat(service.currentUserStatus("not-a-uuid")).isEmpty();
        }

        @Test
        @DisplayName("Returns empty for non-existent user")
        void missingUserReturnsEmpty() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());
            assertThat(service.currentUserStatus(USER_ID)).isEmpty();
        }

        @Test
        @DisplayName("Returns resolved status for existing user")
        void returnsResolvedStatus() {
            AuthUser user = activeCustomer();
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(USER_ID, "ACTIVE")).thenReturn("ACTIVE");

            assertThat(service.currentUserStatus(USER_ID)).contains("ACTIVE");
        }
    }

    // ── createAvatarUploadUrl ──────────────────────────────────────────────

    @Nested
    @DisplayName("createAvatarUploadUrl")
    class CreateAvatarUploadUrl {

        @Test
        @DisplayName("Returns upload URL for supported MIME type")
        void supportedMimeTypeReturnsUrl() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(activeCustomer()));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.AVATAR, USER_ID, "jpg"))
                    .thenReturn("avatar/key.jpg");
            when(storageService.generateUploadUrl("avatar/key.jpg", "image/jpeg"))
                    .thenReturn("https://s3/upload");

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(USER_ID, "image/jpeg");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://s3/upload");
            assertThat(result.get().storageKey()).isEqualTo("avatar/key.jpg");
        }

        @Test
        @DisplayName("Returns empty for unsupported MIME type")
        void unsupportedMimeTypeReturnsEmpty() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(activeCustomer()));

            assertThat(service.createAvatarUploadUrl(USER_ID, "application/pdf"))
                    .isEmpty();
        }

        @Test
        @DisplayName("Returns empty when user does not exist")
        void missingUserReturnsEmpty() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());
            assertThat(service.createAvatarUploadUrl(USER_ID, "image/jpeg")).isEmpty();
        }
    }
}
