package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
import mn.tasky.common.security.dto.RefreshToken;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileService")
class UserProfileServiceTest {

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
    private JwtTokenService jwtTokenService;

    @Mock
    private RefreshSessionDao refreshSessionDao;

    private UserProfileService service;

    private final Instant now = Instant.now();
    private final String userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private final String encryptedPhone = "enc-phone";
    private final String phone = "+97612345678";

    private final AuthUser activeCustomer =
            new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);

    private final UserProfileState defaultProfile = UserProfileState.defaultState();

    @BeforeEach
    void setUp() {
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
                true,
                false,
                3);
    }

    private void stubSessionIssuance() {
        when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
        when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
        RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
        when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
        when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
    }

    @Nested
    @DisplayName("getProfile()")
    class GetProfile {

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns profile with resolved status")
        void returnsProfileWithResolvedStatus() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isPresent();
            UserProfile profile = result.get();
            assertThat(profile.id()).isEqualTo(userId);
            assertThat(profile.phone()).isEqualTo(phone);
            assertThat(profile.role()).isEqualTo("CUSTOMER");
            assertThat(profile.status()).isEqualTo("ACTIVE");
            assertThat(profile.isPro()).isFalse();
        }

        @Test
        @DisplayName("returns PRO profile when badge present")
        void returnsProProfileWhenBadgePresent() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of(new TaskerBadge(userId, "PRO", now, null)));
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isPresent();
            assertThat(result.get().isPro()).isTrue();
        }

        @Test
        @DisplayName("hides rating when completed tasks below threshold")
        void hidesRatingBelowThreshold() {
            UserProfileState lowCompletion = new UserProfileState("User", null, null, 4.5, 2, null);

            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(lowCompletion));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isPresent();
            assertThat(result.get().ratingAvg()).isNull();
        }

        @Test
        @DisplayName("shows rating when completed tasks meet threshold")
        void showsRatingAtThreshold() {
            UserProfileState enoughCompletion = new UserProfileState("User", null, null, 4.5, 3, null);

            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(enoughCompletion));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isPresent();
            assertThat(result.get().ratingAvg()).isEqualTo(4.5);
        }

        @Test
        @DisplayName("uses default state when profile not found")
        void usesDefaultStateWhenProfileNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result = service.getProfile(userId);

            assertThat(result).isPresent();
            assertThat(result.get().fullName()).isEqualTo("Tasky User");
        }
    }

    @Nested
    @DisplayName("updateProfile()")
    class UpdateProfile {

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<UserProfile> result = service.updateProfile(userId, new ProfileUpdate("Name", null, null));

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("updates profile fields and returns updated profile")
        void updatesProfileFields() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<UserProfile> result =
                    service.updateProfile(userId, new ProfileUpdate("New Name", "http://avatar", "Hello"));

            assertThat(result).isPresent();
            verify(profileDao).updateProfileDetails(userId, "New Name", "http://avatar", "Hello");
        }

        @Test
        @DisplayName("preserves existing fields when update values are null")
        void preservesExistingFieldsWhenNull() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId))
                    .thenReturn(Optional.of(new UserProfileState("Original", "http://avatar", "Bio", 4.5, 5, null)));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            service.updateProfile(userId, new ProfileUpdate(null, null, null));

            verify(profileDao).updateProfileDetails(userId, "Original", "http://avatar", "Bio");
        }

        @Test
        @DisplayName("trims whitespace from update values")
        void trimsWhitespace() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            service.updateProfile(userId, new ProfileUpdate("  Name  ", "  http://a  ", "  bio  "));

            verify(profileDao).updateProfileDetails(userId, "Name", "http://a", "bio");
        }
    }

    @Nested
    @DisplayName("activateTaskerRole()")
    class ActivateTaskerRole {

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<RoleActivationResult> result = service.activateTaskerRole(userId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when user is already TASKER")
        void returnsEmptyWhenAlreadyTasker() {
            AuthUser tasker = new AuthUser(userId, encryptedPhone, null, "TASKER", "ACTIVE", "PHONE", now, now);
            when(userDao.findById(userId)).thenReturn(Optional.of(tasker));

            Optional<RoleActivationResult> result = service.activateTaskerRole(userId);

            assertThat(result).isEmpty();
            verify(userDao, never()).updateRole(anyString(), anyString());
        }

        @Test
        @DisplayName("returns empty when user is ADMIN")
        void returnsEmptyWhenAdmin() {
            AuthUser admin = new AuthUser(userId, encryptedPhone, null, "ADMIN", "ACTIVE", "PHONE", now, now);
            when(userDao.findById(userId)).thenReturn(Optional.of(admin));

            Optional<RoleActivationResult> result = service.activateTaskerRole(userId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("activates tasker role for customer and returns new session")
        void activatesTaskerRoleForCustomer() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            stubSessionIssuance();

            Optional<RoleActivationResult> result = service.activateTaskerRole(userId);

            assertThat(result).isPresent();
            RoleActivationResult activation = result.get();
            assertThat(activation.accessToken()).isEqualTo("access-token");
            assertThat(activation.refreshToken()).isEqualTo("refresh-token");
            verify(userDao).updateRole(userId, "TASKER");
        }
    }

    @Nested
    @DisplayName("updateUserStats()")
    class UpdateUserStats {

        @Test
        @DisplayName("increments completed tasks")
        void incrementsCompletedTasks() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));

            service.updateUserStats(userId, 0, true);

            verify(profileDao).updateStats(userId, 0.0, 1);
        }

        @Test
        @DisplayName("does not increment when flag is false")
        void doesNotIncrementWhenFlagFalse() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));

            service.updateUserStats(userId, 0, false);

            verify(profileDao).updateStats(userId, 0.0, 0);
        }

        @Test
        @DisplayName("sets first rating when avg is zero")
        void setsFirstRating() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));

            service.updateUserStats(userId, 4.5, false);

            verify(profileDao).updateStats(userId, 4.5, 0);
        }

        @Test
        @DisplayName("calculates running average for subsequent ratings")
        void calculatesRunningAverage() {
            UserProfileState existing = new UserProfileState("User", null, null, 4.0, 5, null);
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(existing));

            service.updateUserStats(userId, 5.0, true);

            verify(profileDao).updateStats(userId, (4.0 * 5 + 5.0) / 6, 6);
        }

        @Test
        @DisplayName("handles rating with zero completed tasks")
        void handlesRatingWithZeroCompleted() {
            UserProfileState state = new UserProfileState("User", null, null, 0.0, 0, null);
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(state));

            service.updateUserStats(userId, 3.0, false);

            verify(profileDao).updateStats(userId, 3.0, 0);
        }

        @Test
        @DisplayName("uses default state when profile not found")
        void usesDefaultWhenProfileNotFound() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());

            service.updateUserStats(userId, 4.0, true);

            verify(profileDao).updateStats(userId, 4.0, 1);
        }

        @Test
        @DisplayName("does not update rating when rating is zero or negative")
        void doesNotUpdateRatingWhenNonPositive() {
            UserProfileState existing = new UserProfileState("User", null, null, 4.0, 5, null);
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(existing));

            service.updateUserStats(userId, -1.0, true);

            verify(profileDao).updateStats(userId, 4.0, 6);
        }
    }

    @Nested
    @DisplayName("currentUserStatus()")
    class CurrentUserStatus {

        @Test
        @DisplayName("returns empty for invalid UUID")
        void returnsEmptyForInvalidUuid() {
            Optional<String> result = service.currentUserStatus("not-a-uuid");

            assertThat(result).isEmpty();
            verifyNoInteractions(userDao);
        }

        @Test
        @DisplayName("returns resolved status for valid user")
        void returnsResolvedStatus() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");

            Optional<String> result = service.currentUserStatus(userId);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualTo("ACTIVE");
        }

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<String> result = service.currentUserStatus(userId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("requiresOtpMigration()")
    class RequiresOtpMigration {

        @Test
        @DisplayName("returns true when OTP enabled and user has Facebook without phone")
        void returnsTrueWhenFbUserWithoutPhone() {
            AuthUser fbUser = new AuthUser(userId, null, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);
            when(userDao.findById(userId)).thenReturn(Optional.of(fbUser));

            boolean result = service.requiresOtpMigration(userId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when user has phone linked")
        void returnsFalseWhenPhoneLinked() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));

            boolean result = service.requiresOtpMigration(userId);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when user not found")
        void returnsFalseWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            boolean result = service.requiresOtpMigration(userId);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("requiresOtpMigration when OTP disabled")
    class RequiresOtpMigrationDisabled {

        private UserProfileService disabledService;

        @BeforeEach
        void setUpDisabled() {
            disabledService = new UserProfileService(
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

        @Test
        @DisplayName("returns false when OTP disabled regardless of user state")
        void returnsFalseWhenOtpDisabled() {
            boolean result = disabledService.requiresOtpMigration(userId);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("revokeInstantMatch()")
    class RevokeInstantMatch {

        @Test
        @DisplayName("sets revoked until timestamp")
        void setsRevokedUntil() {
            service.revokeInstantMatch(userId, Duration.ofHours(1));

            verify(profileDao).setInstantMatchRevokedUntil(eq(userId), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("isInstantMatchAllowed()")
    class IsInstantMatchAllowed {

        @Test
        @DisplayName("returns true when no revocation timestamp")
        void returnsTrueWhenNoRevocation() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));

            boolean result = service.isInstantMatchAllowed(userId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns true when revocation has expired")
        void returnsTrueWhenExpired() {
            UserProfileState revoked = new UserProfileState("User", null, null, 0, 0, now.minusSeconds(60));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(revoked));

            boolean result = service.isInstantMatchAllowed(userId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when currently revoked")
        void returnsFalseWhenRevoked() {
            UserProfileState revoked = new UserProfileState("User", null, null, 0, 0, now.plusSeconds(3600));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(revoked));

            boolean result = service.isInstantMatchAllowed(userId);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns true when profile not found")
        void returnsTrueWhenProfileNotFound() {
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());

            boolean result = service.isInstantMatchAllowed(userId);

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("createAvatarUploadUrl()")
    class CreateAvatarUploadUrl {

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(userId, "image/jpeg");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty for unsupported content type")
        void returnsEmptyForUnsupportedContentType() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(userId, "image/gif");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns upload URL for supported content type")
        void returnsUploadUrlForSupportedType() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.AVATAR, userId, "jpg"))
                    .thenReturn("uploads/avatars/user-1/test.jpg");
            when(storageService.generateUploadUrl("uploads/avatars/user-1/test.jpg", "image/jpeg"))
                    .thenReturn("https://upload.url");

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(userId, "image/jpeg");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://upload.url");
            assertThat(result.get().storageKey()).isEqualTo("uploads/avatars/user-1/test.jpg");
        }

        @Test
        @DisplayName("normalizes content type to lowercase")
        void normalizesContentType() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.AVATAR, userId, "png"))
                    .thenReturn("uploads/avatars/user-1/test.png");
            when(storageService.generateUploadUrl("uploads/avatars/user-1/test.png", "image/png"))
                    .thenReturn("https://upload.url");

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(userId, "Image/PNG");

            assertThat(result).isPresent();
            verify(storageService).generateUploadUrl(anyString(), eq("image/png"));
        }

        @Test
        @DisplayName("supports webp content type")
        void supportsWebp() {
            when(userDao.findById(userId)).thenReturn(Optional.of(activeCustomer));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.AVATAR, userId, "webp"))
                    .thenReturn("uploads/avatars/user-1/test.webp");
            when(storageService.generateUploadUrl("uploads/avatars/user-1/test.webp", "image/webp"))
                    .thenReturn("https://upload.url");

            Optional<PresignedUpload> result = service.createAvatarUploadUrl(userId, "image/webp");

            assertThat(result).isPresent();
        }
    }
}
