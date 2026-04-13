package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.publicapi.BookingCommandPort;
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
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for task application acceptance scenarios.
 * No Spring context — all dependencies mocked via Mockito.
 */
class TaskAcceptScenarioTests {

    private TaskService taskService;
    private TaskDao taskDao;
    private BookingCommandPort bookingCommandPort;

    @BeforeEach
    void setUp() {
        taskDao = mock(TaskDao.class);
        bookingCommandPort = mock(BookingCommandPort.class);

        taskService = new TaskService(
                mock(AuthService.class),
                mock(CategoryService.class),
                bookingCommandPort,
                mock(MessagingService.class),
                mock(NotificationService.class),
                mock(AnalyticsService.class),
                mock(DomainEventOutboxService.class),
                mock(ReviewEnforcementService.class),
                mock(ScopeSummaryGenerator.class),
                mock(S3PresignedUrlService.class),
                mock(StorageKeyPolicy.class),
                taskDao,
                mock(TaskPhotoDao.class),
                mock(TaskApplicationDao.class),
                mock(CategorySchemaVersionDao.class),
                mock(TaskDraftDao.class),
                new ObjectMapper(),
                10.0,
                50);
    }

    // ── SCN-BOOK-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-007: Booking confirmation without liability disclaimer acceptance is rejected")
    void acceptApplicationWithoutDisclaimerIsRejected() {
        String customerId = UUID.randomUUID().toString();
        String taskId = UUID.randomUUID().toString();
        String applicationId = UUID.randomUUID().toString();

        TaskState openTask = mock(TaskState.class);
        when(openTask.customerId()).thenReturn(customerId);
        when(openTask.status()).thenReturn("OPEN");
        when(taskDao.findById(taskId)).thenReturn(Optional.of(openTask));

        TaskAcceptResult result = taskService.acceptApplication(customerId, taskId, applicationId, false);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.DISCLAIMER_REQUIRED);
        verify(bookingCommandPort, never())
                .createBooking(anyString(), anyString(), anyString(), anyInt(), any(Boolean.class), any());
    }
}
