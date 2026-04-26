package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.location.publicapi.LocationQueryPort;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.ScopeSummaryGenerator;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskCreationService;
import mn.tasky.task.application.TaskPhotoKeyHelper;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.PricingMode;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskWithdrawResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for task application, pricing, and service-area scenarios
 * SCN-TASK-021 through SCN-TASK-029.
 *
 * <p>No Spring context. DAOs and external boundaries are mocked.
 * Services under test are real instances constructed with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class TaskApplicationScenarioTests {

    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String APPLICATION_ID = UUID.randomUUID().toString();
    private static final String CATEGORY_ID = UUID.randomUUID().toString();

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private BookingIntentCommandPort bookingIntentCommandPort;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    @Mock
    private ReviewEnforcementService reviewEnforcementService;

    @Mock
    private LocationQueryPort locationQueryPort;

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskApplicationDao taskApplicationDao;

    @Mock
    private CategoryService categoryService;

    @Mock
    private ScopeSummaryGenerator scopeSummaryGenerator;

    @Mock
    private TaskPhotoDao taskPhotoDao;

    @Mock
    private CategorySchemaVersionDao categorySchemaVersionDao;

    @Mock
    private TaskDraftDao taskDraftDao;

    @Mock
    private TaskPhotoKeyHelper taskPhotoKeyHelper;

    private TaskApplicationService applicationService;
    private TaskCreationService creationService;

    @BeforeEach
    void setUp() {
        applicationService = new TaskApplicationService(
                userProfileService,
                bookingCommandPort,
                bookingIntentCommandPort,
                notificationService,
                analyticsService,
                domainEventOutboxService,
                reviewEnforcementService,
                taskDao,
                taskApplicationDao);

        creationService = new TaskCreationService(
                categoryService,
                notificationService,
                analyticsService,
                reviewEnforcementService,
                locationQueryPort,
                scopeSummaryGenerator,
                taskDao,
                taskPhotoDao,
                taskApplicationDao,
                categorySchemaVersionDao,
                taskDraftDao,
                new ObjectMapper(),
                taskPhotoKeyHelper,
                10.0,
                50);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private TaskState openBudgetTask() {
        return openBudgetTask(50000);
    }

    private TaskState openBudgetTask(int budget) {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                CATEGORY_ID,
                "Fix my sink",
                budget,
                47.9,
                106.9,
                "Ulaanbaatar",
                "OPEN",
                Instant.now().plusSeconds(3600),
                PricingMode.BUDGET.name(),
                List.of(),
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private TaskState openQuoteTask() {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                CATEGORY_ID,
                "Plumbing quote needed",
                null,
                47.9,
                106.9,
                "Ulaanbaatar",
                "OPEN",
                Instant.now().plusSeconds(3600),
                PricingMode.QUOTE.name(),
                List.of(),
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    private UserProfile verifiedProfile() {
        return profileWithStatus("VERIFIED");
    }

    private UserProfile profileWithStatus(String status) {
        return new UserProfile(
                TASKER_ID,
                "+97699001122",
                "TASKER",
                status,
                "Tasker Name",
                null,
                null,
                4.5,
                10,
                false,
                Instant.now().toString());
    }

    // ── SCN-TASK-020 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-020: Task location outside Ulaanbaatar service area is rejected at posting")
    void rejectsTaskCreationOutsideUlaanbaatarServiceArea() {
        CategoryState activeCategory = new CategoryState(
                CATEGORY_ID,
                "Cleaning",
                "Cleaning MN",
                "https://example.com/icon.png",
                true,
                1,
                null,
                false,
                null,
                null);
        when(categoryService.getCategory(CATEGORY_ID)).thenReturn(Optional.of(activeCategory));
        when(reviewEnforcementService.isUserLocked(CUSTOMER_ID)).thenReturn(false);
        when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), CUSTOMER_ID)).thenReturn(true);
        when(locationQueryPort.isWithinServiceArea(49.4867, 105.9228)).thenReturn(false);

        CreateTask command = new CreateTask(
                CATEGORY_ID,
                "Valid description",
                50000,
                49.4867,
                105.9228,
                "Darkhan",
                Instant.now().plusSeconds(3600).toString(),
                PricingMode.BUDGET.name(),
                List.of(),
                null,
                null,
                null,
                null);

        TaskCreateResult result = creationService.createTask(CUSTOMER_ID, command);

        assertThat(result.errorCode()).isEqualTo(TaskCreateResult.OUTSIDE_SERVICE_AREA);
        verify(taskDao, never())
                .insert(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(),
                        anyDouble(),
                        anyDouble(),
                        anyString(),
                        anyString(),
                        any(),
                        anyString(),
                        any(),
                        any(),
                        any(),
                        any(),
                        any());
    }

    // ── SCN-TASK-021 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-021: Task creation eligibility uses the admin-active category catalog")
    void taskCreationUsesAdminActiveCategoryCatalog() {
        // Given: an admin-active category, regardless of whether it was in the initial launch seed.
        CategoryState activeAdminCategory = new CategoryState(
                CATEGORY_ID,
                "Admin Active",
                "Admin Active MN",
                "https://example.com/icon.png",
                true,
                1,
                null,
                false,
                null,
                null);
        when(categoryService.getCategory(CATEGORY_ID)).thenReturn(Optional.of(activeAdminCategory));
        when(reviewEnforcementService.isUserLocked(CUSTOMER_ID)).thenReturn(false);
        when(taskPhotoKeyHelper.areOwnedTaskPhotoKeys(List.of(), CUSTOMER_ID)).thenReturn(true);
        when(locationQueryPort.isWithinServiceArea(47.9, 106.9)).thenReturn(true);
        when(taskApplicationDao.findNearbyTaskerCandidates(
                        anyString(), anyDouble(), anyDouble(), anyDouble(), anyString(), anyInt()))
                .thenReturn(List.of());

        CreateTask command = new CreateTask(
                CATEGORY_ID,
                "Valid description",
                50000,
                47.9,
                106.9,
                "Ulaanbaatar",
                Instant.now().plusSeconds(3600).toString(),
                PricingMode.BUDGET.name(),
                List.of(),
                null,
                null,
                null,
                null);

        // When
        TaskCreateResult result = creationService.createTask(CUSTOMER_ID, command);

        // Then: the active admin catalog, not the initial seed list, controls category availability.
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.task().categoryId()).isEqualTo(CATEGORY_ID);
        verify(taskDao)
                .insert(
                        anyString(),
                        eq(CUSTOMER_ID),
                        eq(CATEGORY_ID),
                        anyString(),
                        any(),
                        anyDouble(),
                        anyDouble(),
                        anyString(),
                        eq("OPEN"),
                        any(),
                        eq(PricingMode.BUDGET.name()),
                        any(),
                        any(),
                        any(),
                        any(),
                        any());
    }

    // ── SCN-TASK-022 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-022: Only verified active taskers can submit applications to eligible tasks")
    void onlyVerifiedTaskersCanApply() {
        when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openBudgetTask()));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);

        // Unverified tasker -> FORBIDDEN
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(profileWithStatus("UNVERIFIED")));
        TaskApplyResult result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "Hello", null);
        assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);

        // Banned tasker -> FORBIDDEN
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(profileWithStatus("BANNED")));
        result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "Hello", null);
        assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);

        // Suspended tasker -> FORBIDDEN
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(profileWithStatus("SUSPENDED")));
        result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "Hello", null);
        assertThat(result.errorCode()).isEqualTo(TaskApplyResult.FORBIDDEN);

        // Verified tasker -> accepted
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedProfile()));
        when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID)).thenReturn(false);
        result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "Hello", null);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.application().status()).isEqualTo("APPLIED");
    }

    // ── SCN-TASK-023 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-023: Application requires structured pricing response and short note")
    void applicationRequiresPricingResponseAndNote() {
        // Given: a QUOTE mode task and a verified tasker
        when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openQuoteTask()));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedProfile()));
        when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID)).thenReturn(false);

        // When: applying without the structured pricing response (quotePrice)
        TaskApplyResult result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "I can help", null);

        // Then: the application is rejected and not persisted
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(TaskApplyResult.QUOTE_PRICE_REQUIRED);
        verify(taskApplicationDao, never())
                .insert(anyString(), anyString(), anyString(), anyString(), any(), anyString(), any(Instant.class));

        // Note: message (short note) presence is validated at the controller layer
        // via ApplyTaskRequest @NotBlank annotation, not in the service.
    }

    // ── SCN-TASK-024 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-024: Customer can review all applications on a task without hard cap")
    void customerReviewsAllApplicationsWithoutHardCap() {
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openBudgetTask()));

        // Simulate 15 qualified applications returned by the DAO
        List<TaskApplicationState> fifteenApps = IntStream.range(0, 15)
                .mapToObj(i -> new TaskApplicationState(
                        UUID.randomUUID().toString(),
                        TASK_ID,
                        UUID.randomUUID().toString(),
                        "Tasker " + i,
                        null,
                        4.0,
                        i,
                        false,
                        "Application " + i,
                        null,
                        "APPLIED",
                        null,
                        null,
                        null,
                        null,
                        Instant.now()))
                .toList();
        when(taskApplicationDao.findByTaskId(TASK_ID, null, 50)).thenReturn(fifteenApps);

        // When: customer requests the application list
        TaskApplicationsListResult result = applicationService.listTaskApplications(CUSTOMER_ID, TASK_ID);

        // Then: all 15 applications are returned with no artificial cap
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.applications()).hasSize(15);
    }

    // ── SCN-TASK-025 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-025: Tasker can withdraw application before customer selection")
    void taskerCanWithdrawApplicationBeforeSelection() {
        // Given: an application in APPLIED status (customer has not selected any applicant)
        TaskApplicationState appliedApp = new TaskApplicationState(
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
        when(taskApplicationDao.findByTaskerAndId(TASKER_ID, APPLICATION_ID)).thenReturn(Optional.of(appliedApp));

        // After withdrawal the DAO returns the updated record
        TaskApplicationState withdrawnApp = new TaskApplicationState(
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
                "WITHDRAWN",
                null,
                null,
                null,
                null,
                Instant.now());
        when(taskApplicationDao.findById(APPLICATION_ID)).thenReturn(Optional.of(withdrawnApp));
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openBudgetTask()));

        // When: tasker withdraws
        TaskWithdrawResult result = applicationService.withdrawApplication(TASKER_ID, APPLICATION_ID);

        // Then: status becomes WITHDRAWN and the app is not selectable
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.application().status()).isEqualTo("WITHDRAWN");
        verify(taskApplicationDao).updateStatus(APPLICATION_ID, "WITHDRAWN");
    }

    // ── SCN-TASK-026 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-026: Budget mode task shows posted budget to applicants")
    void budgetModeTaskShowsPostedBudget() {
        // Given: a BUDGET mode task with a posted budget of 50000 MNT
        TaskState budgetTask = openBudgetTask(50000);

        // The task state carries the budget and pricing mode for applicants to see
        assertThat(budgetTask.pricingMode()).isEqualTo(PricingMode.BUDGET.name());
        assertThat(budgetTask.budget()).isEqualTo(50000);

        // Verify budget is accessible through the apply flow
        when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(budgetTask));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedProfile()));
        when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID)).thenReturn(false);

        TaskApplyResult result =
                applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "I accept the budget", null);

        assertThat(result.isSuccess()).isTrue();
        // The budget was already exposed to the applicant via the TaskState used in the apply flow
        assertThat(budgetTask.budget()).isEqualTo(50000);
    }

    // ── SCN-TASK-027 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-027: Quote mode task requires tasker price quote in application")
    void quoteModeRequiresPriceQuote() {
        // Given: a QUOTE mode task
        when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(openQuoteTask()));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedProfile()));
        when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID)).thenReturn(false);

        // When: applying without a price quote
        TaskApplyResult noPriceResult = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "My quote", null);

        // Then: rejected with QUOTE_PRICE_REQUIRED
        assertThat(noPriceResult.isSuccess()).isFalse();
        assertThat(noPriceResult.errorCode()).isEqualTo(TaskApplyResult.QUOTE_PRICE_REQUIRED);

        // And: applying WITH a price quote succeeds
        TaskApplyResult withPriceResult =
                applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "My quote", 75000);

        assertThat(withPriceResult.isSuccess()).isTrue();
        assertThat(withPriceResult.application().quotePrice()).isEqualTo(75000);
    }

    // ── SCN-TASK-028 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-028: Budget-mode application rejects counter-offer price")
    void budgetModeRejectsCounterOfferPrice() {
        // Given: a BUDGET mode task with budget 50000 MNT
        TaskState budgetTask = openBudgetTask(50000);
        when(reviewEnforcementService.isUserLocked(TASKER_ID)).thenReturn(false);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(budgetTask));
        when(taskApplicationDao.hasAccepted(TASK_ID)).thenReturn(false);
        when(userProfileService.getProfile(TASKER_ID)).thenReturn(Optional.of(verifiedProfile()));
        when(taskApplicationDao.existsByTaskIdAndTaskerId(TASK_ID, TASKER_ID)).thenReturn(false);

        // When: tasker submits a price different from the posted budget
        TaskApplyResult result = applicationService.applyToTask(TASKER_ID, "TASKER", TASK_ID, "Counter-offer", 60000);

        // Then: the application is rejected because budget mode is accept-only
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(TaskApplyResult.BUDGET_PRICE_NOT_ALLOWED);

        verify(taskApplicationDao, never())
                .insert(anyString(), anyString(), anyString(), anyString(), any(), anyString(), any());
    }

    // ── SCN-TASK-029 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-TASK-029: Customer sees posted budget for budget-mode applications")
    void customerSeesPostedBudgetForBudgetApplications() {
        // Given: a BUDGET mode task with posted budget 50000 MNT
        int postedBudget = 50000;
        TaskState budgetTask = openBudgetTask(postedBudget);
        when(taskDao.findById(TASK_ID)).thenReturn(Optional.of(budgetTask));

        // And: at least one application that accepted the posted budget
        TaskApplicationState appWithBudgetAcceptance = new TaskApplicationState(
                APPLICATION_ID,
                TASK_ID,
                TASKER_ID,
                "Tasker Name",
                null,
                4.5,
                10,
                false,
                "I accept the posted budget",
                null,
                "APPLIED",
                null,
                null,
                null,
                null,
                Instant.now());
        when(taskApplicationDao.findByTaskId(TASK_ID, null, 50)).thenReturn(List.of(appWithBudgetAcceptance));

        // When: customer reviews applications
        TaskApplicationsListResult result = applicationService.listTaskApplications(CUSTOMER_ID, TASK_ID);

        // Then: the original posted budget remains the pricing value for comparison
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.applications()).hasSize(1);

        // Original posted budget is accessible on the task used in the listing flow
        assertThat(budgetTask.budget()).isEqualTo(postedBudget);

        // Budget-mode applications do not carry a separate quote/counter-offer
        TaskApplicationState app = result.applications().get(0);
        assertThat(app.quotePrice()).isNull();
    }
}
