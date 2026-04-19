package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.runtime.publicapi.composition.BookingResponseCompositionService;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminTaskConciergeAssignmentServiceTest {

    @Mock
    private MarketplaceQueryPort marketplaceQueryPort;

    @Mock
    private MarketplaceCommandPort marketplaceCommandPort;

    @Mock
    private AdminAuditCommandPort adminAuditCommandPort;

    @Mock
    private IdentityQueryPort identityQueryPort;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private BookingResponseCompositionService bookingResponseCompositionService;

    @Captor
    private ArgumentCaptor<String> metadataCaptor;

    private AdminTaskConciergeAssignmentService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new AdminTaskConciergeAssignmentService(
                marketplaceQueryPort,
                marketplaceCommandPort,
                adminAuditCommandPort,
                identityQueryPort,
                bookingCommandPort,
                bookingQueryPort,
                idempotencyService,
                objectMapper,
                bookingResponseCompositionService);
    }

    @Test
    @DisplayName("Concierge assignment writes durable audit evidence via AdminAuditCommandPort")
    void conciergeAssign_recordsDurableAuditEvidence() {
        String adminId = "admin-001";
        String taskId = UUID.randomUUID().toString();
        String taskerId = "tasker-001";
        String bookingId = UUID.randomUUID().toString();
        String customerId = "customer-001";
        String idempotencyKey = "idemp-" + UUID.randomUUID();

        // Idempotency claim: first call
        when(idempotencyService.claim(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

        // Task lookup
        TaskState task = new TaskState(
                taskId,
                customerId,
                null,
                "Test task",
                1000,
                47.9,
                106.9,
                "Ulaanbaatar",
                "OPEN",
                Instant.now(),
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(marketplaceQueryPort.getTask(taskId)).thenReturn(Optional.of(task));

        // Tasker verification
        UserProfile tasker = new UserProfile(
                taskerId, "+97699112233", "TASKER", "VERIFIED", "Test User", null, null, 0.0, 0, false, null);
        when(identityQueryPort.getProfile(taskerId)).thenReturn(Optional.of(tasker));

        // Booking creation
        BookingState booking = new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                true,
                Instant.now(),
                "CONCIERGE",
                false,
                Instant.now(),
                Instant.now(),
                Instant.now());
        when(bookingCommandPort.createBooking(anyString(), anyString(), anyString(), anyInt(), anyBoolean(), any()))
                .thenReturn(booking);
        when(bookingResponseCompositionService.basicBookingResponse(any())).thenReturn(Map.of("id", bookingId));

        // Execute
        AdminTaskConciergeAssignmentOutcome outcome =
                service.conciergeAssign(adminId, taskId, taskerId, "test override", true, idempotencyKey);

        // Verify the durable audit write happened (not just a log line)
        verify(adminAuditCommandPort)
                .recordAdminAction(
                        eq(adminId), eq("CONCIERGE_ASSIGN"), eq("BOOKING"), eq(bookingId), metadataCaptor.capture());

        // Verify the audit metadata contains the key evidence fields
        String metadata = metadataCaptor.getValue();
        assertThat(metadata).contains("task_id");
        assertThat(metadata).contains(taskId);
        assertThat(metadata).contains("tasker_id");
        assertThat(metadata).contains(taskerId);
        assertThat(metadata).contains("admin_id");
        assertThat(metadata).contains(adminId);
        assertThat(metadata).contains("booking_id");
        assertThat(metadata).contains(bookingId);

        // Verify the outcome is success
        assertThat(outcome.status()).isEqualTo(AdminTaskConciergeAssignmentOutcome.Status.SUCCESS);
    }

    @Test
    @DisplayName("Concierge assignment does NOT write audit evidence when task is not OPEN")
    void conciergeAssign_noAuditEvidenceForNonOpenTask() {
        String adminId = "admin-001";
        String taskId = UUID.randomUUID().toString();
        String taskerId = "tasker-001";
        String idempotencyKey = "idemp-" + UUID.randomUUID();

        when(idempotencyService.claim(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

        TaskState task = new TaskState(
                taskId,
                "customer-001",
                null,
                "Test task",
                1000,
                47.9,
                106.9,
                "Ulaanbaatar",
                "COMPLETED",
                Instant.now(),
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(marketplaceQueryPort.getTask(taskId)).thenReturn(Optional.of(task));

        service.conciergeAssign(adminId, taskId, taskerId, null, true, idempotencyKey);

        verify(adminAuditCommandPort, never())
                .recordAdminAction(anyString(), anyString(), anyString(), anyString(), anyString());
    }
}
