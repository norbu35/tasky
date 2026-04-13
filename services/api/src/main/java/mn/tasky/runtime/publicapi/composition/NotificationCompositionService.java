package mn.tasky.runtime.publicapi.composition;

import mn.tasky.notification.dto.RegisterDeviceRequest;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.springframework.stereotype.Component;

/**
 * Runtime composition service for notification device management.
 * Delegates device registration/unregistration through the notification module's public command port.
 */
@Component
public class NotificationCompositionService {

    private final NotificationCommandPort notificationCommandPort;

    public NotificationCompositionService(NotificationCommandPort notificationCommandPort) {
        this.notificationCommandPort = notificationCommandPort;
    }

    public void registerDevice(String userId, RegisterDeviceRequest body) {
        notificationCommandPort.registerDevice(userId, body.token(), body.platform());
    }

    public void unregisterDevice(String userId, String token) {
        notificationCommandPort.unregisterDevice(userId, token);
    }
}
