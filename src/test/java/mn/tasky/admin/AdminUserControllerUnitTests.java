package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import mn.tasky.admin.api.AdminUserController;
import mn.tasky.admin.dto.AdminActionRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerUnitTests {

    @Mock
    private AuthService authService;

    private AdminUserController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminUserController(authService);
    }

    @Test
    void searchAppliesCursorAndReturnsDeterministicPage() {
        UserProfile u1 = user(uuid(1), "+97699110001");
        UserProfile u2 = user(uuid(2), "+97699110002");
        UserProfile u3 = user(uuid(3), "+97699110003");
        when(authService.searchUsersByPhone("9911", u1.id(), 2))
                .thenReturn(new UserProfilePage(List.of(u2, u3), null, false));

        ResponseEntity<?> response = controller.search(null, null, "9911", u1.id(), 2);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        PagedResponse<?> body = (PagedResponse<?>) response.getBody();
        assertThat(body.data()).hasSize(2);
        UserProfile first = (UserProfile) body.data().get(0);
        UserProfile second = (UserProfile) body.data().get(1);
        assertThat(first.id()).isEqualTo(u2.id());
        assertThat(second.id()).isEqualTo(u3.id());
        assertThat(body.cursor().hasMore()).isFalse();
    }

    private UserProfile user(String id, String phone) {
        return new UserProfile(id, phone, "CUSTOMER", "ACTIVE", "User", "", 0.0, 0, false, "2026-02-17T00:00:00Z");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    @Test
    void searchReturnsBadRequestWhenCursorIsInvalid() {
        when(authService.searchUsersByPhone("9911", "not-a-uuid", 2))
                .thenThrow(new IllegalArgumentException("Cursor is invalid."));

        ResponseEntity<?> response = controller.search(null, null, "9911", "not-a-uuid", 2);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "INVALID_CURSOR");
    }

    @Test
    void banReturnsNotFoundWhenTargetUserDoesNotExist() {
        JwtPrincipal admin = new JwtPrincipal(uuid(100), "ADMIN", "ACTIVE");
        when(authService.banUser(admin.userId(), uuid(4), "fraud")).thenReturn(false);

        ResponseEntity<?> response = controller.ban(admin, uuid(4), new AdminActionRequest("fraud"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unbanReturnsActiveStatusOnSuccess() {
        JwtPrincipal admin = new JwtPrincipal(uuid(101), "ADMIN", "ACTIVE");
        when(authService.unbanUser(admin.userId(), uuid(5), "resolved")).thenReturn(true);

        ResponseEntity<?> response = controller.unban(admin, uuid(5), new AdminActionRequest("resolved"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("status", "ACTIVE");
    }
}
