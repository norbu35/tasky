package mn.tasky.messaging.publicapi;

import java.util.Optional;
import mn.tasky.messaging.dto.Message;

public interface MessagingCommandPort {
    Optional<Message> sendMessage(String senderId, String conversationId, String content);

    /**
     * Create or reuse a conversation between customer and tasker for a task.
     * Returns the conversation ID.
     */
    String startConversation(String taskId, String taskerId, String customerId);
}
