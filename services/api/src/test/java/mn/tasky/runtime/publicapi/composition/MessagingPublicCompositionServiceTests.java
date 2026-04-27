package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import mn.tasky.messaging.dto.EnrichedConversation;
import mn.tasky.messaging.dto.Message;
import mn.tasky.messaging.publicapi.MessagingQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("MessagingPublicCompositionService")
class MessagingPublicCompositionServiceTests {

    @Mock
    private MessagingQueryPort messagingQueryPort;

    private MessagingPublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new MessagingPublicCompositionService(messagingQueryPort);
    }

    private EnrichedConversation conversation(String id, String lastMsgContent, Instant lastMsgAt, Instant createdAt) {
        return new EnrichedConversation(
                id,
                "task-1",
                "Fix the sink",
                "counterparty-1",
                "John",
                "https://cdn.tasky.mn/avatar.png",
                null,
                lastMsgContent,
                lastMsgAt,
                0,
                createdAt);
    }

    private Message message(String id, String convId, String senderId, String content, Instant sentAt) {
        return new Message(id, convId, senderId, content, false, "hash123", sentAt);
    }

    @Nested
    @DisplayName("listConversations")
    class ListConversations {

        @Test
        @DisplayName("returns page with mapped conversations")
        void returnsPageWithConversations() {
            Instant now = Instant.now();
            EnrichedConversation c1 = conversation("c-1", "Hello", now, now);
            EnrichedConversation c2 = conversation("c-2", "Hi there", now, now);
            when(messagingQueryPort.listEnrichedConversations("user-1", null, 11))
                    .thenReturn(List.of(c1, c2));

            MessagingConversationPage page = service.listConversations("user-1", null, 10);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("sets hasMore and cursor when results exceed limit")
        void setsHasMoreWhenExceedsLimit() {
            Instant now = Instant.now();
            Instant later = now.plusSeconds(60);
            EnrichedConversation c1 = conversation("c-1", "Hello", now, now);
            EnrichedConversation c2 = conversation("c-2", "Hi", later, later);
            EnrichedConversation c3 = conversation("c-3", "Extra", now, now);
            when(messagingQueryPort.listEnrichedConversations("user-1", null, 3))
                    .thenReturn(List.of(c1, c2, c3));

            MessagingConversationPage page = service.listConversations("user-1", null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo(later.toString());
        }

        @Test
        @DisplayName("uses createdAt as cursor fallback when lastMessageAt is null")
        void usesCreatedAtWhenLastMessageAtNull() {
            Instant createdAt1 = Instant.now();
            Instant createdAt2 = createdAt1.plusSeconds(1);
            EnrichedConversation c1 = conversation("c-1", "Hello", null, createdAt1);
            EnrichedConversation c2 = conversation("c-2", "Hi", null, createdAt2);
            when(messagingQueryPort.listEnrichedConversations("user-1", null, 3))
                    .thenReturn(List.of(c1, c2, conversation("c-3", "Extra", null, createdAt1)));

            MessagingConversationPage page = service.listConversations("user-1", null, 2);

            assertThat(page.nextCursor()).isEqualTo(createdAt2.toString());
        }

        @Test
        @DisplayName("returns empty page when no conversations")
        void returnsEmptyPage() {
            when(messagingQueryPort.listEnrichedConversations("user-1", null, 11))
                    .thenReturn(List.of());

            MessagingConversationPage page = service.listConversations("user-1", null, 10);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
        }
    }

    @Nested
    @DisplayName("listMessages")
    class ListMessages {

        @Test
        @DisplayName("returns page with mapped messages")
        void returnsPageWithMessages() {
            Instant now = Instant.now();
            Message m1 = message("m-1", "c-1", "user-1", "Hello", now);
            Message m2 = message("m-2", "c-1", "user-2", "Hi back", now);
            when(messagingQueryPort.listMessages("user-1", "c-1", null, 11)).thenReturn(List.of(m1, m2));

            MessagingMessagePage page = service.listMessages("user-1", "c-1", null, 10);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("sets hasMore and cursor when results exceed limit")
        void setsHasMoreWhenExceedsLimit() {
            Instant now = Instant.now();
            Instant previous = now.minusSeconds(60);
            Message m1 = message("m-1", "c-1", "user-1", "Hello", now);
            Message m2 = message("m-2", "c-1", "user-2", "Hi", previous);
            Message m3 = message("m-3", "c-1", "user-1", "Extra", now);
            when(messagingQueryPort.listMessages("user-1", "c-1", null, 3)).thenReturn(List.of(m1, m2, m3));

            MessagingMessagePage page = service.listMessages("user-1", "c-1", null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo(previous + "|m-2");
        }

        @Test
        @DisplayName("returns empty page when no messages")
        void returnsEmptyPage() {
            when(messagingQueryPort.listMessages("user-1", "c-1", null, 11)).thenReturn(List.of());

            MessagingMessagePage page = service.listMessages("user-1", "c-1", null, 10);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
        }
    }

    @Nested
    @DisplayName("messageResponse")
    class MessageResponse {

        @Test
        @DisplayName("maps all Message fields to response map")
        void mapsAllFields() {
            Instant now = Instant.now();
            Message msg = message("m-1", "c-1", "sender-1", "Test message content", now);

            Map<String, Object> response = service.messageResponse(msg);

            assertThat(response).containsEntry("id", "m-1");
            assertThat(response).containsEntry("conversation_id", "c-1");
            assertThat(response).containsEntry("sender_id", "sender-1");
            assertThat(response).containsEntry("content", "Test message content");
            assertThat(response).containsEntry("sent_at", now.toString());
        }
    }
}
