package mn.tasky.messaging;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @GetMapping
    public ResponseEntity<?> listConversations(@AuthenticationPrincipal JwtPrincipal principal) {
        List<MessagingService.Conversation> conversations = messagingService.listConversations(principal.userId());
        List<Map<String, Object>> data = conversations.stream()
            .map(this::toConversationResponse)
            .toList();
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
    }

    private Map<String, Object> toConversationResponse(MessagingService.Conversation c) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", c.id());
        res.put("task_id", c.taskId());
        res.put("participant_1_id", c.participant1Id());
        res.put("participant_2_id", c.participant2Id());
        res.put("created_at", c.createdAt().toString());
        return res;
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> listMessages(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id) {
        try {
            List<MessagingService.Message> messages = messagingService.listMessages(principal.userId(), id);
            List<Map<String, Object>> data = messages.stream()
                .map(this::toMessageResponse)
                .toList();
            return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage())); // Or 404 depending on error
        }
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestBody MessageRequest body) {
        
        try {
            var messageOpt = messagingService.sendMessage(principal.userId(), id, body.content());
            if (messageOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(201).body(toMessageResponse(messageOpt.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toMessageResponse(MessagingService.Message message) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", message.id());
        res.put("conversation_id", message.conversationId());
        res.put("sender_id", message.senderId());
        res.put("content", message.content());
        res.put("sent_at", message.sentAt().toString());
        return res;
    }

    public record MessageRequest(String content) {}
}
