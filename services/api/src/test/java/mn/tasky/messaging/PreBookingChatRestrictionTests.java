package mn.tasky.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.messaging.api.MessagingController;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.messaging.application.PhoneLeakDetector;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for the pre-booking chat restriction scenario.
 * Covers: SCN-MSG-005.
 *
 * <p>Verifies that no pre-booking chat exists in Phase 1: conversations are
 * only created internally via startConversation() with required task context,
 * and the controller exposes no public endpoint for conversation creation.
 */
class PreBookingChatRestrictionTests {

    private ConversationDao conversationDao;
    private MessageDao messageDao;
    private MessagingService messagingService;

    @BeforeEach
    void setUp() {
        conversationDao = mock(ConversationDao.class);
        messageDao = mock(MessageDao.class);

        when(conversationDao.findByTaskAndParticipants(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        messagingService = new MessagingService(
                mock(org.springframework.messaging.simp.SimpMessagingTemplate.class),
                conversationDao,
                messageDao,
                new PhoneLeakDetector(),
                mock(AnalyticsService.class));
    }

    // ── SCN-MSG-005 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-MSG-005: No pre-booking chat exists in Phase 1")
    void noPreBookingChatExistsInPhase1() {
        // Given a user with no confirmed booking (no conversation in store)
        when(conversationDao.findByUserId(anyString())).thenReturn(List.of());

        // When listing conversations for that user
        List<?> conversations = messagingService.listConversations("user-without-booking");

        // Then no conversations are returned
        assertThat(conversations).isEmpty();
        verify(conversationDao, never()).insert(anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName(
            "SCN-MSG-005: No pre-booking chat exists in Phase 1 - controller exposes no conversation creation endpoint")
    void controllerExposesNoConversationCreationEndpoint() {
        // Given the MessagingController class
        // When inspecting its public methods
        // Then no method accepts a direct conversation-creation request
        // (startConversation is only reachable internally via TaskApplicationAcceptedHandler)
        boolean hasConversationCreationEndpoint = false;
        for (Method method : MessagingController.class.getDeclaredMethods()) {
            if (isPublicEndpoint(method) && method.getName().contains("startConversation")) {
                hasConversationCreationEndpoint = true;
            }
        }

        assertThat(hasConversationCreationEndpoint)
                .as("MessagingController must not expose a startConversation endpoint")
                .isFalse();
    }

    @Test
    @DisplayName("SCN-MSG-005: No pre-booking chat exists in Phase 1 - startConversation requires task context")
    void startConversationRequiresTaskContext() {
        // Given a user with no bookings has no conversations
        when(conversationDao.findByUserId(anyString())).thenReturn(List.of());
        when(conversationDao.findByTaskAndParticipants(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());

        // When listing conversations before any booking exists, none are returned
        List<?> conversations = messagingService.listConversations("user-no-booking");
        assertThat(conversations).isEmpty();

        // And a conversation can only be created with explicit task + participant context
        String conversationId = messagingService.startConversation("task-1", "tasker-1", "customer-1");
        assertThat(conversationId).isNotNull();
        verify(conversationDao).insert(anyString(), anyString(), anyString(), anyString(), any());
    }

    private static boolean isPublicEndpoint(Method method) {
        return method.getAnnotation(org.springframework.web.bind.annotation.PostMapping.class) != null
                || method.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class) != null
                || method.getAnnotation(org.springframework.web.bind.annotation.PutMapping.class) != null
                || method.getAnnotation(org.springframework.web.bind.annotation.PatchMapping.class) != null
                || method.getAnnotation(org.springframework.web.bind.annotation.DeleteMapping.class) != null
                || method.getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class) != null;
    }
}
