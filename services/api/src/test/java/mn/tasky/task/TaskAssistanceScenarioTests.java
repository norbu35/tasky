package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.task.application.TaskAssistanceService;
import mn.tasky.task.dao.TaskRescueEventDao;
import mn.tasky.task.dto.AssistanceEvaluation;
import mn.tasky.task.dto.AssistanceOutcomeType;
import mn.tasky.task.dto.TaskOutcomeClassification;
import mn.tasky.task.dto.TaskRescueEvent;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskAssistanceScenarioTests {

    private static final String TASK_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String CATEGORY_ID = UUID.randomUUID().toString();
    private static final Instant NOW = Instant.parse("2026-04-24T00:00:00Z");

    @Mock
    private TaskRescueEventDao taskRescueEventDao;

    @Mock
    private CategoryQueryPort categoryQueryPort;

    @Mock
    private AnalyticsCommandPort analyticsService;

    private TaskAssistanceService service;

    @BeforeEach
    void setUp() {
        service = new TaskAssistanceService(taskRescueEventDao, categoryQueryPort, analyticsService);
    }

    private TaskState openTaskCreatedHoursAgo(long hoursAgo) {
        return new TaskState(
                TASK_ID,
                CUSTOMER_ID,
                CATEGORY_ID,
                "Move a sofa",
                50_000,
                47.9189,
                106.9176,
                "Bayangol district",
                "OPEN",
                NOW.plus(1, ChronoUnit.DAYS),
                "BUDGET",
                null,
                null,
                null,
                null,
                NOW.minus(hoursAgo, ChronoUnit.HOURS),
                NOW.minus(hoursAgo, ChronoUnit.HOURS));
    }

    private CategoryState category(String name, boolean active, boolean assistedDistributionEnabled) {
        return new CategoryState(CATEGORY_ID, name, name, null, active, 1, true, assistedDistributionEnabled, 1, "[]");
    }

    private TaskRescueEvent intervention(String interventionType, String stage) {
        return new TaskRescueEvent(
                UUID.randomUUID().toString(), TASK_ID, NOW, "DAYTIME", "{}", interventionType, stage, NOW);
    }

    @Test
    @DisplayName("SCN-ASSIST-001: Task outcome is classified as self-serve when no intervention occurred")
    void selfServeOutcomeWhenNoInterventionOccurred() {
        when(taskRescueEventDao.findLatestByTaskId(TASK_ID)).thenReturn(Optional.empty());

        TaskOutcomeClassification classification = service.classifyOutcome(TASK_ID);

        assertThat(classification.outcomeType()).isEqualTo(AssistanceOutcomeType.SELF_SERVE);
        assertThat(classification.includedInSelfServeFulfillmentReporting()).isTrue();
        assertThat(classification.includedInAssistedOutcomeReporting()).isFalse();
    }

    @Test
    @DisplayName("SCN-ASSIST-002: Task outcome is classified as system-assisted when external distribution was used")
    void systemAssistedOutcomeWhenExternalDistributionWasUsed() {
        when(taskRescueEventDao.findLatestByTaskId(TASK_ID))
                .thenReturn(Optional.of(intervention(
                        TaskAssistanceService.INTERVENTION_EXTERNAL_DISTRIBUTION,
                        TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH)));

        TaskOutcomeClassification classification = service.classifyOutcome(TASK_ID);

        assertThat(classification.outcomeType()).isEqualTo(AssistanceOutcomeType.SYSTEM_ASSISTED);
        assertThat(classification.includedInSelfServeFulfillmentReporting()).isFalse();
        assertThat(classification.includedInAssistedOutcomeReporting()).isTrue();
    }

    @Test
    @DisplayName("SCN-ASSIST-003: Task outcome is classified as manual-assisted when operator performed rescue")
    void manualAssistedOutcomeWhenOperatorPerformedRescue() {
        when(taskRescueEventDao.findLatestByTaskId(TASK_ID))
                .thenReturn(Optional.of(intervention(
                        TaskAssistanceService.INTERVENTION_MANUAL_RESCUE,
                        TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH)));

        TaskOutcomeClassification classification = service.classifyOutcome(TASK_ID);

        assertThat(classification.outcomeType()).isEqualTo(AssistanceOutcomeType.MANUAL_ASSISTED);
        assertThat(classification.includedInSelfServeFulfillmentReporting()).isFalse();
        assertThat(classification.includedInAssistedOutcomeReporting()).isTrue();
    }

    @Test
    @DisplayName("SCN-ASSIST-004: External distribution triggers only after 8 hours without qualified application")
    void externalDistributionTriggersOnlyAfterEightHoursWithoutQualifiedApplication() {
        when(categoryQueryPort.getCategory(CATEGORY_ID)).thenReturn(Optional.of(category("Home cleaning", true, true)));
        when(taskRescueEventDao.existsByTaskId(TASK_ID)).thenReturn(false);

        AssistanceEvaluation tooEarly = service.evaluateExternalDistribution(openTaskCreatedHoursAgo(7), 0, NOW);
        AssistanceEvaluation applicationExists =
                service.evaluateExternalDistribution(openTaskCreatedHoursAgo(9), 1, NOW);
        AssistanceEvaluation allowed = service.evaluateExternalDistribution(openTaskCreatedHoursAgo(8), 0, NOW);

        assertThat(tooEarly.externalDistributionAllowed()).isFalse();
        assertThat(tooEarly.reason()).isEqualTo(AssistanceEvaluation.TOO_EARLY);
        assertThat(applicationExists.externalDistributionAllowed()).isFalse();
        assertThat(applicationExists.reason()).isEqualTo(AssistanceEvaluation.QUALIFIED_APPLICATION_EXISTS);
        assertThat(allowed.externalDistributionAllowed()).isTrue();
    }

    @Test
    @DisplayName("SCN-ASSIST-005: External distribution is limited to admin-eligible categories")
    void externalDistributionLimitedToAdminEligibleCategories() {
        when(categoryQueryPort.getCategory(CATEGORY_ID)).thenReturn(Optional.of(category("Dog walking", true, false)));
        when(taskRescueEventDao.existsByTaskId(TASK_ID)).thenReturn(false);

        AssistanceEvaluation evaluation = service.evaluateExternalDistribution(openTaskCreatedHoursAgo(9), 0, NOW);

        assertThat(evaluation.externalDistributionAllowed()).isFalse();
        assertThat(evaluation.reason()).isEqualTo(AssistanceEvaluation.CATEGORY_NOT_ELIGIBLE);
    }

    @Test
    @DisplayName("SCN-ASSIST-005: External distribution is limited to admin-eligible categories")
    void adminLaunchControlMarksInitialSeedCategoriesEligible() {
        when(categoryQueryPort.getCategory(CATEGORY_ID))
                .thenReturn(Optional.of(category("Moving & Hauling", true, true)));
        when(taskRescueEventDao.existsByTaskId(TASK_ID)).thenReturn(false);

        AssistanceEvaluation evaluation = service.evaluateExternalDistribution(openTaskCreatedHoursAgo(9), 0, NOW);

        assertThat(evaluation.externalDistributionAllowed()).isTrue();
    }

    @Test
    @DisplayName("SCN-ASSIST-006: External distribution payloads do not expose exact address, raw contacts, "
            + "or unsupported trust claims")
    void externalDistributionPayloadIsSanitized() {
        Map<String, Object> payload = service.buildExternalDistributionPayload(openTaskCreatedHoursAgo(9));

        assertThat(payload).containsKeys("task_id", "category_id", "pricing_mode", "approximate_location");
        assertThat(payload)
                .doesNotContainKeys(
                        "customer_id",
                        "tasker_id",
                        "raw_contact",
                        "phone",
                        "exact_address",
                        "location_lat",
                        "location_lng",
                        "payment_protection",
                        "escrow",
                        "wallet_guarantee");
    }

    @Test
    @DisplayName("SCN-ASSIST-007: Tasks advanced through external distribution are excluded from self-serve "
            + "fulfillment reporting")
    void externalDistributionExcludedFromSelfServeFulfillmentReporting() {
        TaskOutcomeClassification classification = service.classifyOutcome(Optional.of(intervention(
                TaskAssistanceService.INTERVENTION_EXTERNAL_DISTRIBUTION,
                TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH)));

        assertThat(classification.outcomeType()).isEqualTo(AssistanceOutcomeType.SYSTEM_ASSISTED);
        assertThat(classification.includedInSelfServeFulfillmentReporting()).isFalse();
        assertThat(classification.includedInAssistedOutcomeReporting()).isTrue();
    }

    @Test
    @DisplayName("SCN-ASSIST-008: Manual task-specific rescue is recorded as intervention")
    void manualTaskSpecificRescueIsRecordedAsIntervention() {
        service.recordManualRescue(TASK_ID, TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH, "admin-1");

        verify(taskRescueEventDao)
                .insert(
                        anyString(),
                        eq(TASK_ID),
                        any(Instant.class),
                        eq("DAYTIME"),
                        anyString(),
                        eq(TaskAssistanceService.INTERVENTION_MANUAL_RESCUE),
                        eq(TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH));
        verify(analyticsService)
                .track(
                        eq("INTERVENTION_RECORDED"),
                        eq("admin-1"),
                        argThat(properties -> TASK_ID.equals(properties.get("task_id"))
                                && "manual_rescue".equals(properties.get("intervention_type"))
                                && TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH.equals(
                                        properties.get("intervention_stage"))));
    }

    @Test
    @DisplayName("SCN-ANALYTICS-005: Intervention recorded event is emitted when assisted distribution or manual "
            + "rescue is used")
    void interventionRecordedAnalyticsEventEmitted() {
        service.recordExternalDistribution(openTaskCreatedHoursAgo(9), "DAYTIME", NOW);

        verify(analyticsService)
                .track(
                        eq("INTERVENTION_RECORDED"),
                        eq(CUSTOMER_ID),
                        argThat(properties -> TASK_ID.equals(properties.get("task_id"))
                                && "external_distribution".equals(properties.get("intervention_type"))
                                && TaskAssistanceService.INTERVENTION_STAGE_PRE_MATCH.equals(
                                        properties.get("intervention_stage"))));
    }
}
