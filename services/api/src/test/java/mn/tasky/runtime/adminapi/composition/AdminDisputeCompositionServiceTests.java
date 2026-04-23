package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import mn.tasky.projection.admin.AdminDisputeQueueProjectionService;
import mn.tasky.projection.admin.AdminDisputeQueueRow;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminDisputeCompositionServiceTests {

    @Mock
    private AdminDisputeQueueProjectionService queueProjectionService;

    @Mock
    private TrustQueryPort trustQueryPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private MessagingQueryPort messagingQueryPort;

    private AdminDisputeCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminDisputeCompositionService(
                queueProjectionService, trustQueryPort, bookingQueryPort, messagingQueryPort);
    }

    @Nested
    @DisplayName("pendingDisputes")
    class PendingDisputesTests {

        @Test
        @DisplayName("returns page of pending disputes from projection")
        void pendingDisputes_returnsPage() {
            AdminDisputeQueueRow row1 = buildQueueRow("d1");
            AdminDisputeQueueRow row2 = buildQueueRow("d2");
            when(queueProjectionService.listPending(null, 3)).thenReturn(List.of(row1, row2));

            AdminDisputePage page = service.pendingDisputes(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
            assertThat(page.data().getFirst()).containsEntry("id", "d1");
        }

        @Test
        @DisplayName("sets hasMore and nextCursor when extra row exists")
        void pendingDisputes_hasMore() {
            AdminDisputeQueueRow row1 = buildQueueRow("d1");
            AdminDisputeQueueRow row2 = buildQueueRow("d2");
            AdminDisputeQueueRow row3 = buildQueueRow("d3");
            when(queueProjectionService.listPending(null, 3)).thenReturn(List.of(row1, row2, row3));

            AdminDisputePage page = service.pendingDisputes(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo("d2");
        }

        @Test
        @DisplayName("returns empty page when no pending disputes")
        void pendingDisputes_empty() {
            when(queueProjectionService.listPending(null, 3)).thenReturn(Collections.emptyList());

            AdminDisputePage page = service.pendingDisputes(null, 2);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("clamps limit to max 100")
        void pendingDisputes_clampsLimit() {
            when(queueProjectionService.listPending(null, 101)).thenReturn(Collections.emptyList());

            AdminDisputePage page = service.pendingDisputes(null, 200);

            assertThat(page.data()).isEmpty();
        }

        @Test
        @DisplayName("clamps limit to min 1")
        void pendingDisputes_clampsMinLimit() {
            when(queueProjectionService.listPending(null, 2)).thenReturn(Collections.emptyList());

            AdminDisputePage page = service.pendingDisputes(null, 0);

            assertThat(page.data()).isEmpty();
        }
    }

    @Nested
    @DisplayName("disputeDetail")
    class DisputeDetailTests {

        @Test
        @DisplayName("returns dispute detail with evidence, booking, and messages")
        void disputeDetail_fullResponse() {
            Dispute dispute = buildDispute("d1", "b1");
            when(trustQueryPort.getDispute("d1")).thenReturn(Optional.of(dispute));
            when(trustQueryPort.getDisputeEvidence("d1")).thenReturn(List.of(buildEvidence("e1")));
            when(bookingQueryPort.getBooking("b1")).thenReturn(Optional.of(buildBooking("b1")));
            when(messagingQueryPort.findConversationByTaskAndParticipants("task-1", "customer-1", "tasker-1"))
                    .thenReturn(
                            Optional.of(new Conversation("conv-1", "task-1", "customer-1", "tasker-1", Instant.now())));
            when(messagingQueryPort.listMessagesForConversation("conv-1", null, 50))
                    .thenReturn(List.of(buildMessage("m1")));

            Optional<java.util.Map<String, Object>> result = service.disputeDetail("d1");

            assertThat(result).isPresent();
            java.util.Map<String, Object> body = result.get();
            assertThat(body).containsKey("dispute");
            assertThat(body).containsKey("evidence");
            assertThat(body).containsKey("booking");
            assertThat(body).containsKey("conversation_id");
            assertThat(body).containsKey("evidence_messages");
        }

        @Test
        @DisplayName("returns dispute detail without booking if booking not found")
        void disputeDetail_noBooking() {
            Dispute dispute = buildDispute("d1", "b1");
            when(trustQueryPort.getDispute("d1")).thenReturn(Optional.of(dispute));
            when(trustQueryPort.getDisputeEvidence("d1")).thenReturn(Collections.emptyList());
            when(bookingQueryPort.getBooking("b1")).thenReturn(Optional.empty());

            Optional<java.util.Map<String, Object>> result = service.disputeDetail("d1");

            assertThat(result).isPresent();
            java.util.Map<String, Object> body = result.get();
            assertThat(body).containsKey("dispute");
            assertThat(body).containsKey("evidence");
            assertThat(body).doesNotContainKey("booking");
            assertThat(body).doesNotContainKey("conversation_id");
            verifyNoInteractions(messagingQueryPort);
        }

        @Test
        @DisplayName("returns empty when dispute not found")
        void disputeDetail_notFound() {
            when(trustQueryPort.getDispute("missing")).thenReturn(Optional.empty());

            Optional<java.util.Map<String, Object>> result = service.disputeDetail("missing");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("dispute detail omits messages when conversation not found")
        void disputeDetail_noConversation() {
            Dispute dispute = buildDispute("d1", "b1");
            when(trustQueryPort.getDispute("d1")).thenReturn(Optional.of(dispute));
            when(trustQueryPort.getDisputeEvidence("d1")).thenReturn(Collections.emptyList());
            when(bookingQueryPort.getBooking("b1")).thenReturn(Optional.of(buildBooking("b1")));
            when(messagingQueryPort.findConversationByTaskAndParticipants("task-1", "customer-1", "tasker-1"))
                    .thenReturn(Optional.empty());

            Optional<java.util.Map<String, Object>> result = service.disputeDetail("d1");

            assertThat(result).isPresent();
            assertThat(result.get()).containsKey("booking");
            assertThat(result.get()).doesNotContainKey("conversation_id");
        }
    }

    @Nested
    @DisplayName("adminDisputeResponse")
    class AdminDisputeResponseTests {

        @Test
        @DisplayName("maps dispute record to response map")
        void adminDisputeResponse_mapsFields() {
            Dispute dispute = buildDispute("d1", "b1");

            java.util.Map<String, Object> response = service.adminDisputeResponse(dispute);

            assertThat(response).containsEntry("id", "d1");
            assertThat(response).containsEntry("booking_id", "b1");
            assertThat(response).containsEntry("status", "OPEN");
            assertThat(response).containsEntry("reason", "reason");
            assertThat(response).containsEntry("raised_by", "user-1");
        }
    }

    private AdminDisputeQueueRow buildQueueRow(String id) {
        return new AdminDisputeQueueRow(id, "b1", "user-1", "reason", "OPEN", null, null, null, Instant.now(), null);
    }

    private Dispute buildDispute(String id, String bookingId) {
        return new Dispute(id, bookingId, "user-1", "reason", "OPEN", null, null, null, Instant.now(), null);
    }

    private DisputeEvidence buildEvidence(String id) {
        return new DisputeEvidence(id, "d1", "TEXT", null, "some text", Instant.now());
    }

    private BookingState buildBooking(String id) {
        return new BookingState(
                id,
                "task-1",
                "tasker-1",
                "customer-1",
                5000,
                "CONFIRMED",
                null,
                true,
                Instant.now(),
                "DIRECT",
                false,
                Instant.now(),
                0,
                null,
                Instant.now(),
                Instant.now());
    }

    private Message buildMessage(String id) {
        return new Message(id, "conv-1", "sender-1", "hello", false, "hash1", Instant.now());
    }
}
