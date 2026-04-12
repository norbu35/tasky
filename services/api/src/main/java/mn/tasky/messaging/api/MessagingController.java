package mn.tasky.messaging.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.dto.MessageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations")
@Validated
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @MessageMapping("/conversations/{id}/messages")
    public void sendMessageRealtime(
            @AuthenticationPrincipal JwtPrincipal principal,
            @DestinationVariable String id,
            @Valid MessageRequest body) {
        messagingService.sendMessage(principal.userId(), id, body.content());
    }

    @GetMapping
    public ResponseEntity<?> listConversations(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        List<EnrichedConversation> conversations =
                messagingService.listEnrichedConversations(principal.userId(), cursor, limit + 1);
        boolean hasMore = conversations.size() > limit;
        List<EnrichedConversation> pageData = hasMore ? conversations.subList(0, limit) : conversations;

        String nextCursor = null;
        if (hasMore) {
            EnrichedConversation last = pageData.getLast();
            Instant cursorTime = last.lastMessageAt() != null ? last.lastMessageAt() : last.createdAt();
            nextCursor = cursorTime.toString();
        }

        List<Map<String, Object>> data =
                pageData.stream().map(this::toEnrichedResponse).toList();
        return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(nextCursor, hasMore)));
    }

    private Map<String, Object> toEnrichedResponse(EnrichedConversation c) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", c.id());
        res.put("task_id", c.taskId());
        res.put("task_title", truncate(c.taskDescription(), 80));
        res.put("counterparty_id", c.counterpartyId());
        res.put("counterparty_name", c.counterpartyName());
        res.put("counterparty_avatar_url", c.counterpartyAvatarUrl());
        res.put(
                "counterparty_last_active_at",
                c.counterpartyLastActiveAt() != null
                        ? c.counterpartyLastActiveAt().toString()
                        : null);
        res.put("last_message_content", truncate(c.lastMessageContent(), 100));
        res.put("last_message_at", c.lastMessageAt() != null ? c.lastMessageAt().toString() : null);
        res.put("unread_count", c.unreadCount());
        res.put("created_at", c.createdAt().toString());
        return res;
    }

    private static String truncate(String text, int maxLen) {
        if (text == null || text.length() <= maxLen) return text;
        int breakAt = text.lastIndexOf(' ', maxLen);
        if (breakAt <= 0) breakAt = maxLen;
        return text.substring(0, breakAt) + "\u2026";
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> listMessages(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        try {
            List<Message> messages = messagingService.listMessages(principal.userId(), id, cursor, limit + 1);
            boolean hasMore = messages.size() > limit;
            List<Message> pageMessages = hasMore ? messages.subList(0, limit) : messages;
            List<Map<String, Object>> data =
                    pageMessages.stream().map(this::toMessageResponse).toList();

            return ResponseEntity.ok(new PagedResponse<>(data, CursorPagination.from(messages, limit, Message::id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN", "message", "Access denied."));
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

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody MessageRequest body) {

        try {
            var messageOpt = messagingService.sendMessage(principal.userId(), id, body.content());
            if (messageOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(201).body(toMessageResponse(messageOpt.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN", "message", "Access denied."));
        }
    }
}
