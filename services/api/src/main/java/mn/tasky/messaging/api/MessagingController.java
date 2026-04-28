package mn.tasky.messaging.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import mn.tasky.api.generated.ConversationsApi;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.messaging.dto.MessageRequest;
import mn.tasky.messaging.publicapi.MessagingCommandPort;
import mn.tasky.runtime.publicapi.composition.MessagingPublicCompositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1/conversations")
@Validated
@SuppressWarnings("unchecked")
public class MessagingController implements ConversationsApi {

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
            @org.springframework.security.core.annotation.AuthenticationPrincipal JwtPrincipal principal,
            @DestinationVariable String id,
            @Valid MessageRequest body) {
        messagingCommandPort.sendMessage(principal.userId(), id, body.content());
    }

    @Override
    @GetMapping
    public ResponseEntity<mn.tasky.api.generated.model.ListConversations200Response> listConversations(
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        JwtPrincipal principal = getPrincipal();
        var page = messagingPublicCompositionService.listConversations(principal.userId(), cursor, limit);
        var result = ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
        return (ResponseEntity<mn.tasky.api.generated.model.ListConversations200Response>) (ResponseEntity<?>) result;
    }

    @Override
    @GetMapping("/{id}/messages")
    public ResponseEntity<mn.tasky.api.generated.model.ListMessages200Response> listMessages(
            @PathVariable("id") UUID id,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        try {
            var page = messagingPublicCompositionService.listMessages(principal.userId(), id.toString(), cursor, limit);
            var result = ResponseEntity.ok(
                    new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
            return (ResponseEntity<mn.tasky.api.generated.model.ListMessages200Response>) (ResponseEntity<?>) result;
        } catch (IllegalArgumentException e) {
            return (ResponseEntity<mn.tasky.api.generated.model.ListMessages200Response>) (ResponseEntity<?>)
                    ResponseEntity.status(403).body(errorBody("FORBIDDEN", "Access denied.", request));
        }
    }

    @Override
    @PostMapping(
            value = "/{id}/messages",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.Message> sendMessage(
            @PathVariable("id") UUID id,
            @Valid @RequestBody mn.tasky.api.generated.model.SendMessageRequest sendMessageRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        try {
            var messageOpt = messagingCommandPort.sendMessage(
                    principal.userId(), id.toString(), sendMessageRequest.getContent());
            if (messageOpt.isEmpty()) {
                return (ResponseEntity<mn.tasky.api.generated.model.Message>) (ResponseEntity<?>)
                        ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Conversation not found.", request));
            }
            return (ResponseEntity<mn.tasky.api.generated.model.Message>) (ResponseEntity<?>) ResponseEntity.status(201)
                    .body(messagingPublicCompositionService.messageResponse(messageOpt.get()));
        } catch (IllegalArgumentException e) {
            return (ResponseEntity<mn.tasky.api.generated.model.Message>) (ResponseEntity<?>)
                    ResponseEntity.status(403).body(errorBody("FORBIDDEN", "Access denied.", request));
        }
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private HttpServletRequest getRequest() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
