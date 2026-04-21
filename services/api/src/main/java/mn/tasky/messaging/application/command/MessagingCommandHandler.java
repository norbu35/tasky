package mn.tasky.messaging.application.command;

import java.util.Optional;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import org.springframework.stereotype.Service;

@Service
public class MessagingCommandHandler implements MessagingCommandPort {
    private final MessagingService messagingService;

    public MessagingCommandHandler(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @Override
    public Optional<Message> sendMessage(String senderId, String conversationId, String content) {
        return messagingService.sendMessage(senderId, conversationId, content);
    }

    @Override
    public String startConversation(String taskId, String taskerId, String customerId) {
        return messagingService.startConversation(taskId, taskerId, customerId);
    }
}
