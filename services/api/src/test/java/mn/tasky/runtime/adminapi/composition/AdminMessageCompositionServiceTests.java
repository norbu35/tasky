package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
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
class AdminMessageCompositionServiceTests {

    @Mock
    private MessagingQueryPort messagingQueryPort;

    private AdminMessageCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminMessageCompositionService(messagingQueryPort);
    }

    @Nested
    @DisplayName("listFlagged")
    class ListFlaggedTests {

        @Test
        @DisplayName("returns page of flagged messages")
        void listFlagged_returnsPage() {
            Message msg1 = buildMessage("m1", "conv-1");
            Message msg2 = buildMessage("m2", "conv-1");
            when(messagingQueryPort.findFlaggedMessages(null, 3)).thenReturn(List.of(msg1, msg2));

            AdminMessagePage page = service.listFlagged(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
            assertThat(page.data().getFirst()).containsEntry("id", "m1");
            assertThat(page.data().getFirst()).containsEntry("phone_number_flagged", true);
        }

        @Test
        @DisplayName("sets hasMore and nextCursor when extra row exists")
        void listFlagged_hasMore() {
            Message msg1 = buildMessage("m1", "conv-1");
            Message msg2 = buildMessage("m2", "conv-1");
            Message msg3 = buildMessage("m3", "conv-1");
            when(messagingQueryPort.findFlaggedMessages(null, 3)).thenReturn(List.of(msg1, msg2, msg3));

            AdminMessagePage page = service.listFlagged(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo("m2");
        }

        @Test
        @DisplayName("returns empty page when no flagged messages")
        void listFlagged_empty() {
            when(messagingQueryPort.findFlaggedMessages(null, 3)).thenReturn(Collections.emptyList());

            AdminMessagePage page = service.listFlagged(null, 2);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
        }

        @Test
        @DisplayName("clamps limit to max 100")
        void listFlagged_clampsMaxLimit() {
            when(messagingQueryPort.findFlaggedMessages(null, 101)).thenReturn(Collections.emptyList());

            AdminMessagePage page = service.listFlagged(null, 200);

            assertThat(page.data()).isEmpty();
        }

        @Test
        @DisplayName("clamps limit to min 1")
        void listFlagged_clampsMinLimit() {
            when(messagingQueryPort.findFlaggedMessages(null, 2)).thenReturn(Collections.emptyList());

            AdminMessagePage page = service.listFlagged(null, -1);

            assertThat(page.data()).isEmpty();
        }

        @Test
        @DisplayName("uses cursor when provided")
        void listFlagged_withCursor() {
            Message msg = buildMessage("m10", "conv-1");
            when(messagingQueryPort.findFlaggedMessages("cursor-abc", 3)).thenReturn(List.of(msg));

            AdminMessagePage page = service.listFlagged("cursor-abc", 2);

            assertThat(page.data()).hasSize(1);
        }
    }

    private Message buildMessage(String id, String conversationId) {
        return new Message(id, conversationId, "sender-1", "call me at 99112233", true, "hash1", Instant.now());
    }
}
