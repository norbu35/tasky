package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for TaskApplicationService.
 * Covers the apply, list, and accept flows with all guard-rail branches.
 */
@ExtendWith(MockitoExtension.class)
class TaskApplicationServiceTests {

    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String APPLICATION_ID = UUID.randomUUID().toString();

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    @Mock
    private ReviewEnforcementService reviewEnforcementService;

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskApplicationDao taskApplicationDao;

    private TaskApplicationService service;

    @BeforeEach
    void setUp() {
        service = new TaskApplicationService(
                userProfileService,
                bookingCommandPort,
                notificationService,
                analyticsService,
                domainEventOutboxService,
                reviewEnforcementService,
                taskDao,
                taskApplicationDao);
    }

    private TaskState openTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "Fix my sink",
                5000,
                47.9,
                106.9,
                "Ulaanbaatar",
                "OPEN",
                Instant.now(),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private TaskState assignedTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                "cat-1",
                "Fix my sink",
                5000,
                47.9,
                106.9,
                "Ulaanbaatar",
                "ASSIGNED",
                Instant.now(),
                "BUDGET",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private UserProfile verifiedTaskerProfile() {
        return new UserProfile(
                TASKER_ID,
                "+97699001122",
                "TASKER",
                "VERIFIED",
                "Tasker Name",
                null,
                null,
                4.5,
                10,
                false,
                Instant.now().toString());
    }

    private TaskApplicationState appliedApplication() {
        return new TaskApplicationState(
                APPLICATION_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "I can do this",
                null,
                "APPLIED",
                null,
                null,
                null,
                null,
                Instant.now());
    }

    // ── applyToTask ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("applyToTask")
    class ApplyToTask {

        @Test
        @DisplayName("Review-locked tasker is rejected with REVIEW_LOCK_ACTIVE")
        void reviewLockedIsRejected() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(true);

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.REVIEW_LOCK_ACTIVE);
        }

        @Test
        @DisplayName("Non-existent task returns NOT_FOUND")
        void missingTaskReturnsNotFound() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.empty());

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Non-TASKER role returns FORBIDDEN")
        void nonTaskerRoleReturnsForbidden() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            TaskApplyResult result = service.applyToTask(TASKER_ID, "CUSTOMER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Self-application returns FORBIDDEN")
        void selfApplicationReturnsForbidden() {
            when(reviewEnforcementService.isUserLocked(CUSTOMER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            TaskApplyResult result = service.applyToTask(CUSTOMER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Non-OPEN task returns TASK_NOT_OPEN")
        void nonOpenTaskReturnsNotOpen() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(assignedTask()));

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.TASK_NOT_OPEN);
        }

        @Test
        @DisplayName("Unverified tasker returns FORBIDDEN")
        void unverifiedTaskerReturnsForbidden() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            UserProfile unverified = new UserProfile(
                    TASKER_ID,
                    null,
                    "TASKER",
                    "ACTIVE",
                    "Name",
                    null,
                    null,
                    0.0,
                    0,
                    false,
                    Instant.now().toString());
            when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(unverified));

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Duplicate application returns DUPLICATE_APPLICATION")
        void duplicateApplicationRejected() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedTaskerProfile()));
            when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID))
                    .thenReturn(true);

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "msg", null);

            assertThat(result.errorCode()).isEqualTo(TaskApplyResult.DUPLICATE_APPLICATION);
        }

        @Test
        @DisplayName("Successful application creates record, sends push, and tracks analytics")
        void successfulApplication() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedTaskerProfile()));
            when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID))
                    .thenReturn(false);

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "I can do this", null);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.application().taskerId()).isEqualTo(TASKER_ID);
            assertThat(result.application().status()).isEqualTo("APPLIED");
            verify(taskApplicationDao)
                    .insert(
                            anyString(),
                            eq(TASK_ID),
                            eq(TASKER_ID),
                            anyString(),
                            any(),
                            eq("APPLIED"),
                            any(Instant.class));
            verify(notificationService).sendPush(eq(CUSTOMER_ID), anyString(), anyString(), eq("TASKER_APPLIED"));
            verify(analyticsService).track(eq(AnalyticsService.EVENT_APPLICATION_SUBMITTED), eq(TASKER_ID), any());
        }

        @Test
        @DisplayName(
                "SCN-ANALYTICS-004: Qualified application submitted event is emitted when a verified tasker applies")
        void qualifiedApplicationAnalyticsEventEmitted() {
            when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedTaskerProfile()));
            when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID))
                    .thenReturn(false);

            TaskApplyResult result = service.applyToTask(TASKER_ID, "TASKER", TASK_ID, "I can do this", null);

            assertThat(result.isSuccess()).isTrue();
            verify(analyticsService)
                    .track(
                            eq(AnalyticsService.EVENT_QUALIFIED_APPLICATION),
                            eq(TASKER_ID),
                            argThat(properties -> TASK_ID.equals(properties.get(AnalyticsService.PROPERTY_TASK_ID))
                                    && TASKER_ID.equals(properties.get(AnalyticsService.PROPERTY_TASKER_ID))
                                    && "cat-1".equals(properties.get(AnalyticsService.PROPERTY_CATEGORY_ID))
                                    && "BUDGET".equals(properties.get(AnalyticsService.PROPERTY_PRICING_MODE))));
        }
    }

    // ── listTaskApplications ──────────────────────────────────────────────

    @Nested
    @DisplayName("listTaskApplications")
    class ListTaskApplications {

        @Test
        @DisplayName("Non-existent task returns NOT_FOUND")
        void missingTaskReturnsNotFound() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.empty());

            TaskApplicationsListResult result = service.listTaskApplications(CUSTOMER_ID, TASK_ID, null, 50);

            assertThat(result.errorCode()).isEqualTo(TaskApplicationsListResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Non-owner returns FORBIDDEN")
        void nonOwnerReturnsForbidden() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            TaskApplicationsListResult result = service.listTaskApplications("other-user", TASK_ID, null, 50);

            assertThat(result.errorCode()).isEqualTo(TaskApplicationsListResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Owner receives application list")
        void ownerGetsApplications() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.findByTaskId(TASK_ID, null, 50)).thenReturn(List.of(appliedApplication()));

            TaskApplicationsListResult result = service.listTaskApplications(CUSTOMER_ID, TASK_ID, null, 50);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.applications()).hasSize(1);
        }
    }

    // ── acceptApplication ─────────────────────────────────────────────────

    @Nested
    @DisplayName("acceptApplication")
    class AcceptApplication {

        @Test
        @DisplayName("Non-existent task returns NOT_FOUND")
        void missingTaskNotFound() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.empty());

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Non-owner returns FORBIDDEN")
        void nonOwnerReturnsForbidden() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            TaskAcceptResult result = service.acceptApplication("other-user", TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Non-OPEN task returns TASK_NOT_OPEN")
        void nonOpenTaskReturnsNotOpen() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(assignedTask()));

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.TASK_NOT_OPEN);
        }

        @Test
        @DisplayName("Disclaimer not accepted returns DISCLAIMER_REQUIRED")
        void disclaimerNotAccepted() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, false);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.DISCLAIMER_REQUIRED);
        }

        @Test
        @DisplayName("Already-accepted task returns CONFLICT")
        void alreadyAcceptedReturnsConflict() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(true);

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.CONFLICT);
        }

        @Test
        @DisplayName("Application not found returns NOT_FOUND")
        void applicationNotFound() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.empty());

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Application for different task returns NOT_FOUND")
        void applicationWrongTask() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            TaskApplicationState wrongTaskApp = new TaskApplicationState(
                    APPLICATION_ID,
                    "other-task",
                    TASKER_ID,
                    "Name",
                    null,
                    4.0,
                    5,
                    false,
                    "msg",
                    null,
                    "APPLIED",
                    null,
                    null,
                    null,
                    null,
                    Instant.now());
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.of(wrongTaskApp));

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Application not in APPLIED status returns CONFLICT")
        void nonAppliedStatusReturnsConflict() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            TaskApplicationState rejectedApp = new TaskApplicationState(
                    APPLICATION_ID,
                    TASK_ID,
                    TASKER_ID,
                    "Name",
                    null,
                    4.0,
                    5,
                    false,
                    "msg",
                    null,
                    "REJECTED",
                    null,
                    null,
                    null,
                    null,
                    Instant.now());
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.of(rejectedApp));

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.CONFLICT);
        }

        @Test
        @DisplayName("Successful acceptance creates booking, updates statuses, and publishes outbox event")
        void successfulAcceptance() {
            TaskState task = openTask();
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.of(appliedApplication()));

            String bookingId = UUID.randomUUID().toString();
            BookingState booking = new BookingState(
                    bookingId,
                    TASK_ID,
                    TASKER_ID,
                    CUSTOMER_ID,
                    5000,
                    "ASSIGNED",
                    null,
                    true,
                    task.scheduledAt(),
                    "STANDARD",
                    false,
                    Instant.now(),
                    0,
                    null,
                    Instant.now(),
                    Instant.now());
            when(bookingCommandPort.createBooking(
                            eq(TASK_ID), eq(TASKER_ID), eq(CUSTOMER_ID), eq(5000), eq(true), any()))
                    .thenReturn(booking);

            TaskAcceptResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.booking().id()).isEqualTo(bookingId);

            // Verify application status updates
            verify(taskApplicationDao).updateStatus(APPLICATION_ID, "ACCEPTED");
            verify(taskApplicationDao).rejectOthers(TASK_ID, APPLICATION_ID);

            // Verify task status update
            verify(taskDao).updateStatus(eq(TASK_ID), eq("ASSIGNED"), any(Instant.class));

            // Verify outbox event published
            verify(domainEventOutboxService)
                    .publish(
                            eq(OutboxEventTypes.TASK_APPLICATION_ACCEPTED),
                            eq("BOOKING"),
                            eq(bookingId),
                            any(Map.class));
        }
    }

    // ── countApplications ──────────────────────────────────────────────────

    @Nested
    @DisplayName("countApplications")
    class CountApplications {

        @Test
        @DisplayName("Delegates to DAO")
        void delegatesToDao() {
            when(taskApplicationDao.countByTaskId(TASK_ID)).thenReturn(7);

            assertThat(service.countApplications(TASK_ID)).isEqualTo(7);
        }
    }
}
