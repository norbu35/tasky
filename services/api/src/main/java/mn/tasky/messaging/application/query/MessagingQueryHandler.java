package mn.tasky.messaging.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import org.springframework.stereotype.Service;

@Service
public class MessagingQueryHandler implements MessagingQueryPort {
    private final MessagingService messagingService;

    public MessagingQueryHandler(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @Override
    public List<EnrichedConversation> listEnrichedConversations(String userId, String cursor, int limit) {
        return messagingService.listEnrichedConversations(userId, cursor, limit);
    }

    @Override
    public List<Message> listMessages(String userId, String conversationId, String cursor, int limit) {
        return messagingService.listMessages(userId, conversationId, cursor, limit);
    }

    @Override
    public Optional<Conversation> findConversationByTaskAndParticipants(
            String taskId, String customerId, String taskerId) {
        return messagingService.findConversationByTaskAndParticipants(taskId, customerId, taskerId);
    }

    @Override
    public List<Message> listMessagesForConversation(String conversationId, String cursor, int limit) {
        return messagingService.listMessagesForConversation(conversationId, cursor, limit);
    }

    @Override
    public List<Message> findFlaggedMessages(String cursor, int limit) {
        return messagingService.findFlaggedMessages(cursor, limit);
    }
}
