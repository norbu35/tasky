package mn.tasky.notification.application.command;

import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.springframework.stereotype.Service;

@Service
public class NotificationCommandHandler implements NotificationCommandPort {

    private final NotificationService notificationService;

    public NotificationCommandHandler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void registerDevice(String userId, String token, String platform) {
        notificationService.registerDevice(userId, token, platform);
    }

    @Override
    public void unregisterDevice(String userId, String token) {
        notificationService.unregisterDevice(userId, token);
    }

    @Override
    public void sendPush(String userId, String title, String body, String type) {
        notificationService.sendPush(userId, title, body, type);
    }
}
