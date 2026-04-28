package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminUserCompositionServiceTests {

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Mock
    private IdentityQueryPort identityQueryPort;

    private AdminUserCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserCompositionService(identityCommandPort, identityQueryPort);
    }

    @Nested
    @DisplayName("searchByName")
    class SearchByNameTests {

        @Test
        @DisplayName("delegates to identityQueryPort and returns results")
        void searchByName_delegates() {
            UserProfilePage expected = new UserProfilePage(List.of(), null, false);
            when(identityQueryPort.searchUsersByName("john", "cursor1", 20)).thenReturn(expected);

            UserProfilePage result = service.searchByName("john", "cursor1", 20);

            assertThat(result).isSameAs(expected);
        }
    }

    @Nested
    @DisplayName("searchByFacebookId")
    class SearchByFacebookIdTests {

        @Test
        @DisplayName("delegates to identityQueryPort and returns results")
        void searchByFacebookId_delegates() {
            UserProfilePage expected = new UserProfilePage(List.of(), null, false);
            when(identityQueryPort.searchUsersByFacebookId("fb123", "c1", 10)).thenReturn(expected);

            UserProfilePage result = service.searchByFacebookId("fb123", "c1", 10);

            assertThat(result).isSameAs(expected);
        }
    }

    @Nested
    @DisplayName("searchByPhone")
    class SearchByPhoneTests {

        @Test
        @DisplayName("delegates to identityQueryPort and returns results")
        void searchByPhone_delegates() {
            UserProfilePage expected = new UserProfilePage(List.of(), null, false);
            when(identityQueryPort.searchUsersByPhone("9911", null, 50)).thenReturn(expected);

            UserProfilePage result = service.searchByPhone("9911", null, 50);

            assertThat(result).isSameAs(expected);
        }
    }

    @Nested
    @DisplayName("banUser")
    class BanUserTests {

        @Test
        @DisplayName("delegates to identityCommandPort and returns result")
        void banUser_delegates() {
            when(identityCommandPort.banUser("admin1", "user1", "violation")).thenReturn(true);

            boolean result = service.banUser("admin1", "user1", "violation");

            assertThat(result).isTrue();
            verify(identityCommandPort).banUser("admin1", "user1", "violation");
        }

        @Test
        @DisplayName("returns false when ban fails")
        void banUser_returnsFalse() {
            when(identityCommandPort.banUser("admin1", "user1", "reason")).thenReturn(false);

            boolean result = service.banUser("admin1", "user1", "reason");

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("unbanUser")
    class UnbanUserTests {

        @Test
        @DisplayName("delegates to identityCommandPort and returns result")
        void unbanUser_delegates() {
            when(identityCommandPort.unbanUser("admin1", "user1", "appeal approved"))
                    .thenReturn(true);

            boolean result = service.unbanUser("admin1", "user1", "appeal approved");

            assertThat(result).isTrue();
            verify(identityCommandPort).unbanUser("admin1", "user1", "appeal approved");
        }

        @Test
        @DisplayName("returns false when unban fails")
        void unbanUser_returnsFalse() {
            when(identityCommandPort.unbanUser("admin1", "user1", "reason")).thenReturn(false);

            boolean result = service.unbanUser("admin1", "user1", "reason");

            assertThat(result).isFalse();
        }
    }
}
