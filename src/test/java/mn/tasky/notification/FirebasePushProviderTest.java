package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.TopicManagementResponse;
import java.util.List;
import java.util.Map;
import mn.tasky.notification.provider.FirebasePushProvider;
import mn.tasky.notification.provider.NotificationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FirebasePushProviderTest {

    @Mock
    FirebaseMessaging firebaseMessaging;

    FirebasePushProvider provider;

    @BeforeEach
    void setUp() {
        provider = new FirebasePushProvider(firebaseMessaging);
    }

    @Test
    void sendPush_success_returnsSuccess() throws Exception {
        when(firebaseMessaging.send(any())).thenReturn("projects/tasky/messages/abc123");

        NotificationResult result = provider.sendPush(
                "fcm-token-xyz", "ANDROID", "New Task", "A task is waiting", Map.of("type", "NEW_TASK"));

        assertThat(result.success()).isTrue();
        assertThat(result.providerMessageId()).isEqualTo("projects/tasky/messages/abc123");
        assertThat(result.errorCode()).isNull();
    }

    @Test
    void sendPush_firebaseThrows_returnsFailure() throws Exception {
        when(firebaseMessaging.send(any())).thenThrow(new RuntimeException("FCM unavailable"));

        NotificationResult result =
                provider.sendPush("fcm-token-xyz", "IOS", "New Task", "A task is waiting", Map.of());

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("DELIVERY_FAILURE");
    }

    @Test
    void subscribeToTopics_callsFirebaseSubscribePerTopic() throws Exception {
        TopicManagementResponse response = mock(TopicManagementResponse.class);
        when(response.getFailureCount()).thenReturn(0);
        when(firebaseMessaging.subscribeToTopic(any(), any())).thenReturn(response);

        provider.subscribeToTopics("fcm-token-xyz", List.of("taskers.district.bayangol", "platform.all"));

        verify(firebaseMessaging, times(2)).subscribeToTopic(any(), any());
    }

    @Test
    void sendToTopic_success_returnsSuccess() throws Exception {
        when(firebaseMessaging.send(any())).thenReturn("projects/tasky/messages/topic-msg-1");

        NotificationResult result = provider.sendToTopic(
                "taskers.district.bayangol.cleaning",
                "New Task",
                "Cleaning job in Bayangol",
                Map.of("type", "NEW_TASK"));

        assertThat(result.success()).isTrue();
    }
}
