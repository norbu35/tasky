package mn.tasky.messaging.publicapi;

import java.util.List;
import java.util.Optional;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;

public interface MessagingQueryPort {
    List<EnrichedConversation> listEnrichedConversations(String userId, String cursor, int limit);

    List<Message> listMessages(String userId, String conversationId, String cursor, int limit);

    Optional<Conversation> findConversationByTaskAndParticipants(String taskId, String customerId, String taskerId);

    List<Message> listMessagesForConversation(String conversationId, String cursor, int limit);

    /**
     * Returns messages flagged for moderation review.
     * Used by admin runtime composition for moderation queue listing.
     */
    List<Message> findFlaggedMessages(String cursor, int limit);
}
