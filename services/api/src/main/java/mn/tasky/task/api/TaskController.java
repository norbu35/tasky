package mn.tasky.task.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.runtime.publicapi.composition.PublicTaskCompositionService;
import mn.tasky.runtime.publicapi.composition.TaskApplicationAcceptanceOutcome;
import mn.tasky.runtime.publicapi.composition.TaskApplicationAcceptanceService;
import mn.tasky.task.dto.AcceptApplicationRequest;
import mn.tasky.task.dto.ApplyTaskRequest;
import mn.tasky.task.dto.CreateDraftRequest;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.CreateTaskRequest;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskDraftResponse;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskPhotoUploadUrlRequest;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateDraftRequest;
import mn.tasky.task.dto.UpdateTask;
import mn.tasky.task.dto.UpdateTaskRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
@Validated
public class TaskController {

    private final MarketplaceCommandPort marketplaceCommandPort;
    private final MarketplaceQueryPort marketplaceQueryPort;
    private final PublicTaskCompositionService taskCompositionService;
    private final TaskApplicationAcceptanceService taskApplicationAcceptanceService;

    public TaskController(
            MarketplaceCommandPort marketplaceCommandPort,
            MarketplaceQueryPort marketplaceQueryPort,
            PublicTaskCompositionService taskCompositionService,
            TaskApplicationAcceptanceService taskApplicationAcceptanceService) {
        this.marketplaceCommandPort = marketplaceCommandPort;
        this.marketplaceQueryPort = marketplaceQueryPort;
        this.taskCompositionService = taskCompositionService;
        this.taskApplicationAcceptanceService = taskApplicationAcceptanceService;
    }

    @GetMapping
    public ResponseEntity<?> listTasks(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(value = "radius_km", defaultValue = "10") @Max(50) Double radiusKm,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        try {
            TaskPage page = marketplaceQueryPort.listTasks(category, lat, lng, radiusKm, cursor, limit);
            List<Map<String, Object>> data = taskCompositionService.toPublicTaskResponses(page.data());

            return ResponseEntity.ok(
                    new PagedResponse<>(data, new CursorPagination(page.nextCursor(), page.hasMore())));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_CURSOR",
                            "message",
                            "Cursor parameter is invalid.",
                            "trace_id",
                            resolveTraceId(request)));
        }
    }

    @GetMapping("/mine/recent-locations")
    public ResponseEntity<?> recentLocations(
            @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!"CUSTOMER".equals(principal.role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only customers can view recent locations.",
                            "trace_id",
                            resolveTraceId(request)));
        }
        return ResponseEntity.ok(taskCompositionService.recentLocationsResponse(
                marketplaceQueryPort.recentLocations(principal.userId(), 3)));
    }

    @GetMapping("/mine")
    public ResponseEntity<?> listMyTasks(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(defaultValue = "customer") String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        try {
            TaskPage page = marketplaceQueryPort.listMyTasks(principal.userId(), role, status, cursor, limit);
            List<Map<String, Object>> data = taskCompositionService.toOwnedTaskResponses(page.data());
            return ResponseEntity.ok(
                    new PagedResponse<>(data, new CursorPagination(page.nextCursor(), page.hasMore())));
        } catch (IllegalArgumentException exception) {
            String code = "INVALID_CURSOR";
            String message = "Cursor parameter is invalid.";
            if ("Role filter is invalid.".equals(exception.getMessage())) {
                code = "INVALID_ROLE";
                message = "Role filter must be customer or tasker.";
            } else if ("Status filter is invalid.".equals(exception.getMessage())) {
                code = "INVALID_STATUS";
                message = "Status filter must be OPEN, ASSIGNED, COMPLETED, or CANCELLED.";
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("code", code, "message", message, "trace_id", resolveTraceId(request)));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTask(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        Optional<TaskState> taskOpt = marketplaceQueryPort.getTask(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
        }
        return ResponseEntity.ok(taskCompositionService.toTaskResponseForViewer(taskOpt.get(), principal.userId()));
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CreateTaskRequest body,
            HttpServletRequest request) {
        if (!"CUSTOMER".equals(principal.role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only customers can create tasks.",
                            "trace_id",
                            resolveTraceId(request)));
        }

        TaskCreateResult result = marketplaceCommandPort.createTask(
                principal.userId(),
                new CreateTask(
                        body.categoryId(),
                        body.description(),
                        body.budget(),
                        body.locationLat(),
                        body.locationLng(),
                        body.locationText(),
                        body.scheduledAt(),
                        body.photoKeys() != null ? body.photoKeys() : List.of(),
                        body.intakeAnswersJson() != null
                                ? body.intakeAnswersJson().toString()
                                : null,
                        body.intakeSchemaVersion(),
                        body.scopeSummary(),
                        body.draftId()));

        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(taskCompositionService.toOwnedTaskResponse(result.task()));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "code",
                        result.errorCode(),
                        "message",
                        result.errorMessage(),
                        "trace_id",
                        resolveTraceId(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateTaskRequest body,
            HttpServletRequest request) {
        TaskUpdateResult result = marketplaceCommandPort.updateTask(
                principal.userId(),
                id,
                new UpdateTask(
                        body.description(),
                        body.budget(),
                        body.locationLat(),
                        body.locationLng(),
                        body.locationText(),
                        body.scheduledAt(),
                        body.photoKeys()));

        if (result.isSuccess()) {
            return ResponseEntity.ok(taskCompositionService.toOwnedTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case TaskUpdateResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
            case TaskUpdateResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "You do not have permission to update this task.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.INVALID_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            "INVALID_STATUS",
                            "message",
                            "Task can be updated only while OPEN.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.INVALID_DESCRIPTION -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_DESCRIPTION",
                            "message",
                            "Description cannot be empty.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.INVALID_LOCATION -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_LOCATION",
                            "message",
                            "Location text cannot be empty.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.INVALID_SCHEDULE -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_SCHEDULE",
                            "message",
                            "Schedule date must be valid and in the future.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.TOO_MANY_PHOTOS -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "TOO_MANY_PHOTOS",
                            "message",
                            "Maximum 3 photos per task.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskUpdateResult.INVALID_PHOTO_KEY -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_PHOTO_KEY",
                            "message",
                            "Photo keys must belong to the caller's task-photo namespace.",
                            "trace_id",
                            resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTask(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        TaskCancelResult result = marketplaceCommandPort.cancelTask(principal.userId(), id);

        if (result.isSuccess()) {
            return ResponseEntity.ok(taskCompositionService.toOwnedTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case TaskCancelResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
            case TaskCancelResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "You do not have permission to cancel this task.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskCancelResult.INVALID_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            "INVALID_STATUS",
                            "message",
                            "Task cannot be cancelled in its current status.",
                            "trace_id",
                            resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @PostMapping("/{id}/applications")
    public ResponseEntity<?> applyToTask(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ApplyTaskRequest body,
            HttpServletRequest request) {
        TaskApplyResult result =
                marketplaceCommandPort.applyToTask(principal.userId(), principal.role(), id, body.message());

        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(taskCompositionService.toTaskApplicationResponse(result.application()));
        }

        return switch (result.errorCode()) {
            case TaskApplyResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
            case TaskApplyResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only verified taskers can apply to tasks.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskApplyResult.TASK_NOT_OPEN -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            "TASK_NOT_OPEN",
                            "message",
                            "Task is not open for applications.",
                            "trace_id",
                            resolveTraceId(request)));
            case TaskApplyResult.DUPLICATE_APPLICATION -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            "ALREADY_APPLIED",
                            "message",
                            "You have already applied to this task.",
                            "trace_id",
                            resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @GetMapping("/{id}/applications")
    public ResponseEntity<?> listTaskApplications(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        TaskApplicationsListResult result;
        try {
            result = marketplaceQueryPort.listTaskApplications(principal.userId(), id, cursor, limit + 1);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_CURSOR",
                            "message",
                            "Cursor parameter is invalid.",
                            "trace_id",
                            resolveTraceId(request)));
        }

        if (result.isSuccess()) {
            List<TaskApplicationState> applications = result.applications();
            boolean hasMore = applications.size() > limit;
            List<TaskApplicationState> pageData = hasMore ? applications.subList(0, limit) : applications;
            String nextCursor = hasMore ? pageData.getLast().id() : null;

            List<Map<String, Object>> data = taskCompositionService.toTaskApplicationResponses(pageData);
            return ResponseEntity.ok(new PagedResponse<>(data, new CursorPagination(nextCursor, hasMore)));
        }

        return switch (result.errorCode()) {
            case TaskApplicationsListResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
            case TaskApplicationsListResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only the task owner can view applications.",
                            "trace_id",
                            resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @PostMapping("/{id}/applications/{applicationId}/accept")
    public ResponseEntity<?> acceptApplication(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @PathVariable String applicationId,
            @Valid @RequestBody AcceptApplicationRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        TaskApplicationAcceptanceOutcome outcome = taskApplicationAcceptanceService.acceptApplication(
                principal.userId(),
                id,
                applicationId,
                Boolean.TRUE.equals(body.liabilityDisclaimerAccepted()),
                idempotencyKey);

        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", outcome.errorCode(),
                            "message", outcome.errorMessage(),
                            "trace_id", resolveTraceId(request)));
            case FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code", outcome.errorCode(),
                            "message", outcome.errorMessage(),
                            "trace_id", resolveTraceId(request)));
            case TASK_NOT_OPEN, CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code", outcome.errorCode(),
                            "message", outcome.errorMessage(),
                            "trace_id", resolveTraceId(request)));
            case DISCLAIMER_REQUIRED -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code", outcome.errorCode(),
                            "message", outcome.errorMessage(),
                            "trace_id", resolveTraceId(request)));
            case INTERNAL_ERROR -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @PostMapping("/{id}/photos/upload-url")
    public ResponseEntity<?> getPostCreateUploadUrl(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody TaskPhotoUploadUrlRequest body,
            HttpServletRequest request) {
        Optional<TaskState> taskOpt = marketplaceQueryPort.getTask(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND", "message", "Task not found.", "trace_id", resolveTraceId(request)));
        }

        TaskState task = taskOpt.get();
        if (!task.customerId().equals(principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "You do not have permission to add photos to this task.",
                            "trace_id",
                            resolveTraceId(request)));
        }

        List<String> rawPhotoKeys = task.photoKeys();
        final List<String> existingPhotoKeys = rawPhotoKeys == null ? List.of() : rawPhotoKeys;
        if (existingPhotoKeys.size() >= 3) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "TOO_MANY_PHOTOS",
                            "message",
                            "Maximum 3 photos per task.",
                            "trace_id",
                            resolveTraceId(request)));
        }

        return getPreCreateUploadUrl(principal, body, request);
    }

    @PostMapping("/photos/upload-url")
    public ResponseEntity<?> getPreCreateUploadUrl(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody TaskPhotoUploadUrlRequest body,
            HttpServletRequest request) {
        return marketplaceCommandPort
                .createPhotoUploadUrl(principal.userId(), body.contentType())
                .<ResponseEntity<?>>map(upload ->
                        ResponseEntity.ok(Map.of("upload_url", upload.uploadUrl(), "storage_key", upload.storageKey())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "code",
                                "INVALID_CONTENT_TYPE",
                                "message",
                                "Unsupported content type. Use image/jpeg or image/png.",
                                "trace_id",
                                resolveTraceId(request))));
    }

    // --- Task Draft Endpoints ---

    @PostMapping("/drafts")
    public ResponseEntity<?> createDraft(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CreateDraftRequest body,
            HttpServletRequest request) {
        try {
            TaskDraft draft = marketplaceCommandPort.createDraft(principal.userId(), body.categoryId());
            return ResponseEntity.status(HttpStatus.CREATED).body(TaskDraftResponse.from(draft));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "CATEGORY_NOT_FOUND",
                            "message", "Category not found.",
                            "trace_id", resolveTraceId(request)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code", "DRAFT_CREATION_CONFLICT",
                            "message", "Draft could not be created.",
                            "trace_id", resolveTraceId(request)));
        }
    }

    @GetMapping("/drafts/{id}")
    public ResponseEntity<?> getDraft(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        return marketplaceQueryPort
                .getDraft(id, principal.userId())
                .<ResponseEntity<?>>map(draft -> ResponseEntity.ok(TaskDraftResponse.from(draft)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "code", "NOT_FOUND",
                                "message", "Draft not found or has expired.",
                                "trace_id", resolveTraceId(request))));
    }

    @PutMapping("/drafts/{id}")
    public ResponseEntity<?> updateDraft(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateDraftRequest body,
            HttpServletRequest request) {
        try {
            TaskDraft updated = marketplaceCommandPort.updateDraft(
                    id,
                    principal.userId(),
                    body.intakeAnswers() != null ? body.intakeAnswers().toString() : null,
                    body.summaryDraft(),
                    body.locationLat(),
                    body.locationLng(),
                    body.locationText());
            return ResponseEntity.ok(TaskDraftResponse.from(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code", "NOT_FOUND",
                            "message", "Draft not found.",
                            "trace_id", resolveTraceId(request)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code", "DRAFT_EXPIRED",
                            "message", "Draft has expired.",
                            "trace_id", resolveTraceId(request)));
        }
    }
}
