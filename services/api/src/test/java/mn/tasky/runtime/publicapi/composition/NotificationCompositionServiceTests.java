package mn.tasky.runtime.publicapi.composition;

import static org.mockito.Mockito.verify;

import mn.tasky.notification.dto.RegisterDeviceRequest;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationCompositionService")
class NotificationCompositionServiceTests {

    @Mock
    private NotificationCommandPort notificationCommandPort;

    private NotificationCompositionService service;

    @BeforeEach
    void setUp() {
        service = new NotificationCompositionService(notificationCommandPort);
    }

    @Nested
    @DisplayName("registerDevice")
    class RegisterDevice {

        @Test
        @DisplayName("delegates to port with userId, token, and platform from request body")
        void delegatesToPortWithExtractedFields() {
            RegisterDeviceRequest request = new RegisterDeviceRequest("token-abc-123", "IOS");

            service.registerDevice("user-1", request);

            verify(notificationCommandPort).registerDevice("user-1", "token-abc-123", "IOS");
        }

        @Test
        @DisplayName("delegates with ANDROID platform")
        void delegatesWithAndroidPlatform() {
            RegisterDeviceRequest request = new RegisterDeviceRequest("token-android", "ANDROID");

            service.registerDevice("user-2", request);

            verify(notificationCommandPort).registerDevice("user-2", "token-android", "ANDROID");
        }

        @Test
        @DisplayName("delegates with WEB platform")
        void delegatesWithWebPlatform() {
            RegisterDeviceRequest request = new RegisterDeviceRequest("token-web", "WEB");

            service.registerDevice("user-3", request);

            verify(notificationCommandPort).registerDevice("user-3", "token-web", "WEB");
        }
    }

    @Nested
    @DisplayName("unregisterDevice")
    class UnregisterDevice {

        @Test
        @DisplayName("delegates to port with userId and token")
        void delegatesToPortWithUserIdAndToken() {
            service.unregisterDevice("user-1", "token-abc-123");

            verify(notificationCommandPort).unregisterDevice("user-1", "token-abc-123");
        }

        @Test
        @DisplayName("delegates with different userId and token")
        void delegatesWithDifferentArgs() {
            service.unregisterDevice("user-2", "token-xyz-789");

            verify(notificationCommandPort).unregisterDevice("user-2", "token-xyz-789");
        }
    }
}
