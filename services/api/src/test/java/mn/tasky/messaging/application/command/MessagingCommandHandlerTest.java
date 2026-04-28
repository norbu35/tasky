package mn.tasky.messaging.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Message;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MessagingCommandHandlerTest {

    @Mock
    private MessagingService messagingService;

    @InjectMocks
    private MessagingCommandHandler handler;

    @Test
    void sendMessageDelegatesToService() {
        Message msg = new Message("msg-1", "conv-1", "sender-1", "hello", false, "hash", null);
        when(messagingService.sendMessage("sender-1", "conv-1", "hello")).thenReturn(Optional.of(msg));

        Optional<Message> result = handler.sendMessage("sender-1", "conv-1", "hello");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("msg-1");
        verify(messagingService).sendMessage("sender-1", "conv-1", "hello");
    }

    @Test
    void sendMessageReturnsEmptyWhenServiceReturnsEmpty() {
        when(messagingService.sendMessage("s", "c", "hi")).thenReturn(Optional.empty());

        Optional<Message> result = handler.sendMessage("s", "c", "hi");

        assertThat(result).isEmpty();
    }

    @Test
    void startConversationDelegatesToService() {
        when(messagingService.startConversation("task-1", "tasker-1", "cust-1")).thenReturn("conv-1");

        String result = handler.startConversation("task-1", "tasker-1", "cust-1");

        assertThat(result).isEqualTo("conv-1");
        verify(messagingService).startConversation("task-1", "tasker-1", "cust-1");
    }
}
