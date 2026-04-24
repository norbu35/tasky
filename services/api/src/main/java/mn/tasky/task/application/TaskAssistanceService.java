package mn.tasky.task.application;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.task.dao.TaskRescueEventDao;
import mn.tasky.task.dto.AssistanceEvaluation;
import mn.tasky.task.dto.AssistanceOutcomeType;
import mn.tasky.task.dto.TaskOutcomeClassification;
import mn.tasky.task.dto.TaskRescueEvent;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;

@Service
public class TaskAssistanceService {

    public static final String INTERVENTION_EXTERNAL_DISTRIBUTION = "EXTERNAL_DISTRIBUTION";
    public static final String INTERVENTION_MANUAL_ASSISTED = "MANUAL_ASSISTED";
    public static final String INTERVENTION_STAGE_PRE_MATCH = "pre_match";
    public static final int EXTERNAL_DISTRIBUTION_THRESHOLD_HOURS = 8;

    private static final String EXTERNAL_DISTRIBUTION_ACTIONS_JSON =
            "{\"actions\":[\"BROADENED_TASKER_PUSH\",\"CONCIERGE_FLAG\",\"INTERVENTION_CREATED\"]}";
    private static final String MANUAL_RESCUE_ACTIONS_JSON =
            "{\"actions\":[\"MANUAL_TASK_RESCUE\",\"INTERVENTION_CREATED\"]}";

    private final TaskRescueEventDao taskRescueEventDao;
    private final CategoryDao categoryDao;
    private final AnalyticsService analyticsService;

    public TaskAssistanceService(
            TaskRescueEventDao taskRescueEventDao, CategoryDao categoryDao, AnalyticsService analyticsService) {
        this.taskRescueEventDao = taskRescueEventDao;
        this.categoryDao = categoryDao;
        this.analyticsService = analyticsService;
    }

    public AssistanceEvaluation evaluateExternalDistribution(
            TaskState task, int qualifiedApplicationCount, Instant evaluatedAt) {
        if (!"OPEN".equals(task.status())) {
            return new AssistanceEvaluation(false, AssistanceEvaluation.TASK_NOT_OPEN);
        }
        if (qualifiedApplicationCount > 0) {
            return new AssistanceEvaluation(false, AssistanceEvaluation.QUALIFIED_APPLICATION_EXISTS);
        }
        if (taskRescueEventDao.existsByTaskId(task.id())) {
            return new AssistanceEvaluation(false, AssistanceEvaluation.INTERVENTION_ALREADY_EXISTS);
        }
        if (Duration.between(task.createdAt(), evaluatedAt).toHours() < EXTERNAL_DISTRIBUTION_THRESHOLD_HOURS) {
            return new AssistanceEvaluation(false, AssistanceEvaluation.TOO_EARLY);
        }
        if (!isCategoryEligibleForExternalDistribution(task.categoryId())) {
            return new AssistanceEvaluation(false, AssistanceEvaluation.CATEGORY_NOT_ELIGIBLE);
        }
        return new AssistanceEvaluation(true, AssistanceEvaluation.ALLOWED);
    }

    public boolean isCategoryEligibleForExternalDistribution(String categoryId) {
        Optional<CategoryState> category = categoryDao.findById(categoryId);
        return category.filter(CategoryState::isActive)
                .map(CategoryState::assistedDistributionEnabled)
                .filter(Boolean.TRUE::equals)
                .isPresent();
    }

    public Map<String, Object> buildExternalDistributionPayload(TaskState task) {
        return Map.of(
                AnalyticsService.PROPERTY_TASK_ID,
                task.id(),
                AnalyticsService.PROPERTY_CATEGORY_ID,
                task.categoryId(),
                AnalyticsService.PROPERTY_PRICING_MODE,
                task.pricingMode(),
                "budget",
                task.budget() != null ? task.budget() : 0,
                "scheduled_at",
                task.scheduledAt().toString(),
                "approximate_location",
                task.locationText());
    }

    public TaskRescueEvent recordExternalDistribution(TaskState task, String triggerWindow, Instant triggeredAt) {
        String eventId = UUID.randomUUID().toString();
        taskRescueEventDao.insert(
                eventId,
                task.id(),
                triggeredAt,
                triggerWindow,
                EXTERNAL_DISTRIBUTION_ACTIONS_JSON,
                INTERVENTION_EXTERNAL_DISTRIBUTION,
                INTERVENTION_STAGE_PRE_MATCH);
        trackIntervention(
                task.id(), INTERVENTION_EXTERNAL_DISTRIBUTION, INTERVENTION_STAGE_PRE_MATCH, task.customerId());
        return new TaskRescueEvent(
                eventId,
                task.id(),
                triggeredAt,
                triggerWindow,
                EXTERNAL_DISTRIBUTION_ACTIONS_JSON,
                INTERVENTION_EXTERNAL_DISTRIBUTION,
                INTERVENTION_STAGE_PRE_MATCH,
                triggeredAt);
    }

    public TaskRescueEvent recordManualRescue(String taskId, String interventionStage, String actorUserId) {
        String eventId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        taskRescueEventDao.insert(
                eventId,
                taskId,
                now,
                "DAYTIME",
                MANUAL_RESCUE_ACTIONS_JSON,
                INTERVENTION_MANUAL_ASSISTED,
                interventionStage);
        trackIntervention(taskId, INTERVENTION_MANUAL_ASSISTED, interventionStage, actorUserId);
        return new TaskRescueEvent(
                eventId,
                taskId,
                now,
                "DAYTIME",
                MANUAL_RESCUE_ACTIONS_JSON,
                INTERVENTION_MANUAL_ASSISTED,
                interventionStage,
                now);
    }

    public TaskOutcomeClassification classifyOutcome(String taskId) {
        return classifyOutcome(taskRescueEventDao.findLatestByTaskId(taskId));
    }

    public TaskOutcomeClassification classifyOutcome(Optional<TaskRescueEvent> intervention) {
        if (intervention.isEmpty()) {
            return new TaskOutcomeClassification(AssistanceOutcomeType.SELF_SERVE, true, false);
        }

        String type = intervention.get().interventionType();
        if (INTERVENTION_MANUAL_ASSISTED.equals(type)) {
            return new TaskOutcomeClassification(AssistanceOutcomeType.MANUAL_ASSISTED, false, true);
        }
        return new TaskOutcomeClassification(AssistanceOutcomeType.SYSTEM_ASSISTED, false, true);
    }

    private void trackIntervention(
            String taskId, String storedInterventionType, String interventionStage, String userId) {
        String eventInterventionType =
                INTERVENTION_MANUAL_ASSISTED.equals(storedInterventionType) ? "manual_rescue" : "external_distribution";
        analyticsService.track(
                AnalyticsService.EVENT_INTERVENTION_RECORDED,
                userId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        taskId,
                        AnalyticsService.PROPERTY_INTERVENTION_TYPE,
                        eventInterventionType,
                        AnalyticsService.PROPERTY_INTERVENTION_STAGE,
                        interventionStage));
    }
}
