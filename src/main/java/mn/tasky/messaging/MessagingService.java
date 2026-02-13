package mn.tasky.messaging;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class MessagingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<String, Conversation> conversationsById = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<Message>> messagesByConversationId = new ConcurrentHashMap<>();

    public MessagingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public String startConversation(String taskId, String taskerId, String customerId) {
        // Check if exists
        Optional<Conversation> existing = conversationsById.values().stream()
            .filter(c -> c.taskId().equals(taskId) && 
                         ((c.participant1Id().equals(taskerId) && c.participant2Id().equals(customerId)) ||
                          (c.participant1Id().equals(customerId) && c.participant2Id().equals(taskerId))))
            .findFirst();
        
        if (existing.isPresent()) {
            return existing.get().id();
        }

        Conversation conversation = new Conversation(
            UUID.randomUUID().toString(),
            taskId,
            taskerId,
            customerId,
            Instant.now()
        );
        conversationsById.put(conversation.id(), conversation);
        return conversation.id();
    }

    public List<Conversation> listConversations(String userId) {
        return conversationsById.values().stream()
            .filter(c -> c.participant1Id().equals(userId) || c.participant2Id().equals(userId))
            .sorted(Comparator.comparing(Conversation::createdAt).reversed())
            .toList();
    }

    public Optional<Message> sendMessage(String senderId, String conversationId, String content) {
        Conversation conversation = conversationsById.get(conversationId);
        if (conversation == null) {
            return Optional.empty();
        }

        if (!conversation.participant1Id().equals(senderId) && !conversation.participant2Id().equals(senderId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        Message message = new Message(
            UUID.randomUUID().toString(),
            conversationId,
            senderId,
            content,
            Instant.now()
        );

        messagesByConversationId.computeIfAbsent(conversationId, k -> new ArrayList<>()).add(message);
        
        // Deliver in real-time
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);
        
        return Optional.of(message);
    }

    public List<Message> listMessages(String userId, String conversationId, String cursor, int limit) {
        Conversation conversation = conversationsById.get(conversationId);
        if (conversation == null) {
            throw new IllegalArgumentException("Conversation not found");
        }

        if (!conversation.participant1Id().equals(userId) && !conversation.participant2Id().equals(userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        List<Message> messages = messagesByConversationId.getOrDefault(conversationId, List.of());
        return messages.stream()
            .filter(m -> cursor == null || m.id().compareTo(cursor) > 0)
            .sorted(Comparator.comparing(Message::id))
            .limit(limit)
            .toList();
    }

    public record Conversation(
        String id,
        String taskId,
        String participant1Id,
        String participant2Id,
        Instant createdAt
    ) {}

    public record Message(
        String id,
        String conversationId,
        String senderId,
        String content,
        Instant sentAt
    ) {}
}
