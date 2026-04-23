package mn.tasky.messaging.application.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MessagingQueryHandlerTest {

    @Mock
    private MessagingService messagingService;

    private MessagingQueryHandler handler;

    @BeforeEach
    void setUp() {
        handler = new MessagingQueryHandler(messagingService);
    }

    @Test
    void listEnrichedConversations_delegatesToMessagingService() {
        EnrichedConversation conv = new EnrichedConversation(
                "conv1", "t1", "desc", "u2", "Bob", null, null, "hello", Instant.now(), 1, Instant.now());
        List<EnrichedConversation> expected = List.of(conv);
        when(messagingService.listEnrichedConversations("u1", null, 20)).thenReturn(expected);

        List<EnrichedConversation> result = handler.listEnrichedConversations("u1", null, 20);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void listMessages_delegatesToMessagingService() {
        Message msg = new Message("m1", "conv1", "u1", "hi", false, "hash1", Instant.now());
        List<Message> expected = List.of(msg);
        when(messagingService.listMessages("u1", "conv1", null, 20)).thenReturn(expected);

        List<Message> result = handler.listMessages("u1", "conv1", null, 20);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void findConversationByTaskAndParticipants_delegatesToMessagingService() {
        Conversation conv = new Conversation("conv1", "t1", "c1", "tasker1", Instant.now());
        when(messagingService.findConversationByTaskAndParticipants("t1", "c1", "tasker1"))
                .thenReturn(Optional.of(conv));

        Optional<Conversation> result = handler.findConversationByTaskAndParticipants("t1", "c1", "tasker1");

        assertThat(result).isPresent();
        assertThat(result.get()).isSameAs(conv);
    }

    @Test
    void findConversationByTaskAndParticipants_returnsEmpty() {
        when(messagingService.findConversationByTaskAndParticipants("t1", "c1", "tasker1"))
                .thenReturn(Optional.empty());

        Optional<Conversation> result = handler.findConversationByTaskAndParticipants("t1", "c1", "tasker1");

        assertThat(result).isEmpty();
    }

    @Test
    void listMessagesForConversation_delegatesToMessagingService() {
        Message msg = new Message("m1", "conv1", "u1", "hi", false, "hash1", Instant.now());
        List<Message> expected = List.of(msg);
        when(messagingService.listMessagesForConversation("conv1", null, 20)).thenReturn(expected);

        List<Message> result = handler.listMessagesForConversation("conv1", null, 20);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void findFlaggedMessages_delegatesToMessagingService() {
        Message msg = new Message("m1", "conv1", "u1", "call me", true, "hash1", Instant.now());
        List<Message> expected = List.of(msg);
        when(messagingService.findFlaggedMessages(null, 50)).thenReturn(expected);

        List<Message> result = handler.findFlaggedMessages(null, 50);

        assertThat(result).isSameAs(expected);
    }
}
