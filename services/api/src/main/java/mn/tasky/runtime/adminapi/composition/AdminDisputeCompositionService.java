package mn.tasky.runtime.adminapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import mn.tasky.projection.admin.AdminDisputeQueueProjectionService;
import mn.tasky.projection.admin.AdminDisputeQueueRow;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminDisputeCompositionService {

    private final AdminDisputeQueueProjectionService queueProjectionService;
    private final TrustQueryPort trustQueryPort;
    private final BookingQueryPort bookingQueryPort;
    private final MessagingQueryPort messagingQueryPort;

    public AdminDisputeCompositionService(
            AdminDisputeQueueProjectionService queueProjectionService,
            TrustQueryPort trustQueryPort,
            BookingQueryPort bookingQueryPort,
            MessagingQueryPort messagingQueryPort) {
        this.queueProjectionService = queueProjectionService;
        this.trustQueryPort = trustQueryPort;
        this.bookingQueryPort = bookingQueryPort;
        this.messagingQueryPort = messagingQueryPort;
    }

    public AdminDisputePage pendingDisputes(String cursor, int limit) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<AdminDisputeQueueRow> pending = queueProjectionService.listPending(cursor, clampedLimit + 1);
        boolean hasMore = pending.size() > clampedLimit;
        List<AdminDisputeQueueRow> pageDisputes = hasMore ? pending.subList(0, clampedLimit) : pending;
        List<Map<String, Object>> data =
                pageDisputes.stream().map(this::queueDisputeResponse).toList();
        String nextCursor = hasMore ? pageDisputes.getLast().id() : null;
        return new AdminDisputePage(data, nextCursor, hasMore);
    }

    public Optional<Map<String, Object>> disputeDetail(String disputeId) {
        return trustQueryPort.getDispute(disputeId).map(this::toDisputeDetail);
    }

    private Map<String, Object> toDisputeDetail(Dispute dispute) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("dispute", adminDisputeResponse(dispute));
        body.put(
                "evidence",
                trustQueryPort.getDisputeEvidence(dispute.id()).stream()
                        .map(this::toEvidenceResponse)
                        .toList());

        bookingQueryPort.getBooking(dispute.bookingId()).ifPresent(booking -> {
            Map<String, Object> bookingBody = new LinkedHashMap<>();
            bookingBody.put("id", booking.id());
            bookingBody.put("task_id", booking.taskId());
            bookingBody.put("tasker_id", booking.taskerId());
            bookingBody.put("customer_id", booking.customerId());
            bookingBody.put("status", booking.status());
            bookingBody.put("updated_at", booking.updatedAt().toString());
            body.put("booking", bookingBody);

            messagingQueryPort
                    .findConversationByTaskAndParticipants(booking.taskId(), booking.customerId(), booking.taskerId())
                    .ifPresent(conversation -> {
                        body.put("conversation_id", conversation.id());
                        body.put(
                                "evidence_messages",
                                messagingQueryPort.listMessagesForConversation(conversation.id(), null, 50).stream()
                                        .map(this::toMessageResponse)
                                        .toList());
                    });
        });

        return body;
    }

    public Map<String, Object> adminDisputeResponse(Dispute dispute) {
        return disputeResponse(
                dispute.id(),
                dispute.bookingId(),
                dispute.status(),
                dispute.reason(),
                dispute.createdAt() != null ? dispute.createdAt().toString() : null,
                dispute.raisedBy(),
                dispute.resolutionAction(),
                dispute.wrongfulPartyUserId(),
                dispute.resolutionNotes(),
                dispute.resolvedAt() != null ? dispute.resolvedAt().toString() : null);
    }

    private Map<String, Object> queueDisputeResponse(AdminDisputeQueueRow dispute) {
        return disputeResponse(
                dispute.id(),
                dispute.bookingId(),
                dispute.status(),
                dispute.reason(),
                dispute.createdAt() != null ? dispute.createdAt().toString() : null,
                dispute.raisedBy(),
                dispute.resolutionAction(),
                dispute.wrongfulPartyUserId(),
                dispute.resolutionNotes(),
                dispute.resolvedAt() != null ? dispute.resolvedAt().toString() : null);
    }

    private Map<String, Object> disputeResponse(
            String id,
            String bookingId,
            String status,
            String reason,
            String createdAt,
            String raisedBy,
            String resolutionAction,
            String wrongfulPartyUserId,
            String resolutionNotes,
            String resolvedAt) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", id);
        response.put("booking_id", bookingId);
        response.put("status", status);
        response.put("reason", reason);
        response.put("created_at", createdAt);
        response.put("raised_by", raisedBy);
        response.put("resolution_action", resolutionAction);
        response.put("wrongful_party_user_id", wrongfulPartyUserId);
        response.put("resolution_notes", resolutionNotes);
        response.put("resolved_at", resolvedAt);
        return response;
    }

    private Map<String, Object> toEvidenceResponse(DisputeEvidence evidence) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", evidence.id());
        response.put("type", evidence.type());
        response.put("storage_key", evidence.storageKey());
        response.put("text_payload", evidence.textPayload());
        response.put(
                "created_at",
                evidence.createdAt() != null ? evidence.createdAt().toString() : null);
        return response;
    }

    private Map<String, Object> toMessageResponse(Message message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", message.id());
        response.put("conversation_id", message.conversationId());
        response.put("sender_id", message.senderId());
        response.put("content", message.content());
        response.put("sent_at", message.sentAt().toString());
        return response;
    }
}
