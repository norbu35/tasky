package mn.tasky.admin.api;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/messages")
@Validated
public class AdminMessageController {

    private final MessageDao messageDao;

    public AdminMessageController(MessageDao messageDao) {
        this.messageDao = messageDao;
    }

    /**
     * Lists messages that were flagged as containing a phone number pattern.
     * Results are returned in cursor-paginated order by message ID.
     *
     * @param cursor The pagination cursor (last seen message ID from the previous page).
     * @param limit  The maximum number of results per page (clamped to 1–100, default 50).
     * @return A paginated list of flagged messages.
     */
    @GetMapping("/flagged")
    public ResponseEntity<?> listFlagged(
            @RequestParam(required = false) String cursor, @RequestParam(defaultValue = "50") int limit) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<Message> results = messageDao.findFlagged(cursor, clampedLimit + 1);
        boolean hasMore = results.size() > clampedLimit;
        List<Message> page = hasMore ? results.subList(0, clampedLimit) : results;

        List<Map<String, Object>> data = page.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(new PagedResponse<>(data, CursorPagination.from(results, clampedLimit, Message::id)));
    }

    private Map<String, Object> toResponse(Message message) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", message.id());
        res.put("conversation_id", message.conversationId());
        res.put("sender_id", message.senderId());
        res.put("content", message.content());
        res.put("phone_number_flagged", message.phoneNumberFlagged());
        res.put("sent_at", message.sentAt().toString());
        return res;
    }
}
