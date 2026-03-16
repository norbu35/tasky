package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.ScopeSummaryGenerator;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskServiceUnitTests {

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(
                mock(AuthService.class),
                mock(CategoryService.class),
                mock(BookingService.class),
                mock(MessagingService.class),
                mock(NotificationService.class),
                mock(AnalyticsService.class),
                mock(DomainEventOutboxService.class),
                mock(ScopeSummaryGenerator.class),
                mock(TaskDao.class),
                mock(TaskPhotoDao.class),
                mock(TaskApplicationDao.class),
                mock(CategorySchemaVersionDao.class),
                mock(TaskDraftDao.class),
                new ObjectMapper(),
                "https://upload.tasky.local",
                5242880,
                900,
                "test-signing-secret-that-is-long-enough",
                10.0,
                50);
    }

    @Test
    @DisplayName("createPhotoUploadUrl returns empty for unsupported content type")
    void createPhotoUploadUrlUnsupportedContentType() {
        assertThat(taskService.createPhotoUploadUrl("user-1", "image/webp")).isEmpty();
    }

    @Test
    @DisplayName("createPhotoUploadUrl returns presigned upload for jpeg")
    void createPhotoUploadUrlJpeg() {
        var result = taskService.createPhotoUploadUrl("user-1", "image/jpeg");
        assertThat(result).isPresent();
        assertThat(result.get().storageKey()).startsWith("uploads/tasks/user-1/");
        assertThat(result.get().storageKey()).endsWith(".jpg");
        assertThat(result.get().uploadUrl()).contains("presigned-upload");
    }

    @Test
    @DisplayName("createPhotoUploadUrl returns presigned upload for png")
    void createPhotoUploadUrlPng() {
        var result = taskService.createPhotoUploadUrl("user-1", "image/png");
        assertThat(result).isPresent();
        assertThat(result.get().storageKey()).endsWith(".png");
    }

    @Test
    @DisplayName("buildPhotoAccessUrls returns empty list for null input")
    void buildPhotoAccessUrlsNull() {
        assertThat(taskService.buildPhotoAccessUrls(null)).isEmpty();
    }

    @Test
    @DisplayName("buildPhotoAccessUrl builds correct URL")
    void buildPhotoAccessUrl() {
        String url = taskService.buildPhotoAccessUrl("uploads/tasks/user-1/photo.jpg");
        assertThat(url).contains("presigned-get");
        assertThat(url).contains("photo.jpg");
    }
}
