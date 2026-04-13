package mn.tasky.messaging.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.messaging.dto.MessageRequest;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.runtime.publicapi.composition.MessagingPublicCompositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations")
@Validated
public class MessagingController {

    private final MessagingCommandPort messagingCommandPort;
    private final MessagingPublicCompositionService messagingPublicCompositionService;

    public MessagingController(
            MessagingCommandPort messagingCommandPort,
            MessagingPublicCompositionService messagingPublicCompositionService) {
        this.messagingCommandPort = messagingCommandPort;
        this.messagingPublicCompositionService = messagingPublicCompositionService;
    }

    @MessageMapping("/conversations/{id}/messages")
    public void sendMessageRealtime(
            @AuthenticationPrincipal JwtPrincipal principal,
            @DestinationVariable String id,
            @Valid MessageRequest body) {
        messagingCommandPort.sendMessage(principal.userId(), id, body.content());
    }

    @GetMapping
    public ResponseEntity<?> listConversations(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        var page = messagingPublicCompositionService.listConversations(principal.userId(), cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> listMessages(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) {
        try {
            var page = messagingPublicCompositionService.listMessages(principal.userId(), id, cursor, limit);
            return ResponseEntity.ok(
                    new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN", "message", "Access denied."));
        }
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody MessageRequest body) {

        try {
            var messageOpt = messagingCommandPort.sendMessage(principal.userId(), id, body.content());
            if (messageOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(201).body(messagingPublicCompositionService.messageResponse(messageOpt.get()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN", "message", "Access denied."));
        }
    }
}
