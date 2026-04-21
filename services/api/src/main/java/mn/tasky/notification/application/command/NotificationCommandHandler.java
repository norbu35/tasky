package mn.tasky.notification.application.command;

import java.util.List;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.District;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.springframework.stereotype.Service;

@Service
public class NotificationCommandHandler implements NotificationCommandPort {

    private final NotificationService notificationService;
    private final TaskerServiceAreaDao serviceAreaDao;

    public NotificationCommandHandler(NotificationService notificationService, TaskerServiceAreaDao serviceAreaDao) {
        this.notificationService = notificationService;
        this.serviceAreaDao = serviceAreaDao;
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

    @Override
    public List<District> getServiceAreas(String userId) {
        return serviceAreaDao.findByUserId(userId);
    }

    @Override
    public void setServiceAreas(String userId, List<String> districtSlugs) {
        serviceAreaDao.deleteByUserId(userId);
        for (String slug : districtSlugs) {
            serviceAreaDao.insertBySlug(userId, slug);
        }
    }

    @Override
    public void sendPushWithEventKey(String userId, String title, String body, String type, String eventKey) {
        notificationService.sendPushWithEventKey(userId, title, body, type, eventKey);
    }
}
