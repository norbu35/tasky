package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.UserSearchService;
import mn.tasky.auth.application.UserStatusResolver;
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

/**
 * Domain-unit tests for UserSearchService.
 * Covers phone, name, and Facebook ID search with cursor pagination and edge cases.
 */
@ExtendWith(MockitoExtension.class)
class UserSearchServiceTests {

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

    @BeforeEach
    void setUp() {
        service = new UserSearchService(userDao, profileDao, cryptoService, badgeDao, userStatusResolver);
    }

    private AuthUser testUser(String id) {
        return new AuthUser(id, "encrypted-phone", null, "CUSTOMER", "ACTIVE", "PHONE", Instant.now(), Instant.now());
    }

    // ── searchUsersByPhone ────────────────────────────────────────────────

    @Nested
    @DisplayName("searchUsersByPhone")
    class SearchByPhone {

        @Test
        @DisplayName("Returns empty page for blank phone input")
        void blankPhoneReturnsEmpty() {
            UserProfilePage result = service.searchUsersByPhone("", null, 10);

            assertThat(result.data()).isEmpty();
            assertThat(result.hasMore()).isFalse();
        }

        @Test
        @DisplayName("Normalizes phone to +digits format before blind index lookup")
        void normalizesPhoneAndSearches() {
            when(cryptoService.blindIndex("+97699001122")).thenReturn("blind-idx");
            when(userDao.findByPhoneBlindIndex("blind-idx")).thenReturn(Optional.empty());

            service.searchUsersByPhone("976-990-01122", null, 10);

            verify(cryptoService).blindIndex("+97699001122");
        }

        @Test
        @DisplayName("Returns matching profile for exact phone match")
        void returnsMatchingProfile() {
            String userId = UUID.randomUUID().toString();
            when(cryptoService.blindIndex("+97699001122")).thenReturn("blind-idx");
            AuthUser user = testUser(userId);
            when(userDao.findByPhoneBlindIndex("blind-idx")).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(badgeDao.findActiveByTaskerId(userId)).thenReturn(List.of());
            when(cryptoService.decrypt("encrypted-phone")).thenReturn("+97699001122");

            UserProfilePage result = service.searchUsersByPhone("+97699001122", null, 10);

            assertThat(result.data()).hasSize(1);
            assertThat(result.data().getFirst().id()).isEqualTo(userId);
        }
    }

    // ── searchUsersByName ─────────────────────────────────────────────────

    @Nested
    @DisplayName("searchUsersByName")
    class SearchByName {

        @Test
        @DisplayName("Returns empty page for name shorter than 2 characters")
        void tooShortNameReturnsEmpty() {
            UserProfilePage result = service.searchUsersByName("A", null, 10);

            assertThat(result.data()).isEmpty();
            assertThat(result.hasMore()).isFalse();
        }

        @Test
        @DisplayName("Returns empty page for blank name")
        void blankNameReturnsEmpty() {
            assertThat(service.searchUsersByName("", null, 10).data()).isEmpty();
            assertThat(service.searchUsersByName(null, null, 10).data()).isEmpty();
        }

        @Test
        @DisplayName("Appends % wildcard and delegates to DAO")
        void appendsWildcard() {
            when(userDao.searchByName("Test%", 11)).thenReturn(List.of());

            service.searchUsersByName("Test", null, 10);

            verify(userDao).searchByName("Test%", 11);
        }

        @Test
        @DisplayName("Pages correctly with cursor")
        void pagesWithCursor() {
            UUID cursorId = UUID.randomUUID();
            when(userDao.searchByNameAfterCursor("Test%", cursorId, 11)).thenReturn(List.of());

            service.searchUsersByName("Test", cursorId.toString(), 10);

            verify(userDao).searchByNameAfterCursor("Test%", cursorId, 11);
        }

        @Test
        @DisplayName("hasMore is true when results exceed limit")
        void hasMoreWhenExceedsLimit() {
            String id1 = UUID.randomUUID().toString();
            String id2 = UUID.randomUUID().toString();
            AuthUser user1 = testUser(id1);
            AuthUser user2 = testUser(id2);
            when(userDao.searchByName("Te%", 2)).thenReturn(List.of(user1, user2));
            when(userStatusResolver.resolve(anyString(), eq("ACTIVE"))).thenReturn("ACTIVE");
            when(profileDao.findByUserId(anyString())).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(badgeDao.findActiveByTaskerId(anyString())).thenReturn(List.of());

            UserProfilePage result = service.searchUsersByName("Te", null, 1);

            assertThat(result.hasMore()).isTrue();
            assertThat(result.data()).hasSize(1);
            assertThat(result.nextCursor()).isNotNull();
        }
    }

    // ── searchUsersByFacebookId ───────────────────────────────────────────

    @Nested
    @DisplayName("searchUsersByFacebookId")
    class SearchByFacebookId {

        @Test
        @DisplayName("Returns empty page for blank Facebook ID")
        void blankFbIdReturnsEmpty() {
            assertThat(service.searchUsersByFacebookId("", null, 10).data()).isEmpty();
            assertThat(service.searchUsersByFacebookId(null, null, 10).data()).isEmpty();
        }

        @Test
        @DisplayName("Trims Facebook ID before lookup")
        void trimsFacebookId() {
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.empty());

            service.searchUsersByFacebookId("  fb-123  ", null, 10);

            verify(userDao).findByFacebookId("fb-123");
        }
    }

    // ── cursor validation ─────────────────────────────────────────────────

    @Nested
    @DisplayName("cursor validation")
    class CursorValidation {

        @Test
        @DisplayName("Invalid cursor throws IllegalArgumentException")
        void invalidCursorThrows() {
            assertThatThrownBy(() -> service.searchUsersByPhone("+97699001122", "not-a-uuid", 10))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }
    }
}
