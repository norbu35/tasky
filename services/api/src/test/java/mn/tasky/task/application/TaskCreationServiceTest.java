package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.location.publicapi.LocationQueryPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskCreationService")
class TaskCreationServiceTest {

    @Mock
    private CategoryQueryPort categoryService;

    @Mock
    private NotificationCommandPort notificationService;

    @Mock
    private AnalyticsCommandPort analyticsService;

    @Mock
    private TrustQueryPort reviewEnforcementService;

    @Mock
    private LocationQueryPort locationQueryPort;

    @Mock
    private ScopeSummaryGenerator scopeSummaryGenerator;

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskPhotoDao taskPhotoDao;

    @Mock
    private TaskApplicationDao taskApplicationDao;

    @Mock
    private TaskDraftDao taskDraftDao;

    @Mock
    private TaskPhotoKeyHelper taskPhotoKeyHelper;

    private TaskCreationService service;

    private final CategoryState activeCategory =
            new CategoryState("cat1", "Plumbing", "desc", null, true, 0, false, false, null, null);

    @BeforeEach
    void setUp() {
        service = new TaskCreationService(
                categoryService,
                notificationService,
                analyticsService,
                reviewEnforcementService,
                locationQueryPort,
                scopeSummaryGenerator,
                taskDao,
                taskPhotoDao,
                taskApplicationDao,
                taskDraftDao,
                new ObjectMapper(),
                taskPhotoKeyHelper,
                10,
                50);
    }

    private CreateTask validCommand() {
        return new CreateTask(
                "cat1",
                "Fix my sink",
                5000,
                47.9,
                106.9,
                "UB",
                Instant.now().plusSeconds(86400).toString(),
                "BUDGET",
                List.of(),
                null,
                null,
                null,
                null);
    }

    @Nested
    @DisplayName("validation errors")
    class ValidationErrors {

        @Test
        @DisplayName("returns REVIEW_LOCK_ACTIVE when user is locked")
        void reviewLockActive() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(true);
            assertThat(service.createTask("c1", validCommand()).errorCode())
                    .isEqualTo(TaskCreateResult.REVIEW_LOCK_ACTIVE);
        }

        @Test
        @DisplayName("returns INVALID_CATEGORY when category not found")
        void categoryNotFound() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat99")).thenReturn(Optional.empty());
            CreateTask cmd = new CreateTask(
                    "cat99",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of(),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_CATEGORY);
        }

        @Test
        @DisplayName("returns INVALID_CATEGORY when category inactive")
        void categoryInactive() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            CategoryState inactive =
                    new CategoryState("cat1", "Plumbing", "desc", null, false, 0, false, false, null, null);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(inactive));
            assertThat(service.createTask("c1", validCommand()).errorCode())
                    .isEqualTo(TaskCreateResult.INVALID_CATEGORY);
        }

        @Test
        @DisplayName("returns TOO_MANY_PHOTOS when more than 3")
        void tooManyPhotos() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of("k1", "k2", "k3", "k4"),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.TOO_MANY_PHOTOS);
        }

        @Test
        @DisplayName("returns INVALID_PHOTO_KEY when keys not owned")
        void invalidPhotoKeys() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(any(), eq("c1"))).thenReturn(false);
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of("bad-key"),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_PHOTO_KEY);
        }

        @Test
        @DisplayName("returns INVALID_BUDGET when BUDGET mode and no budget")
        void missingBudget() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "desc",
                    null,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of(),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_BUDGET);
        }

        @Test
        @DisplayName("returns INVALID_SCHEDULE when date in the past")
        void pastSchedule() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "desc",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    "2020-01-01T00:00:00Z",
                    "BUDGET",
                    List.of(),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_SCHEDULE);
        }

        @Test
        @DisplayName("returns INVALID_SCHEDULE when date format is bad")
        void badScheduleFormat() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            CreateTask cmd = new CreateTask(
                    "cat1", "desc", 5000, 47.9, 106.9, "UB", "not-a-date", "BUDGET", List.of(), null, null, null, null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_SCHEDULE);
        }

        @Test
        @DisplayName("returns INVALID_DESCRIPTION when empty after sanitization")
        void emptyDescription() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "   ",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of(),
                    null,
                    null,
                    null,
                    null);
            assertThat(service.createTask("c1", cmd).errorCode()).isEqualTo(TaskCreateResult.INVALID_DESCRIPTION);
        }
    }

    @Nested
    @DisplayName("successful creation")
    class SuccessfulCreation {

        @Test
        @DisplayName("creates task successfully")
        void success() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            when(locationQueryPort.isWithinServiceArea(47.9, 106.9)).thenReturn(true);
            when(taskApplicationDao.findNearbyTaskerCandidates(
                            any(), anyDouble(), anyDouble(), anyDouble(), anyString(), anyInt()))
                    .thenReturn(List.of());

            TaskCreateResult result = service.createTask("c1", validCommand());

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.task().status()).isEqualTo("OPEN");
            assertThat(result.task().customerId()).isEqualTo("c1");
            verify(analyticsService).track(anyString(), eq("c1"), any());
        }

        @Test
        @DisplayName("creates task with photos")
        void withPhotos() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of("key1", "key2"), "c1"))
                    .thenReturn(true);
            when(locationQueryPort.isWithinServiceArea(47.9, 106.9)).thenReturn(true);
            when(taskApplicationDao.findNearbyTaskerCandidates(
                            any(), anyDouble(), anyDouble(), anyDouble(), anyString(), anyInt()))
                    .thenReturn(List.of());
            CreateTask cmd = new CreateTask(
                    "cat1",
                    "Fix sink",
                    5000,
                    47.9,
                    106.9,
                    "UB",
                    Instant.now().plusSeconds(86400).toString(),
                    "BUDGET",
                    List.of("key1", "key2"),
                    null,
                    null,
                    null,
                    null);

            TaskCreateResult result = service.createTask("c1", cmd);

            assertThat(result.isSuccess()).isTrue();
            verify(taskPhotoDao).insert(anyString(), anyString(), eq("key1"), eq(0));
            verify(taskPhotoDao).insert(anyString(), anyString(), eq("key2"), eq(1));
        }

        @Test
        @DisplayName("notifies nearby taskers")
        void notifiesNearbyTaskers() {
            when(reviewEnforcementService.isUserLocked("c1")).thenReturn(false);
            when(categoryService.getCategory("cat1")).thenReturn(Optional.of(activeCategory));
            when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), "c1")).thenReturn(true);
            when(locationQueryPort.isWithinServiceArea(47.9, 106.9)).thenReturn(true);
            when(taskApplicationDao.findNearbyTaskerCandidates(
                            any(), anyDouble(), anyDouble(), anyDouble(), anyString(), anyInt()))
                    .thenReturn(List.of("tk1", "tk2"));

            service.createTask("c1", validCommand());

            verify(notificationService).sendPush(eq("tk1"), anyString(), anyString(), eq("MATCHING_TASK_NEARBY"));
            verify(notificationService).sendPush(eq("tk2"), anyString(), anyString(), eq("MATCHING_TASK_NEARBY"));
        }
    }
}
