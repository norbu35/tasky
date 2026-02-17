package mn.tasky.messaging.application;

import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MessagingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationDao conversationDao;
    private final MessageDao messageDao;

    public MessagingService(SimpMessagingTemplate messagingTemplate,
                           ConversationDao conversationDao,
                           MessageDao messageDao) {
        this.messagingTemplate = messagingTemplate;
        this.conversationDao = conversationDao;
        this.messageDao = messageDao;
    }

    public String startConversation(String taskId, String taskerId, String customerId) {
        Optional<Conversation> existing = conversationDao.findByTaskAndParticipants(taskId, taskerId, customerId);

        if (existing.isPresent()) {
            return existing.get().id();
        }

        String id = UUID.randomUUID().toString();
        conversationDao.insert(id, taskId, taskerId, customerId, Instant.now());
        return id;
    }

    public List<Conversation> listConversations(String userId) {
        return conversationDao.findByUserId(userId);
    }

    public Optional<Message> sendMessage(String senderId, String conversationId, String content) {
        Optional<Conversation> conversation = conversationDao.findById(conversationId);
        if (conversation.isEmpty()) {
            return Optional.empty();
        }

        Conversation conv = conversation.get();
        if (!conv.participant1Id().equals(senderId) && !conv.participant2Id().equals(senderId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        Message message = new Message(
            UUID.randomUUID().toString(),
            conversationId,
            senderId,
            content,
            Instant.now()
        );

        messageDao.insert(message.id(), message.conversationId(), message.senderId(),
                         message.content(), message.sentAt());

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);

        return Optional.of(message);
    }

    public List<Message> listMessages(String userId, String conversationId, String cursor, int limit) {
        Optional<Conversation> conversation = conversationDao.findById(conversationId);
        if (conversation.isEmpty()) {
            throw new IllegalArgumentException("Conversation not found");
        }

        Conversation conv = conversation.get();
        if (!conv.participant1Id().equals(userId) && !conv.participant2Id().equals(userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        return messageDao.findByConversationId(conversationId, cursor, limit);
    }

}
