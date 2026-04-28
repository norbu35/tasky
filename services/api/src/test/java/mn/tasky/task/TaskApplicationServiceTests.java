package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.trust.publicapi.TrustQueryPort;
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
    private IdentityQueryPort userProfileService;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private BookingIntentCommandPort bookingIntentCommandPort;

    @Mock
    private NotificationCommandPort notificationService;

    @Mock
    private AnalyticsCommandPort analyticsService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    @Mock
    private TrustQueryPort reviewEnforcementService;

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
                bookingIntentCommandPort,
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

    private BookingIntentState pendingApplicationSelectionIntent() {
        Instant now = Instant.now();
        return new BookingIntentState(
                UUID.randomUUID().toString(),
                TASK_ID,
                TASKER_ID,
                CUSTOMER_ID,
                "APPLICATION_SELECTION",
                "PENDING",
                APPLICATION_ID,
                null,
                null,
                now.plusSeconds(4 * 3600),
                null,
                null,
                now,
                now);
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
            verify(analyticsService).track(eq("APPLICATION_SUBMITTED"), eq(TASKER_ID), any());
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
                            eq("QUALIFIED_APPLICATION"),
                            eq(TASKER_ID),
                            argThat(properties -> TASK_ID.equals(properties.get("task_id"))
                                    && TASKER_ID.equals(properties.get("tasker_id"))
                                    && "cat-1".equals(properties.get("category_id"))
                                    && "BUDGET".equals(properties.get("pricing_mode"))));
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

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.NOT_FOUND);
        }

        @Test
        @DisplayName("Non-owner returns FORBIDDEN")
        void nonOwnerReturnsForbidden() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            BookingIntentCreateResult result = service.acceptApplication("other-user", TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.FORBIDDEN);
        }

        @Test
        @DisplayName("Non-OPEN task returns TASK_NOT_OPEN")
        void nonOpenTaskReturnsNotOpen() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(assignedTask()));

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.TASK_NOT_OPEN);
        }

        @Test
        @DisplayName("Disclaimer not accepted returns DISCLAIMER_REQUIRED")
        void disclaimerNotAccepted() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, false);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.DISCLAIMER_REQUIRED);
        }

        @Test
        @DisplayName("Already-accepted task returns CONFLICT")
        void alreadyAcceptedReturnsConflict() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(true);

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.CONFLICT);
        }

        @Test
        @DisplayName("Application not found returns NOT_FOUND")
        void applicationNotFound() {
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openTask()));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.empty());

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.NOT_FOUND);
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

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.NOT_FOUND);
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

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.errorCode()).isEqualTo(BookingIntentCreateResult.CONFLICT);
        }

        @Test
        @DisplayName("Successful acceptance creates pending booking intent and selection window")
        void successfulAcceptance() {
            TaskState task = openTask();
            when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(task));
            when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
            when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.of(appliedApplication()));
            BookingIntentState intent = pendingApplicationSelectionIntent();
            when(bookingIntentCommandPort.createApplicationSelectionIntent(
                            eq(CUSTOMER_ID), eq(TASK_ID), eq(APPLICATION_ID), eq(TASKER_ID), any(Instant.class)))
                    .thenReturn(BookingIntentCreateResult.success(intent));

            BookingIntentCreateResult result = service.acceptApplication(CUSTOMER_ID, TASK_ID, APPLICATION_ID, true);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.intent()).containsSame(intent);

            verify(taskApplicationDao).updateSelection(eq(APPLICATION_ID), eq("SELECTED"), any(), any());
            verify(bookingCommandPort, never())
                    .createBooking(anyString(), anyString(), anyString(), anyInt(), anyBoolean(), any());
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
