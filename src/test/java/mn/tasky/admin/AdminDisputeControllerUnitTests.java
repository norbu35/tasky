package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.admin.api.AdminDisputeController;
import mn.tasky.admin.dto.ResolveRequest;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AdminDisputeControllerUnitTests {

    @Mock
    private DisputeService disputeService;

    @Mock
    private BookingService bookingService;

    @Mock
    private ConversationDao conversationDao;

    @Mock
    private MessageDao messageDao;

    @Mock
    private IdempotencyService idempotencyService;

    private AdminDisputeController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminDisputeController(
            disputeService, bookingService, conversationDao, messageDao, idempotencyService);
    }

    @Test
    void getDisputeIncludesBookingConversationAndEvidence() {
        Dispute dispute = dispute("OPEN");
        BookingState booking = booking(dispute.bookingId());
        Conversation conversation = new Conversation(
            uuid(5),
            booking.taskId(),
            booking.taskerId(),
            booking.customerId(),
            Instant.parse("2026-02-17T00:00:00Z"));
        Message message = new Message(
            uuid(6),
            conversation.id(),
            booking.taskerId(),
            "Uploaded proof image",
            Instant.parse("2026-02-17T00:10:00Z"));

        when(disputeService.getDispute(dispute.id())).thenReturn(Optional.of(dispute));
        when(bookingService.getBooking(dispute.bookingId())).thenReturn(Optional.of(booking));
        when(conversationDao.findByTaskAndParticipants(booking.taskId(), booking.taskerId(), booking.customerId()))
            .thenReturn(Optional.of(conversation));
        when(messageDao.findByConversationId(conversation.id(), null, 50)).thenReturn(List.of(message));

        ResponseEntity<?> response = controller.getDispute(dispute.id());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsKeys("dispute", "booking", "conversation_id", "evidence_messages");
        List<Map<String, Object>> evidence = (List<Map<String, Object>>) body.get("evidence_messages");
        assertThat(evidence).hasSize(1);
        assertThat(evidence.get(0)).containsEntry("content", "Uploaded proof image");
    }

    private Dispute dispute(String status) {
        return new Dispute(
            uuid(1),
            uuid(2),
            uuid(3),
            "dispute reason",
            status,
            null,
            null,
            null,
            Instant.parse("2026-02-17T00:00:00Z"),
            null);
    }

    private BookingState booking(String bookingId) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new BookingState(bookingId, uuid(4), uuid(7), uuid(8), 50000, "ASSIGNED", null, true, now, now);
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    @Test
    void resolveDisputeReturnsReplayMissingWhenCompletedRecordHasNoResource() {
        JwtPrincipal principal = adminPrincipal();
        IdempotencyRecord record = new IdempotencyRecord(
            UUID.fromString(uuid(10)),
            UUID.fromString(uuid(11)),
            IdempotencyOperations.RESOLVE_DISPUTE,
            "idem-1",
            "COMPLETED",
            "DISPUTE",
            null,
            Instant.now(),
            Instant.now());
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESOLVE_DISPUTE, "idem-1"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

        ResponseEntity<?> response = controller.resolveDispute(
            principal, uuid(20), new ResolveRequest("RESOLVE_TASKER", "clear evidence"), "idem-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    private JwtPrincipal adminPrincipal() {
        return new JwtPrincipal(uuid(100), "ADMIN", "ACTIVE");
    }

    @Test
    void resolveDisputeReplaysResolvedDisputeForCompletedClaim() {
        JwtPrincipal principal = adminPrincipal();
        Dispute resolved = new Dispute(
            uuid(30),
            uuid(31),
            uuid(32),
            "evidence mismatch",
            "RESOLVED_TASKER",
            "RESOLVE_TASKER",
            principal.userId(),
            "validated",
            Instant.parse("2026-02-17T00:00:00Z"),
            Instant.parse("2026-02-17T01:00:00Z"));
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESOLVE_DISPUTE, "idem-2"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(resolved.id())));
        when(disputeService.getDispute(resolved.id())).thenReturn(Optional.of(resolved));

        ResponseEntity<?> response = controller.resolveDispute(
            principal, uuid(33), new ResolveRequest("RESOLVE_TASKER", "ignored on replay"), "idem-2");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody())
            .containsEntry("id", resolved.id())
            .containsEntry("status", "RESOLVED_TASKER");
    }

    private IdempotencyRecord completedRecord(String resourceId) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new IdempotencyRecord(
            UUID.fromString(uuid(50)),
            UUID.fromString(uuid(51)),
            IdempotencyOperations.RESOLVE_DISPUTE,
            "idem-complete",
            "COMPLETED",
            "DISPUTE",
            UUID.fromString(resourceId),
            now,
            now);
    }

    @Test
    void resolveDisputeReturnsNotFoundWhenServiceCannotLocateDispute() {
        JwtPrincipal principal = adminPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESOLVE_DISPUTE, "idem-3"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(disputeService.resolveDispute(principal.userId(), uuid(40), "RESOLVE_TASKER", "not found"))
            .thenReturn(DisputeResolutionResult.error("NOT_FOUND"));

        ResponseEntity<?> response = controller.resolveDispute(
            principal, uuid(40), new ResolveRequest("RESOLVE_TASKER", "not found"), "idem-3");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(idempotencyService)
            .abandon(eq(principal.userId()), eq(IdempotencyOperations.RESOLVE_DISPUTE), eq("idem-3"));
    }
}
