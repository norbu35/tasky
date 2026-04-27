package mn.tasky.runtime.publicapi.composition;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import org.springframework.stereotype.Component;

@Component
public class MessagingPublicCompositionService {

    private final MessagingQueryPort messagingQueryPort;

    public MessagingPublicCompositionService(MessagingQueryPort messagingQueryPort) {
        this.messagingQueryPort = messagingQueryPort;
    }

    public MessagingConversationPage listConversations(String userId, String cursor, int limit) {
        List<EnrichedConversation> conversations =
                messagingQueryPort.listEnrichedConversations(userId, cursor, limit + 1);
        boolean hasMore = conversations.size() > limit;
        List<EnrichedConversation> pageData = hasMore ? conversations.subList(0, limit) : conversations;
        String nextCursor = null;
        if (hasMore) {
            EnrichedConversation last = pageData.getLast();
            Instant cursorTime = last.lastMessageAt() != null ? last.lastMessageAt() : last.createdAt();
            nextCursor = cursorTime.toString();
        }
        List<Map<String, Object>> data =
                pageData.stream().map(this::conversationResponse).toList();
        return new MessagingConversationPage(data, nextCursor, hasMore);
    }

    public MessagingMessagePage listMessages(String userId, String conversationId, String cursor, int limit) {
        List<Message> messages = messagingQueryPort.listMessages(userId, conversationId, cursor, limit + 1);
        boolean hasMore = messages.size() > limit;
        List<Message> pageMessages = hasMore ? messages.subList(0, limit) : messages;
        List<Map<String, Object>> data =
                pageMessages.stream().map(this::messageResponse).toList();
        String nextCursor = hasMore ? messageCursor(pageMessages.getLast()) : null;
        return new MessagingMessagePage(data, nextCursor, hasMore);
    }

    public Map<String, Object> messageResponse(Message message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", message.id());
        response.put("conversation_id", message.conversationId());
        response.put("sender_id", message.senderId());
        response.put("content", message.content());
        response.put("sent_at", message.sentAt().toString());
        return response;
    }

    private static String messageCursor(Message message) {
        return message.sentAt().toString() + "|" + message.id();
    }

    private Map<String, Object> conversationResponse(EnrichedConversation conversation) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", conversation.id());
        response.put("task_id", conversation.taskId());
        response.put("task_title", truncate(conversation.taskDescription(), 80));
        response.put("counterparty_id", conversation.counterpartyId());
        response.put("counterparty_name", conversation.counterpartyName());
        response.put("counterparty_avatar_url", conversation.counterpartyAvatarUrl());
        response.put(
                "counterparty_last_active_at",
                conversation.counterpartyLastActiveAt() != null
                        ? conversation.counterpartyLastActiveAt().toString()
                        : null);
        response.put("last_message_content", truncate(conversation.lastMessageContent(), 100));
        response.put(
                "last_message_at",
                conversation.lastMessageAt() != null
                        ? conversation.lastMessageAt().toString()
                        : null);
        response.put("unread_count", conversation.unreadCount());
        response.put("created_at", conversation.createdAt().toString());
        return response;
    }

    private static String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        int breakAt = text.lastIndexOf(' ', maxLength);
        if (breakAt <= 0) {
            breakAt = maxLength;
        }
        return text.substring(0, breakAt) + "…";
    }
}
