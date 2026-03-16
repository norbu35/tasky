package mn.tasky.messaging;

import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.messaging.api.MessagingController;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.dto.MessageRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessagingControllerUnitTests {

    @Mock
    private MessagingService messagingService;

    private MessagingController controller;

    @BeforeEach
    void setUp() {
        controller = new MessagingController(messagingService);
    }

    @Test
    void sendMessageRealtimeDelegatesToService() {
        JwtPrincipal principal = principal();

        controller.sendMessageRealtime(principal,
            uuid(1),
            new MessageRequest("hello"));

        verify(messagingService).sendMessage(principal.userId(),
            uuid(1),
            "hello");
    }

    private JwtPrincipal principal() {
        return new JwtPrincipal(uuid(100),
            "TASKER",
            "ACTIVE");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d",
            suffix);
    }

    @Test
    void listMessagesReturnsForbiddenOnAuthorizationError() {
        JwtPrincipal principal = principal();
        when(messagingService.listMessages(principal.userId(),
            uuid(2),
            null,
            51))
            .thenThrow(new IllegalArgumentException("not participant"));

        ResponseEntity<?> response = controller.listMessages(principal,
            uuid(2),
            null,
            50);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "FORBIDDEN");
    }

    @Test
    void sendMessageReturnsNotFoundWhenConversationMissing() {
        JwtPrincipal principal = principal();
        when(messagingService.sendMessage(principal.userId(),
            uuid(3),
            "hello")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.sendMessage(principal,
            uuid(3),
            new MessageRequest("hello"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void sendMessageReturnsCreatedWhenPersisted() {
        JwtPrincipal principal = principal();
        Message message =
            new Message(uuid(4),
                uuid(5),
                principal.userId(),
                "saved",
                false,
                null,
                Instant.parse("2026-02-17T00:00:00Z"));
        when(messagingService.sendMessage(principal.userId(),
            message.conversationId(),
            "saved"))
            .thenReturn(Optional.of(message));

        ResponseEntity<?> response =
            controller.sendMessage(principal,
                message.conversationId(),
                new MessageRequest("saved"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id",
            message.id());
    }
}
