package mn.tasky.messaging.application;

import mn.tasky.common.validation.TextSanitizer;
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

/**
 * Service for managing real-time chat conversations between taskers and customers.
 * Handles the creation of conversations, sending messages, and retrieving message history.
 */
@Service
public class MessagingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationDao conversationDao;
    private final MessageDao messageDao;

    public MessagingService(
        SimpMessagingTemplate messagingTemplate, ConversationDao conversationDao, MessageDao messageDao) {
        this.messagingTemplate = messagingTemplate;
        this.conversationDao = conversationDao;
        this.messageDao = messageDao;
    }

    /**
     * Starts a new conversation between a tasker and customer for a specific task.
     * Returns the existing conversation ID if one already exists.
     *
     * @param taskId     The ID of the task the conversation is about.
     * @param taskerId   The ID of the tasker.
     * @param customerId The ID of the customer.
     * @return The ID of the conversation.
     */
    public String startConversation(String taskId, String taskerId, String customerId) {
        Optional<Conversation> existing = conversationDao.findByTaskAndParticipants(taskId, taskerId, customerId);

        if (existing.isPresent()) {
            return existing.get().id();
        }

        String id = UUID.randomUUID().toString();
        conversationDao.insert(id, taskId, taskerId, customerId, Instant.now());
        return id;
    }

    /**
     * Lists the first page of conversations for a user.
     *
     * @param userId The ID of the user.
     * @return A list of {@link Conversation} objects.
     */
    public List<Conversation> listConversations(String userId) {
        return listConversations(userId, null, 50);
    }

    /**
     * Lists conversations for a user with pagination.
     *
     * @param userId The ID of the user.
     * @param cursor The pagination cursor.
     * @param limit  The maximum number of results.
     * @return A list of {@link Conversation} objects.
     */
    public List<Conversation> listConversations(String userId, String cursor, int limit) {
        return conversationDao.findByUserId(userId, cursor, limit);
    }

    /**
     * Sends a message in a conversation.
     * Returns empty when the conversation does not exist.
     * Validates that the sender is a participant and the content is not empty,
     * and broadcasts the message over WebSocket on success.
     *
     * @param senderId       The ID of the sender.
     * @param conversationId The ID of the conversation.
     * @param content        The message content.
     * @return An Optional containing the sent {@link Message}, or empty when the conversation is
     * missing.
     * @throws IllegalArgumentException if the sender is not a participant or the content is blank.
     */
    public Optional<Message> sendMessage(String senderId, String conversationId, String content) {
        Optional<Conversation> conversation = conversationDao.findById(conversationId);
        if (conversation.isEmpty()) {
            return Optional.empty();
        }

        Conversation conv = conversation.get();
        if (!conv.participant1Id().equals(senderId) && !conv.participant2Id().equals(senderId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        String sanitizedContent = TextSanitizer.plainText(content);
        if (sanitizedContent == null || sanitizedContent.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        Message message =
            new Message(UUID.randomUUID().toString(), conversationId, senderId, sanitizedContent, Instant.now());

        messageDao.insert(
            message.id(), message.conversationId(), message.senderId(), message.content(), message.sentAt());

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);

        return Optional.of(message);
    }

    /**
     * Lists messages in a conversation with pagination.
     * Validates that the requester is a participant in the conversation.
     *
     * @param userId         The ID of the user requesting messages.
     * @param conversationId The ID of the conversation.
     * @param cursor         The pagination cursor.
     * @param limit          The maximum number of results.
     * @return A list of {@link Message} objects.
     * @throws IllegalArgumentException if the conversation is not found or the user is not a
     *                                  participant.
     */
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
