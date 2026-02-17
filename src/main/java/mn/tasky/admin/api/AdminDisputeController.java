package mn.tasky.admin.api;

import jakarta.validation.Valid;
import mn.tasky.admin.dto.ResolveRequest;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/disputes")
@Validated
public class AdminDisputeController {

    private final DisputeService disputeService;
    private final BookingService bookingService;
    private final ConversationDao conversationDao;
    private final MessageDao messageDao;

    public AdminDisputeController(
        DisputeService disputeService,
        BookingService bookingService,
        ConversationDao conversationDao,
        MessageDao messageDao
    ) {
        this.disputeService = disputeService;
        this.bookingService = bookingService;
        this.conversationDao = conversationDao;
        this.messageDao = messageDao;
    }

    @GetMapping
    public ResponseEntity<?> listPending(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "50") int limit
    ) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<Dispute> pending = disputeService.listPendingDisputes(cursor, clampedLimit);
        List<Map<String, Object>> data = pending.stream()
            .map(this::toDisputeResponse)
            .toList();
        return ResponseEntity.ok(new PagedResponse<>(data, CursorPagination.from(pending, clampedLimit, Dispute::id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDispute(@PathVariable String id) {
        return disputeService.getDispute(id)
            .<ResponseEntity<?>>map(dispute -> {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("dispute", toDisputeResponse(dispute));

                bookingService.getBooking(dispute.bookingId()).ifPresent(booking -> {
                    Map<String, Object> bookingBody = new LinkedHashMap<>();
                    bookingBody.put("id", booking.id());
                    bookingBody.put("task_id", booking.taskId());
                    bookingBody.put("tasker_id", booking.taskerId());
                    bookingBody.put("customer_id", booking.customerId());
                    bookingBody.put("status", booking.status());
                    bookingBody.put("updated_at", booking.updatedAt().toString());
                    body.put("booking", bookingBody);

                    conversationDao.findByTaskAndParticipants(booking.taskId(), booking.taskerId(), booking.customerId())
                        .ifPresent(conversation -> {
                            body.put("conversation_id", conversation.id());
                            List<Map<String, Object>> evidence = messageDao.findByConversationId(conversation.id(), null, 50)
                                .stream()
                                .map(this::toMessageResponse)
                                .toList();
                            body.put("evidence_messages", evidence);
                        });
                });

                return ResponseEntity.ok(body);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ResolveRequest body) {
        
        var result = disputeService.resolveDispute(principal.userId(), id, body.outcome(), body.notes());
        if (!result.isSuccess()) {
            if ("NOT_FOUND".equals(result.error())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", result.error()));
        }
        return ResponseEntity.ok(toDisputeResponse(result.dispute()));
    }

    private Map<String, Object> toDisputeResponse(Dispute d) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", d.id());
        res.put("booking_id", d.bookingId());
        res.put("status", d.status());
        res.put("reason", d.reason());
        res.put("raiser_id", d.raiserId());
        res.put("outcome", d.outcome());
        res.put("resolution_notes", d.resolutionNotes());
        res.put("created_at", d.createdAt().toString());
        res.put("resolved_at", d.resolvedAt() != null ? d.resolvedAt().toString() : null);
        return res;
    }

    private Map<String, Object> toMessageResponse(Message message) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", message.id());
        res.put("sender_id", message.senderId());
        res.put("content", message.content());
        res.put("sent_at", message.sentAt().toString());
        return res;
    }
}
