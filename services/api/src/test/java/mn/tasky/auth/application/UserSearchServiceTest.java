package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.security.CryptoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserSearchService")
class UserSearchServiceTest {

    @Mock
    private UserDao userDao;

    @Mock
    private ProfileDao profileDao;

    @Mock
    private CryptoService cryptoService;

    @Mock
    private BadgeDao badgeDao;

    @Mock
    private UserStatusResolver userStatusResolver;

    private UserSearchService service;

    private final Instant now = Instant.now();
    private final String userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private final String encryptedPhone = "enc-phone";
    private final String phone = "+97612345678";
    private final String blindIndex = "blind-index-123";

    private final AuthUser activeUser =
            new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);

    private final UserProfileState defaultProfile = UserProfileState.defaultState();

    @BeforeEach
    void setUp() {
        service = new UserSearchService(userDao, profileDao, cryptoService, badgeDao, userStatusResolver);
    }

    private void stubToProfileMapping() {
        when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
        when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
        when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
        when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
    }

    @Nested
    @DisplayName("searchUsersByPhone()")
    class SearchUsersByPhone {

        @Test
        @DisplayName("returns empty page when phone is empty")
        void returnsEmptyWhenPhoneEmpty() {
            UserProfilePage result = service.searchUsersByPhone("", null, 10);

            assertThat(result.data()).isEmpty();
            assertThat(result.hasMore()).isFalse();
            assertThat(result.nextCursor()).isNull();
        }

        @Test
        @DisplayName("returns empty page when phone has no digits")
        void returnsEmptyWhenNoDigits() {
            UserProfilePage result = service.searchUsersByPhone("abc-def", null, 10);

            assertThat(result.data()).isEmpty();
        }

        @Test
        @DisplayName("returns matching user profiles")
        void returnsMatchingUserProfiles() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(activeUser));
            stubToProfileMapping();

            UserProfilePage result = service.searchUsersByPhone("97612345678", null, 10);

            assertThat(result.data()).hasSize(1);
            assertThat(result.data().get(0).id()).isEqualTo(userId);
            assertThat(result.data().get(0).phone()).isEqualTo(phone);
            assertThat(result.hasMore()).isFalse();
        }

        @Test
        @DisplayName("returns empty when no user matches blind index")
        void returnsEmptyWhenNoMatch() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.empty());

            UserProfilePage result = service.searchUsersByPhone("97612345678", null, 10);

            assertThat(result.data()).isEmpty();
        }

        @Test
        @DisplayName("throws when cursor is invalid UUID")
        void throwsWhenCursorInvalid() {
            assertThatThrownBy(() -> service.searchUsersByPhone("97612345678", "not-a-uuid", 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }

        @Test
        @DisplayName("paginates results with cursor and hasMore flag")
        void paginatesWithCursor() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(activeUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            UserProfilePage result = service.searchUsersByPhone("97612345678", null, 10);

            assertThat(result.data()).hasSize(1);
            assertThat(result.hasMore()).isFalse();
        }
    }

    @Nested
    @DisplayName("searchUsersByName()")
    class SearchUsersByName {

        @Test
        @DisplayName("returns empty page when name is empty")
        void returnsEmptyWhenNameEmpty() {
            UserProfilePage result = service.searchUsersByName("", null, 10);

            assertThat(result.data()).isEmpty();
            assertThat(result.hasMore()).isFalse();
        }

        @Test
        @DisplayName("returns empty page when name is too short")
        void returnsEmptyWhenNameTooShort() {
            UserProfilePage result = service.searchUsersByName("A", null, 10);

            assertThat(result.data()).isEmpty();
        }

        @Test
        @DisplayName("returns matching users by name prefix")
        void returnsMatchingUsers() {
            when(userDao.searchByName("Test%", 3)).thenReturn(List.of(activeUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            UserProfilePage result = service.searchUsersByName("Test", null, 2);

            assertThat(result.data()).hasSize(1);
            assertThat(result.data().get(0).fullName()).isEqualTo("Tasky User");
        }

        @Test
        @DisplayName("paginates with cursor using searchByNameAfterCursor")
        void paginatesWithCursor() {
            java.util.UUID cursorUuid = java.util.UUID.fromString(userId);
            when(userDao.searchByNameAfterCursor("Test%", cursorUuid, 3)).thenReturn(List.of(activeUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            UserProfilePage result = service.searchUsersByName("Test", userId, 2);

            assertThat(result.data()).hasSize(1);
            assertThat(result.hasMore()).isFalse();
            verify(userDao).searchByNameAfterCursor("Test%", cursorUuid, 3);
        }

        @Test
        @DisplayName("sets hasMore when results exceed limit")
        void setsHasMoreWhenExceedsLimit() {
            String user2Id = "ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee";
            AuthUser user2 = new AuthUser(user2Id, encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);

            when(userDao.searchByName("Test%", 2)).thenReturn(List.of(activeUser, user2));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(userStatusResolver.resolve(user2Id, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(user2Id)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(user2Id)).thenReturn(List.of());

            UserProfilePage result = service.searchUsersByName("Test", null, 1);

            assertThat(result.data()).hasSize(1);
            assertThat(result.hasMore()).isTrue();
            assertThat(result.nextCursor()).isEqualTo(userId);
        }

        @Test
        @DisplayName("trims name input")
        void trimsNameInput() {
            when(userDao.searchByName("Test%", 11)).thenReturn(List.of());

            service.searchUsersByName("  Test  ", null, 10);

            verify(userDao).searchByName("Test%", 11);
        }

        @Test
        @DisplayName("throws when cursor is invalid UUID")
        void throwsWhenCursorInvalid() {
            assertThatThrownBy(() -> service.searchUsersByName("Test", "bad-cursor", 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }
    }

    @Nested
    @DisplayName("searchUsersByFacebookId()")
    class SearchUsersByFacebookId {

        @Test
        @DisplayName("returns empty page when facebook ID is empty")
        void returnsEmptyWhenEmpty() {
            UserProfilePage result = service.searchUsersByFacebookId("", null, 10);

            assertThat(result.data()).isEmpty();
            assertThat(result.hasMore()).isFalse();
        }

        @Test
        @DisplayName("returns matching user by Facebook ID")
        void returnsMatchingUser() {
            AuthUser fbUser =
                    new AuthUser(userId, encryptedPhone, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(defaultProfile));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            UserProfilePage result = service.searchUsersByFacebookId("fb-123", null, 10);

            assertThat(result.data()).hasSize(1);
            assertThat(result.data().get(0).id()).isEqualTo(userId);
        }

        @Test
        @DisplayName("returns empty when no user found")
        void returnsEmptyWhenNoUser() {
            when(userDao.findByFacebookId("fb-404")).thenReturn(Optional.empty());

            UserProfilePage result = service.searchUsersByFacebookId("fb-404", null, 10);

            assertThat(result.data()).isEmpty();
        }

        @Test
        @DisplayName("trims Facebook ID input")
        void trimsFacebookId() {
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.empty());

            service.searchUsersByFacebookId("  fb-123  ", null, 10);

            verify(userDao).findByFacebookId("fb-123");
        }

        @Test
        @DisplayName("filters out results before cursor")
        void filtersOutResultsBeforeCursor() {
            AuthUser fbUser =
                    new AuthUser(userId, encryptedPhone, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));

            UserProfilePage result = service.searchUsersByFacebookId("fb-123", userId, 10);

            assertThat(result.data()).isEmpty();
        }

        @Test
        @DisplayName("throws when cursor is invalid UUID")
        void throwsWhenCursorInvalid() {
            assertThatThrownBy(() -> service.searchUsersByFacebookId("fb-123", "bad-cursor", 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }
    }
}
