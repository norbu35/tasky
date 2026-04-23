package mn.tasky.notification.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.District;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationCommandHandlerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private TaskerServiceAreaDao serviceAreaDao;

    private NotificationCommandHandler handler;

    @BeforeEach
    void setUp() {
        handler = new NotificationCommandHandler(notificationService, serviceAreaDao);
    }

    @Test
    void registerDevice_delegatesToNotificationService() {
        handler.registerDevice("u1", "token123", "ANDROID");

        verify(notificationService).registerDevice("u1", "token123", "ANDROID");
    }

    @Test
    void unregisterDevice_delegatesToNotificationService() {
        handler.unregisterDevice("u1", "token123");

        verify(notificationService).unregisterDevice("u1", "token123");
    }

    @Test
    void sendPush_delegatesToNotificationService() {
        handler.sendPush("u1", "title", "body", "INFO");

        verify(notificationService).sendPush("u1", "title", "body", "INFO");
    }

    @Test
    void getServiceAreas_delegatesToServiceAreaDao() {
        List<District> expected = List.of(new District("d1", "Khan-Uul", "Хан-Уул", "khan-uul"));
        when(serviceAreaDao.findByUserId("u1")).thenReturn(expected);

        List<District> result = handler.getServiceAreas("u1");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void setServiceAreas_delegatesToServiceAreaDao() {
        handler.setServiceAreas("u1", List.of("khan-uul", "chingeltei"));

        verify(serviceAreaDao).deleteByUserId("u1");
        verify(serviceAreaDao).insertBySlug("u1", "khan-uul");
        verify(serviceAreaDao).insertBySlug("u1", "chingeltei");
    }

    @Test
    void sendPushWithEventKey_delegatesToNotificationService() {
        handler.sendPushWithEventKey("u1", "title", "body", "TASKER_APPLIED", "evt1");

        verify(notificationService).sendPushWithEventKey("u1", "title", "body", "TASKER_APPLIED", "evt1");
    }
}
