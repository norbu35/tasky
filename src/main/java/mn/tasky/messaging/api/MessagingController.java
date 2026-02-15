package mn.tasky.messaging.api;

import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.dto.MessageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/conversations")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @MessageMapping("/conversations/{id}/messages")
    public void sendMessageRealtime(
            @AuthenticationPrincipal JwtPrincipal principal,
            @DestinationVariable String id,
            MessageRequest body) {
        messagingService.sendMessage(principal.userId(), id, body.content());
    }

    @GetMapping
    public ResponseEntity<?> listConversations(@AuthenticationPrincipal JwtPrincipal principal) {
        List<Conversation> conversations = messagingService.listConversations(principal.userId());
        List<Map<String, Object>> data = conversations.stream()
            .map(this::toConversationResponse)
            .toList();
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(null, false)));
    }

    private Map<String, Object> toConversationResponse(Conversation c) {
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
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<Message> messages = messagingService.listMessages(principal.userId(), id, cursor, limit);
            List<Map<String, Object>> data = messages.stream()
                .map(this::toMessageResponse)
                .toList();

            return ResponseEntity.ok(
                new PagedResponse<>(data, CursorPagination.from(messages, limit, Message::id))
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
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

    private Map<String, Object> toMessageResponse(Message message) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", message.id());
        res.put("conversation_id", message.conversationId());
        res.put("sender_id", message.senderId());
        res.put("content", message.content());
        res.put("sent_at", message.sentAt().toString());
        return res;
    }

}
