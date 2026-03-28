package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import mn.tasky.admin.api.AdminVerificationController;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.JwtPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

@ExtendWith(MockitoExtension.class)
class AdminVerificationAuditTests {

    private static final String ADMIN_USER_ID = "00000000-0000-0000-0000-000000000099";
    private static final String VERIFICATION_ID = "00000000-0000-0000-0000-000000000001";

    @Mock
    private AuthService authService;

    @Mock
    private AuditEventDao auditEventDao;

    private AdminVerificationController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminVerificationController(authService, auditEventDao);
    }

    @Test
    @DisplayName("View verification detail writes VERIFICATION_MEDIA_VIEWED audit events for front and back")
    void viewVerificationDetailWritesAuditEvents() {
        VerificationDetail detail = new VerificationDetail(
                VERIFICATION_ID,
                "00000000-0000-0000-0000-000000000010",
                "+97699110001",
                "Test User",
                "https://s3.example.com/front.jpg",
                "https://s3.example.com/back.jpg",
                "PENDING",
                null,
                "2026-03-01T00:00:00Z",
                null,
                null,
                null,
                null);
        when(authService.getVerificationDetail(VERIFICATION_ID)).thenReturn(Optional.of(detail));

        JwtPrincipal principal = new JwtPrincipal(ADMIN_USER_ID, "ADMIN", "ACTIVE");
        ResponseEntity<?> response = controller.getDetail(VERIFICATION_ID, principal, new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        verify(auditEventDao)
                .insert(
                        ADMIN_USER_ID,
                        "VERIFICATION_MEDIA_VIEWED",
                        "VERIFICATION",
                        VERIFICATION_ID,
                        "{\"field\":\"id_card_front\"}");
        verify(auditEventDao)
                .insert(
                        ADMIN_USER_ID,
                        "VERIFICATION_MEDIA_VIEWED",
                        "VERIFICATION",
                        VERIFICATION_ID,
                        "{\"field\":\"id_card_back\"}");
    }

    @Test
    @DisplayName("View verification detail returns 404 when not found and writes no audit events")
    @SuppressWarnings("unchecked")
    void viewVerificationDetailNotFoundNoAudit() {
        when(authService.getVerificationDetail(VERIFICATION_ID)).thenReturn(Optional.empty());

        JwtPrincipal principal = new JwtPrincipal(ADMIN_USER_ID, "ADMIN", "ACTIVE");
        ResponseEntity<?> response = controller.getDetail(VERIFICATION_ID, principal, new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertThat(body).containsEntry("code", "NOT_FOUND");

        org.mockito.Mockito.verifyNoInteractions(auditEventDao);
    }

    @Test
    @DisplayName("View verification detail skips audit events when media URLs are missing")
    void viewVerificationDetailMissingMediaSkipsAudit() {
        VerificationDetail detail = new VerificationDetail(
                VERIFICATION_ID,
                "00000000-0000-0000-0000-000000000010",
                "+97699110001",
                "Test User",
                null,
                null,
                "PENDING",
                null,
                "2026-03-01T00:00:00Z",
                null,
                null,
                null,
                null);
        when(authService.getVerificationDetail(VERIFICATION_ID)).thenReturn(Optional.of(detail));

        JwtPrincipal principal = new JwtPrincipal(ADMIN_USER_ID, "ADMIN", "ACTIVE");
        ResponseEntity<?> response = controller.getDetail(VERIFICATION_ID, principal, new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        org.mockito.Mockito.verifyNoInteractions(auditEventDao);
    }
}
