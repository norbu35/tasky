package mn.tasky.task.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.PricingMode;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Handles task creation: validates category, schedule, description, photo
 * constraints, and intake answers before persisting. Emits analytics and
 * notifies nearby taskers on success.
 */
@Service
public class TaskCreationService {

    private static final Logger log = LoggerFactory.getLogger(TaskCreationService.class);

    private final CategoryService categoryService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final ScopeSummaryGenerator scopeSummaryGenerator;
    private final TaskDao taskDao;
    private final TaskPhotoDao taskPhotoDao;
    private final TaskApplicationDao taskApplicationDao;
    private final CategorySchemaVersionDao categorySchemaVersionDao;
    private final TaskDraftDao taskDraftDao;
    private final ObjectMapper objectMapper;
    private final ReviewEnforcementService reviewEnforcementService;
    private final TaskPhotoKeyHelper taskPhotoKeyHelper;
    private final double taskMatchNotificationRadiusKm;
    private final int taskMatchNotificationLimit;

    public TaskCreationService(
            CategoryService categoryService,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            ReviewEnforcementService reviewEnforcementService,
            ScopeSummaryGenerator scopeSummaryGenerator,
            TaskDao taskDao,
            TaskPhotoDao taskPhotoDao,
            TaskApplicationDao taskApplicationDao,
            CategorySchemaVersionDao categorySchemaVersionDao,
            TaskDraftDao taskDraftDao,
            ObjectMapper objectMapper,
            TaskPhotoKeyHelper taskPhotoKeyHelper,
            @Value("${tasky.notifications.task-match-radius-km:10}") double taskMatchNotificationRadiusKm,
            @Value("${tasky.notifications.task-match-limit:50}") int taskMatchNotificationLimit) {
        this.categoryService = categoryService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.reviewEnforcementService = reviewEnforcementService;
        this.scopeSummaryGenerator = scopeSummaryGenerator;
        this.taskDao = taskDao;
        this.taskPhotoDao = taskPhotoDao;
        this.taskApplicationDao = taskApplicationDao;
        this.categorySchemaVersionDao = categorySchemaVersionDao;
        this.taskDraftDao = taskDraftDao;
        this.objectMapper = objectMapper;
        this.taskPhotoKeyHelper = taskPhotoKeyHelper;
        this.taskMatchNotificationRadiusKm = taskMatchNotificationRadiusKm;
        this.taskMatchNotificationLimit = taskMatchNotificationLimit;
    }

    /**
     * Creates a new task owned by the customer after validating category, schedule,
     * description, and photo constraints.
     * Emits analytics and notifies nearby taskers when successful.
     *
     * @param customerId Task owner identifier.
     * @param command    Task creation payload.
     * @return Success or validation failure details.
     */
    public TaskCreateResult createTask(String customerId, CreateTask command) {
        if (reviewEnforcementService.isUserLocked(customerId)) {
            return TaskCreateResult.error(
                    TaskCreateResult.REVIEW_LOCK_ACTIVE,
                    "You must complete pending reviews before creating a new task.");
        }

        Optional<CategoryState> categoryOpt = categoryService.getCategory(command.categoryId());
        if (categoryOpt.isEmpty() || !categoryOpt.get().isActive()) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_CATEGORY, "Category not found or inactive.");
        }
        CategoryState category = categoryOpt.get();

        if (command.photoKeys().size() > 3) {
            return TaskCreateResult.error(TaskCreateResult.TOO_MANY_PHOTOS, "Maximum 3 photos allowed.");
        }
        if (!taskPhotoKeyHelper.areOwnedTaskPhotoKeys(command.photoKeys(), customerId)) {
            return TaskCreateResult.error(
                    TaskCreateResult.INVALID_PHOTO_KEY, "Photo keys must belong to the caller's task-photo namespace.");
        }

        // Validate pricing mode and budget interaction
        String pricingMode = command.pricingMode();
        if (pricingMode == null) {
            pricingMode = PricingMode.BUDGET.name();
        }
        if (PricingMode.BUDGET.name().equals(pricingMode) && command.budget() == null) {
            return TaskCreateResult.error(
                    TaskCreateResult.INVALID_BUDGET, "Budget is required for BUDGET pricing mode.");
        }

        String sanitizedDescription = TextSanitizer.plainText(command.description());
        String sanitizedLocationText = TextSanitizer.plainText(command.locationText());
        if (!StringUtils.hasText(sanitizedDescription)) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_DESCRIPTION, "Description cannot be empty.");
        }

        Instant scheduledAt;
        try {
            scheduledAt = Instant.parse(command.scheduledAt());
            if (scheduledAt.isBefore(Instant.now())) {
                return TaskCreateResult.error(
                        TaskCreateResult.INVALID_SCHEDULE, "Schedule date must be in the future.");
            }
        } catch (Exception e) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_SCHEDULE, "Invalid schedule date format.");
        }

        String intakeAnswersJson = command.intakeAnswersJson();
        Integer intakeSchemaVersion = command.intakeSchemaVersion();
        String scopeSummarySource = command.scopeSummary();
        TaskDraft draft;

        if (StringUtils.hasText(command.draftId())) {
            Optional<TaskDraft> draftOpt = taskDraftDao.findById(command.draftId());
            if (draftOpt.isEmpty()) {
                return TaskCreateResult.error(TaskCreateResult.DRAFT_NOT_FOUND, "Draft not found.");
            }
            draft = draftOpt.get();
            intakeSchemaVersion = draft.intakeSchemaVersion();
            if (intakeAnswersJson == null && draft.intakeAnswersJson() != null) {
                intakeAnswersJson = draft.intakeAnswersJson();
            }
        }

        if (intakeSchemaVersion != null) {
            if (!Boolean.TRUE.equals(category.intakeEnabled())) {
                return TaskCreateResult.error(
                        TaskCreateResult.INTAKE_NOT_ENABLED, "Intake is not enabled for this category.");
            }

            Optional<CategorySchemaVersion> schemaOpt =
                    categorySchemaVersionDao.findByCategoryIdAndVersion(command.categoryId(), intakeSchemaVersion);
            if (schemaOpt.isEmpty()) {
                return TaskCreateResult.error(
                        TaskCreateResult.INVALID_SCHEMA_VERSION,
                        "Schema version " + intakeSchemaVersion + " not found for this category.");
            }
            CategorySchemaVersion schemaVersion = schemaOpt.get();

            String validationError = StringUtils.hasText(intakeAnswersJson)
                    ? validateIntakeAnswers(schemaVersion.schemaJson(), intakeAnswersJson)
                    : null;
            if (validationError != null) {
                return TaskCreateResult.error(TaskCreateResult.INTAKE_VALIDATION_FAILED, validationError);
            }

            ScopeSummaryGenerator.SummaryResult summaryResult = scopeSummaryGenerator.generate(
                    schemaVersion.schemaJson(), intakeAnswersJson, command.categoryId(), intakeSchemaVersion);

            if (StringUtils.hasText(command.scopeSummary())) {
                scopeSummarySource = "USER_EDITED";
            } else {
                scopeSummarySource = summaryResult.source();
            }
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();

        taskDao.insert(
                id,
                customerId,
                command.categoryId(),
                sanitizedDescription,
                command.budget(),
                command.locationLat(),
                command.locationLng(),
                sanitizedLocationText,
                "OPEN",
                scheduledAt,
                pricingMode,
                intakeAnswersJson,
                intakeSchemaVersion,
                scopeSummarySource,
                now,
                now);

        List<String> photoKeys = List.copyOf(command.photoKeys());
        for (int i = 0; i < photoKeys.size(); i++) {
            taskPhotoDao.insert(UUID.randomUUID().toString(), id, photoKeys.get(i), i);
        }

        TaskState task = new TaskState(
                id,
                customerId,
                command.categoryId(),
                sanitizedDescription,
                command.budget(),
                command.locationLat(),
                command.locationLng(),
                sanitizedLocationText,
                "OPEN",
                scheduledAt,
                pricingMode,
                photoKeys,
                intakeAnswersJson,
                intakeSchemaVersion,
                scopeSummarySource,
                now,
                now);

        analyticsService.track(
                AnalyticsService.EVENT_TASK_POSTED,
                customerId,
                Map.of(AnalyticsService.PROPERTY_TASK_ID, id, "category_id", command.categoryId()));

        notifyNearbyTaskers(task);
        return TaskCreateResult.success(task);
    }

    /**
     * Validates intake answers against the category schema.
     * Returns null if valid, or an error message string describing the validation failures.
     */
    private String validateIntakeAnswers(String schemaJson, String answersJson) {
        try {
            JsonNode schemaArray = objectMapper.readTree(schemaJson);
            if (!schemaArray.isArray()) {
                return "Schema is not a valid JSON array.";
            }
            Map<String, Object> answers = objectMapper.readValue(answersJson, new TypeReference<>() {});
            JsonNode answersNode = objectMapper.readTree(answersJson);

            List<String> errors = new ArrayList<>();

            for (JsonNode field : schemaArray) {
                String key = field.has("key") ? field.get("key").asText() : null;
                if (key == null) {
                    continue;
                }
                String label = field.has("label") ? field.get("label").asText() : key;
                String type = field.has("type") ? field.get("type").asText() : "text";
                boolean required =
                        field.has("required") && field.get("required").asBoolean();

                Object answerValue = answers.get(key);
                JsonNode answerNode = answersNode.get(key);

                if (required && (answerValue == null || (answerValue instanceof String s && s.isBlank()))) {
                    errors.add(label + " is required.");
                    continue;
                }

                if (answerValue == null) {
                    continue;
                }

                switch (type) {
                    case "single_select", "dropdown" -> {
                        if (field.has("options") && field.get("options").isArray()) {
                            List<String> validValues = new ArrayList<>();
                            for (JsonNode opt : field.get("options")) {
                                if (opt.isObject() && opt.has("value")) {
                                    validValues.add(opt.get("value").asText());
                                }
                            }
                            String val = String.valueOf(answerValue);
                            if (!validValues.contains(val)) {
                                errors.add(label + ": '" + val + "' is not a valid option.");
                            }
                        }
                    }
                    case "multi_select" -> {
                        if (field.has("options")
                                && field.get("options").isArray()
                                && answerNode != null
                                && answerNode.isArray()) {
                            List<String> validValues = new ArrayList<>();
                            for (JsonNode opt : field.get("options")) {
                                if (opt.isObject() && opt.has("value")) {
                                    validValues.add(opt.get("value").asText());
                                }
                            }
                            for (JsonNode selectedNode : answerNode) {
                                String selected = selectedNode.asText();
                                if (!validValues.contains(selected)) {
                                    errors.add(label + ": '" + selected + "' is not a valid option.");
                                }
                            }
                        }
                    }
                    case "numeric_counter" -> {
                        try {
                            double numVal;
                            if (answerValue instanceof Number num) {
                                numVal = num.doubleValue();
                            } else {
                                numVal = Double.parseDouble(String.valueOf(answerValue));
                            }
                            if (field.has("min") && numVal < field.get("min").asDouble()) {
                                errors.add(label + ": value must be at least "
                                        + field.get("min").asText() + ".");
                            }
                            if (field.has("max") && numVal > field.get("max").asDouble()) {
                                errors.add(label + ": value must be at most "
                                        + field.get("max").asText() + ".");
                            }
                        } catch (NumberFormatException e) {
                            errors.add(label + ": value must be numeric.");
                        }
                    }
                    case "yes_no" -> {
                        if (answerValue instanceof Boolean) {
                            // valid
                        } else {
                            String strVal = String.valueOf(answerValue).toLowerCase(Locale.ROOT);
                            if (!"yes".equals(strVal)
                                    && !"no".equals(strVal)
                                    && !"true".equals(strVal)
                                    && !"false".equals(strVal)) {
                                errors.add(label + ": value must be yes/no or true/false.");
                            }
                        }
                    }
                    case "text", "textarea" -> {
                        String strVal = String.valueOf(answerValue);
                        if (field.has("max_length")) {
                            int maxLen = field.get("max_length").asInt();
                            if (strVal.length() > maxLen) {
                                errors.add(label + ": value must be at most " + maxLen + " characters.");
                            }
                        }
                        if (field.has("min_length")) {
                            int minLen = field.get("min_length").asInt();
                            if (strVal.length() < minLen) {
                                errors.add(label + ": value must be at least " + minLen + " characters.");
                            }
                        }
                    }
                    default -> {
                        // no additional validation for unknown types
                    }
                }
            }

            if (errors.isEmpty()) {
                return null;
            }
            return String.join(" ", errors);
        } catch (JsonProcessingException e) {
            log.warn("Failed to validate intake answers against schema", e);
            return "Failed to validate intake answers: " + e.getMessage();
        }
    }

    private void notifyNearbyTaskers(TaskState task) {
        double radiusMeters = taskMatchNotificationRadiusKm * 1000.0d;
        List<String> candidates = taskApplicationDao.findNearbyTaskerCandidates(
                task.categoryId(),
                task.locationLat(),
                task.locationLng(),
                radiusMeters,
                task.customerId(),
                taskMatchNotificationLimit);
        for (String taskerId : candidates) {
            notificationService.sendPush(
                    taskerId,
                    "New task nearby",
                    "A new task matching your recent work area is available.",
                    "MATCHING_TASK_NEARBY");
        }
    }
}
