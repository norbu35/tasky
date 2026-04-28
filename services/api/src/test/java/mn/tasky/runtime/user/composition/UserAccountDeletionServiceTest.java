package mn.tasky.runtime.user.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.util.Map;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserAccountDeletionServiceTest {

    @Mock
    private IdentityCommandPort identityCommandPort;

    private UserAccountDeletionService service;

    @Test
    void deleteMyAccountDelegatesToIdentityPort() {
        service = new UserAccountDeletionService(identityCommandPort);

        Map<String, String> result = service.deleteMyAccount("user-1");

        verify(identityCommandPort).requestAccountDeletion("user-1");
        assertThat(result)
                .containsEntry(
                        "message", "Account deletion requested. Data will be removed after 90-day retention period.");
    }

    @Test
    void deleteMyAccountReturnsImmutableMap() {
        service = new UserAccountDeletionService(identityCommandPort);

        Map<String, String> result = service.deleteMyAccount("user-2");

        assertThat(result).isUnmodifiable();
    }
}
