package mn.tasky.runtime.publicapi.composition;

import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dto.RegisterDeviceRequest;
import org.springframework.stereotype.Component;

/**
 * Runtime composition service for notification device management.
 * Delegates device registration/unregistration to the notification application service.
 */
@Component
public class NotificationCompositionService {

    private final NotificationService notificationService;

    public NotificationCompositionService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void registerDevice(String userId, RegisterDeviceRequest body) {
        notificationService.registerDevice(userId, body.token(), body.platform());
    }

    public void unregisterDevice(String userId, String token) {
        notificationService.unregisterDevice(userId, token);
    }
}
