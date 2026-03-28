package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
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
    private S3PresignedUrlService s3Mock;

    @BeforeEach
    void setUp() {
        s3Mock = mock(S3PresignedUrlService.class);
        when(s3Mock.generateUploadUrl(anyString(), anyString()))
                .thenReturn("https://storage.example.com/presigned-upload");
        when(s3Mock.generateDownloadUrl(anyString(), any()))
                .thenAnswer(inv -> "https://storage.example.com/presigned-get/" + inv.getArgument(0));

        taskService = new TaskService(
                mock(AuthService.class),
                mock(CategoryService.class),
                mock(BookingService.class),
                mock(MessagingService.class),
                mock(NotificationService.class),
                mock(AnalyticsService.class),
                mock(DomainEventOutboxService.class),
                mock(ReviewEnforcementService.class),
                mock(ScopeSummaryGenerator.class),
                s3Mock,
                new StorageKeyPolicy(),
                mock(TaskDao.class),
                mock(TaskPhotoDao.class),
                mock(TaskApplicationDao.class),
                mock(CategorySchemaVersionDao.class),
                mock(TaskDraftDao.class),
                new ObjectMapper(),
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
        assertThat(taskService.buildPhotoAccessUrls(null, "user-1")).isEmpty();
    }

    @Test
    @DisplayName("buildOwnedPhotoAccessUrl builds correct URL for owned task photo")
    void buildOwnedPhotoAccessUrl() {
        assertThat(taskService.buildOwnedPhotoAccessUrl("uploads/tasks/user-1/photo.jpg", "user-1"))
                .hasValueSatisfying(url -> {
                    assertThat(url).contains("presigned-get");
                    assertThat(url).contains("photo.jpg");
                });
    }

    @Test
    @DisplayName("buildOwnedPhotoAccessUrl skips foreign and wrong-namespace task photos")
    void buildOwnedPhotoAccessUrlSkipsInvalidKeys() {
        assertThat(taskService.buildOwnedPhotoAccessUrl("uploads/tasks/other-user/photo.jpg", "user-1")).isEmpty();
        assertThat(taskService.buildOwnedPhotoAccessUrl("uploads/verification/user-1/front.jpg", "user-1"))
                .isEmpty();
    }

    @Test
    @DisplayName("buildPhotoAccessUrls skips legacy invalid task photo keys")
    void buildPhotoAccessUrlsSkipsLegacyInvalidKeys() {
        assertThat(taskService.buildPhotoAccessUrls(
                        java.util.List.of(
                                "uploads/tasks/user-1/photo.jpg",
                                "uploads/tasks/other-user/photo.jpg",
                                "uploads/verification/user-1/front.jpg"),
                        "user-1"))
                .hasSize(1)
                .allSatisfy(url -> assertThat(url).contains("photo.jpg"));
    }
}
