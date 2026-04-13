package mn.tasky.messaging.publicapi;

import java.util.Optional;
import mn.tasky.messaging.dto.Message;

public interface MessagingCommandPort {
    Optional<Message> sendMessage(String senderId, String conversationId, String content);
}
