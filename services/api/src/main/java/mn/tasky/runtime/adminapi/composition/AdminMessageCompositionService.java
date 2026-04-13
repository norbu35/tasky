package mn.tasky.runtime.adminapi.composition;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminMessageCompositionService {

    private final MessagingQueryPort messagingQueryPort;

    public AdminMessageCompositionService(MessagingQueryPort messagingQueryPort) {
        this.messagingQueryPort = messagingQueryPort;
    }

    public AdminMessagePage listFlagged(String cursor, int limit) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<Message> results = messagingQueryPort.findFlaggedMessages(cursor, clampedLimit + 1);
        boolean hasMore = results.size() > clampedLimit;
        List<Message> page = hasMore ? results.subList(0, clampedLimit) : results;
        List<Map<String, Object>> data =
                page.stream().map(this::messageResponse).toList();
        String nextCursor = hasMore ? page.getLast().id() : null;
        return new AdminMessagePage(data, nextCursor, hasMore);
    }

    private Map<String, Object> messageResponse(Message message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", message.id());
        response.put("conversation_id", message.conversationId());
        response.put("sender_id", message.senderId());
        response.put("content", message.content());
        response.put("phone_number_flagged", message.phoneNumberFlagged());
        response.put("sent_at", message.sentAt().toString());
        return response;
    }
}
