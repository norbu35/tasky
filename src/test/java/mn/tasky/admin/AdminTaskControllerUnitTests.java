package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import mn.tasky.admin.api.AdminTaskController;
import mn.tasky.admin.dto.ConciergeAssignRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
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
class AdminTaskControllerUnitTests {

    @Mock
    private TaskDao taskDao;

    @Mock
    private AuthService authService;

    @Mock
    private BookingService bookingService;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private AuditEventDao auditEventDao;

    private AdminTaskController controller;
    private MockHttpServletRequest httpRequest;
    private JwtPrincipal adminPrincipal;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private static final String TASK_ID = "00000000-0000-0000-0000-000000000010";
    private static final String TASKER_ID = "00000000-0000-0000-0000-000000000020";
    private static final String CUSTOMER_ID = "00000000-0000-0000-0000-000000000030";
    private static final String BOOKING_ID = "00000000-0000-0000-0000-000000000040";
    private static final String IDEM_KEY = "test-idem-key";

    @BeforeEach
    void setUp() {
        controller = new AdminTaskController(
                taskDao, authService, bookingService, idempotencyService, auditEventDao, objectMapper);
        httpRequest = new MockHttpServletRequest();
        adminPrincipal = new JwtPrincipal(ADMIN_ID, "ADMIN", "VERIFIED");
    }

    @Test
    @DisplayName("concierge-assign succeeds for OPEN task and VERIFIED tasker")
    void conciergeAssignSuccess() {
        Instant now = Instant.parse("2026-03-17T00:00:00Z");
        TaskState task = new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "desc",
                50000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                now,
                null,
                null,
                null,
                null,
                now,
                now);
        UserProfile tasker =
                new UserProfile(TASKER_ID, "9999", "TASKER", "VERIFIED", "Tasker", null, 4.8, 10, true, now.toString());
        BookingState booking = new BookingState(
                BOOKING_ID,
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                50000,
                "ASSIGNED",
                null,
                true,
                now,
                "DIRECT",
                false,
                now,
                now,
                now);
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "Low liquidity override", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(authService.getProfile(TASKER_ID)).thenReturn(Optional.of(tasker));
        when(bookingService.createBooking(eq(TASK_ID), eq(TASKER_ID), eq(CUSTOMER_ID), eq(50000), eq(true), eq(now)))
                .thenReturn(booking);

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertThat(responseBody).containsEntry("id", BOOKING_ID);
        assertThat(responseBody).containsEntry("status", "ASSIGNED");

        verify(taskDao).updateStatus(eq(TASK_ID), eq("ASSIGNED"), any(Instant.class));
        verify(auditEventDao)
                .insert(eq(ADMIN_ID), eq("CONCIERGE_ASSIGN"), eq("BOOKING"), eq(BOOKING_ID), any(String.class));
        verify(idempotencyService)
                .completeWithResource(
                        ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY, "BOOKING", BOOKING_ID);
    }

    @Test
    @DisplayName("concierge-assign rejects when disclaimer not accepted")
    void conciergeAssignDisclaimerRequired() {
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", false);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("concierge-assign returns 404 when task not found")
    void conciergeAssignTaskNotFound() {
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("concierge-assign returns 409 when task is not OPEN")
    void conciergeAssignTaskNotOpen() {
        Instant now = Instant.now();
        TaskState task = new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "desc",
                50000,
                47.9,
                106.9,
                "UB",
                "ASSIGNED",
                now,
                null,
                null,
                null,
                null,
                now,
                now);
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("concierge-assign returns 404 when tasker not found")
    void conciergeAssignTaskerNotFound() {
        Instant now = Instant.now();
        TaskState task = new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "desc",
                50000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                now,
                null,
                null,
                null,
                null,
                now,
                now);
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(authService.getProfile(TASKER_ID)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("concierge-assign returns 409 when tasker is not VERIFIED")
    void conciergeAssignTaskerNotVerified() {
        Instant now = Instant.now();
        TaskState task = new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "desc",
                50000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                now,
                null,
                null,
                null,
                null,
                now,
                now);
        UserProfile tasker =
                new UserProfile(TASKER_ID, "9999", "TASKER", "PENDING", "Tasker", null, 4.0, 2, false, now.toString());
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
        when(authService.getProfile(TASKER_ID)).thenReturn(Optional.of(tasker));

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("concierge-assign returns conflict when idempotency key in progress")
    void conciergeAssignIdempotencyInProgress() {
        ConciergeAssignRequest body = new ConciergeAssignRequest(TASKER_ID, "reason", true);

        when(idempotencyService.claim(ADMIN_ID, IdempotencyOperations.CONCIERGE_ASSIGN, IDEM_KEY))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

        ResponseEntity<?> response = controller.conciergeAssign(adminPrincipal, TASK_ID, IDEM_KEY, body, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
