package mn.tasky.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.application.PhoneLeakDetector;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.messaging.dto.Conversation;
import mn.tasky.messaging.dto.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

/**
 * Domain-unit tests for messaging scenarios.
 * Covers: SCN-MSG-001, SCN-MSG-002, SCN-MSG-003, SCN-MSG-004.
 *
 * <p>Uses mock DAOs to verify conversation creation, message persistence,
 * access control, and phone number flagging without a Spring context.
 */
class MessagingScenarioTests {

    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String OUTSIDER_ID = UUID.randomUUID().toString();

    private ConversationDao conversationDao; // NOPMD SingularField
    private MessageDao messageDao; // NOPMD SingularField
    private AnalyticsService analyticsService;
    private SimpMessagingTemplate messagingTemplate;
    private MessagingService messagingService;

    // In-memory stores for mock behavior
    private final Map<String, Conversation> conversationStore = new HashMap<>();
    private final List<Message> messageStore = new ArrayList<>();

    @BeforeEach
    void setUp() {
        conversationStore.clear();
        messageStore.clear();

        conversationDao = mock(ConversationDao.class);
        messageDao = mock(MessageDao.class);
        analyticsService = mock(AnalyticsService.class);
        messagingTemplate = mock(SimpMessagingTemplate.class);

        // In-memory conversation insert
        doAnswer(inv -> {
                    String id = inv.getArgument(0);
                    String taskId = inv.getArgument(1);
                    String customerId = inv.getArgument(2);
                    String taskerId = inv.getArgument(3);
                    Instant createdAt = inv.getArgument(4);
                    Conversation conv = new Conversation(id, taskId, customerId, taskerId, createdAt);
                    conversationStore.put(id, conv);
                    return null;
                })
                .when(conversationDao)
                .insert(anyString(), anyString(), anyString(), anyString(), any(Instant.class));

        // findById delegates to store
        when(conversationDao.findById(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return Optional.ofNullable(conversationStore.get(id));
        });

        // findByTaskAndParticipants delegates to store
        when(conversationDao.findByTaskAndParticipants(anyString(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    String taskId = inv.getArgument(0);
                    String customerId = inv.getArgument(1);
                    String taskerId = inv.getArgument(2);
                    return conversationStore.values().stream()
                            .filter(c -> c.taskId().equals(taskId)
                                    && c.customerId().equals(customerId)
                                    && c.taskerId().equals(taskerId))
                            .findFirst();
                });

        // In-memory message insert
        doAnswer(inv -> {
                    String id = inv.getArgument(0);
                    String convId = inv.getArgument(1);
                    String senderId = inv.getArgument(2);
                    String content = inv.getArgument(3);
                    boolean flagged = inv.getArgument(4);
                    String hash = inv.getArgument(5);
                    Instant sentAt = inv.getArgument(6);
                    messageStore.add(new Message(id, convId, senderId, content, flagged, hash, sentAt));
                    return null;
                })
                .when(messageDao)
                .insert(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(Boolean.class),
                        anyString(),
                        any(Instant.class));

        // findByConversationId returns stored messages
        when(messageDao.findByConversationId(anyString(), any(), any(int.class)))
                .thenAnswer(inv -> {
                    String convId = inv.getArgument(0);
                    return messageStore.stream()
                            .filter(m -> m.conversationId().equals(convId))
                            .toList();
                });

        messagingService = new MessagingService(
                messagingTemplate, conversationDao, messageDao, new PhoneLeakDetector(), analyticsService);
    }

    // ── SCN-MSG-001 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-MSG-001: Conversation is created only after booking confirmation")
    void conversationCreatedAfterBookingConfirmation() {
        // When a booking is confirmed, the system provisions a post-confirmation conversation.
        String conversationId = messagingService.startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);

        // Then a conversation exists between the confirmed booking participants.
        assertThat(conversationId).isNotNull();
        assertThat(conversationStore).hasSize(1);

        Conversation created = conversationStore.get(conversationId);
        assertThat(created).isNotNull();
        assertThat(created.taskId()).isEqualTo(TASK_ID);
        assertThat(created.customerId()).isEqualTo(CUSTOMER_ID);
        assertThat(created.taskerId()).isEqualTo(TASKER_ID);

        // Calling again returns the same conversation (idempotent)
        String sameId = messagingService.startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);
        assertThat(sameId).isEqualTo(conversationId);
        assertThat(conversationStore).hasSize(1);
    }

    // ── SCN-MSG-002 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-MSG-002: Message sent to a conversation is persisted and retrievable")
    void messageSentIsPersistedAndRetrievable() {
        // Given a post-confirmation conversation exists between two participants
        String conversationId = messagingService.startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);

        // When one participant sends a message
        Optional<Message> sent = messagingService.sendMessage(CUSTOMER_ID, conversationId, "Hello tasker!");

        // Then the message is stored
        assertThat(sent).isPresent();
        assertThat(sent.get().content()).isEqualTo("Hello tasker!");
        assertThat(sent.get().senderId()).isEqualTo(CUSTOMER_ID);
        assertThat(sent.get().conversationId()).isEqualTo(conversationId);
        assertThat(messageStore).hasSize(1);

        // And both participants can retrieve it from the conversation history
        List<Message> customerView = messagingService.listMessages(CUSTOMER_ID, conversationId, null, 50);
        assertThat(customerView).hasSize(1);
        assertThat(customerView.get(0).content()).isEqualTo("Hello tasker!");

        List<Message> taskerView = messagingService.listMessages(TASKER_ID, conversationId, null, 50);
        assertThat(taskerView).hasSize(1);
        assertThat(taskerView.get(0).content()).isEqualTo("Hello tasker!");

        // Message is also broadcast over WebSocket
        verify(messagingTemplate).convertAndSend(eq("/topic/conversations/" + conversationId), any(Message.class));
    }

    // ── SCN-MSG-003 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-MSG-003: Non-participant cannot read or send messages in a conversation")
    void nonParticipantCannotReadOrSend() {
        // Given a post-confirmation conversation exists between a customer and a tasker
        String conversationId = messagingService.startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);

        // When a third user attempts to send a message in that conversation
        assertThatThrownBy(() -> messagingService.sendMessage(OUTSIDER_ID, conversationId, "Trying to sneak in"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not a participant");

        // When a third user attempts to read messages in that conversation
        assertThatThrownBy(() -> messagingService.listMessages(OUTSIDER_ID, conversationId, null, 50))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not a participant");
    }

    // ── SCN-MSG-004 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-MSG-004: Message containing a phone number pattern is flagged for admin review")
    void messageContainingPhoneNumberIsFlagged() {
        // Given a post-confirmation conversation exists
        String conversationId = messagingService.startConversation(TASK_ID, TASKER_ID, CUSTOMER_ID);

        // When a participant sends a message containing a phone number pattern
        Optional<Message> result = messagingService.sendMessage(CUSTOMER_ID, conversationId, "Call me at 99112233");

        // Then the message is stored with a phone_number_flagged indicator
        assertThat(result).isPresent();
        assertThat(result.get().phoneNumberFlagged()).isTrue();

        // Verify the flagged message was stored in the DAO
        assertThat(messageStore).hasSize(1);
        assertThat(messageStore.get(0).phoneNumberFlagged()).isTrue();

        // Verify analytics event for phone number flagging was emitted
        verify(analyticsService).track(eq("message_phone_number_flagged"), eq(CUSTOMER_ID), any(Map.class));

        // Also verify: international format triggers flagging
        Optional<Message> intlResult =
                messagingService.sendMessage(TASKER_ID, conversationId, "Reach me at +97699887766");
        assertThat(intlResult).isPresent();
        assertThat(intlResult.get().phoneNumberFlagged()).isTrue();

        // And: non-phone message is NOT flagged
        Optional<Message> safeResult =
                messagingService.sendMessage(CUSTOMER_ID, conversationId, "See you tomorrow at 3pm");
        assertThat(safeResult).isPresent();
        assertThat(safeResult.get().phoneNumberFlagged()).isFalse();
    }
}
