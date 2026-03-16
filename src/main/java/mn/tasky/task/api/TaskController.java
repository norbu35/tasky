package mn.tasky.task.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;

import static mn.tasky.booking.api.BookingResponseMapper.basic;
import static mn.tasky.common.api.ApiResponseSupport.*;

@RestController
@RequestMapping("/api/v1/tasks")
@Validated
public class TaskController {

    private static final double MAX_PUBLIC_OFFSET_METERS = 500.0d;
    private static final SecureRandom LOCATION_FUZZ_RANDOM = new SecureRandom();

    private final TaskService taskService;
    private final TaskDraftService taskDraftService;
    private final CategoryService categoryService;
    private final AuthService authService;
    private final BookingService bookingService;
    private final IdempotencyService idempotencyService;

    public TaskController(
        TaskService taskService,
        TaskDraftService taskDraftService,
        CategoryService categoryService,
        AuthService authService,
        BookingService bookingService,
        IdempotencyService idempotencyService) {
        this.taskService = taskService;
        this.taskDraftService = taskDraftService;
        this.categoryService = categoryService;
        this.authService = authService;
        this.bookingService = bookingService;
        this.idempotencyService = idempotencyService;
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
            TaskPage page = taskService.listTasks(category,
                lat,
                lng,
                radiusKm,
                cursor,
                limit);

            List<Map<String, Object>> data =
                page.data()
                    .stream()
                    .map(this::toPublicTaskResponse)
                    .toList();

            return ResponseEntity.ok(
                new PagedResponse<>(data,
                    new CursorPagination(page.nextCursor(),
                        page.hasMore())));
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

    private Map<String, Object> toPublicTaskResponse(TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        double[] fuzzedLocation = fuzzCoordinates(task.locationLat(),
            task.locationLng());
        response.put("id",
            task.id());

        categoryService
            .getCategory(task.categoryId())
            .ifPresent(cat -> response.put(
                "category",
                Map.of(
                    "id",
                    cat.id(),
                    "name",
                    cat.name(),
                    "name_mn",
                    cat.nameMn(),
                    "icon_url",
                    cat.iconUrl())));

        authService
            .getProfile(task.customerId())
            .ifPresent(profile -> response.put(
                "customer",
                Map.of(
                    "id",
                    profile.id(),
                    "full_name",
                    profile.fullName(),
                    "avatar_url",
                    profile.avatarUrl() != null ? profile.avatarUrl() : "",
                    "rating_avg",
                    profile.ratingAvg())));

        response.put("description",
            task.description());
        response.put("budget",
            task.budget());
        response.put("approximate_location",
            "Ulaanbaatar, Mongolia (Fuzzed)");
        response.put("approximate_lat",
            fuzzedLocation[0]);
        response.put("approximate_lng",
            fuzzedLocation[1]);
        response.put("status",
            task.status());
        response.put("scheduled_at",
            task.scheduledAt()
                .toString());
        List<String> photoKeys = task.photoKeys() == null ? List.of() : task.photoKeys();
        response.put("photo_urls",
            taskService.buildPhotoAccessUrls(photoKeys));
        response.put("application_count",
            taskApplicationCount(task.id()));
        response.put("created_at",
            task.createdAt()
                .toString());

        return response;
    }

    private double[] fuzzCoordinates(double lat, double lng) {
        double angle = LOCATION_FUZZ_RANDOM.nextDouble() * Math.PI * 2;
        double distanceMeters = LOCATION_FUZZ_RANDOM.nextDouble() * MAX_PUBLIC_OFFSET_METERS;
        double latOffset = (distanceMeters * Math.cos(angle)) / 111_320.0d;
        double lngOffset =
            (distanceMeters * Math.sin(angle)) / (111_320.0d * Math.max(0.1d,
                Math.cos(Math.toRadians(lat))));

        double fuzzedLat = roundToTwoDecimals(lat + latOffset);
        double fuzzedLng = roundToTwoDecimals(lng + lngOffset);
        return new double[]{fuzzedLat, fuzzedLng};
    }

    private int taskApplicationCount(String taskId) {
        return taskService.countApplications(taskId);
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0d) / 100.0d;
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
            TaskPage page = taskService.listMyTasks(principal.userId(),
                role,
                status,
                cursor,
                limit);
            List<Map<String, Object>> data =
                page.data()
                    .stream()
                    .map(this::toTaskResponse)
                    .toList();
            return ResponseEntity.ok(
                new PagedResponse<>(data,
                    new CursorPagination(page.nextCursor(),
                        page.hasMore())));
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
                .body(Map.of("code",
                    code,
                    "message",
                    message,
                    "trace_id",
                    resolveTraceId(request)));
        }
    }

    private Map<String, Object> toTaskResponse(TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        List<String> rawPhotoKeys = task.photoKeys();
        final List<String> photoKeys = rawPhotoKeys == null ? List.of() : rawPhotoKeys;
        List<Map<String, Object>> photos = IntStream.range(0,
                photoKeys.size())
            .mapToObj(index -> {
                Map<String, Object> photo = new LinkedHashMap<>();
                photo.put("storage_key",
                    photoKeys.get(index));
                photo.put("url",
                    taskService.buildPhotoAccessUrl(photoKeys.get(index)));
                photo.put("sort_order",
                    index);
                return photo;
            })
            .toList();
        response.put("id",
            task.id());
        response.put("category_id",
            task.categoryId());
        response.put("customer_id",
            task.customerId());
        response.put("description",
            task.description());
        response.put("budget",
            task.budget());
        response.put("location_lat",
            task.locationLat());
        response.put("location_lng",
            task.locationLng());
        response.put("location_text",
            task.locationText());
        response.put("status",
            task.status());
        response.put("scheduled_at",
            task.scheduledAt()
                .toString());
        response.put("photos",
            photos);
        response.put("photo_keys",
            photoKeys);
        response.put("created_at",
            task.createdAt()
                .toString());
        response.put("updated_at",
            task.updatedAt()
                .toString());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTask(
        @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        Optional<TaskState> taskOpt = taskService.getTask(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
        }

        TaskState task = taskOpt.get();
        boolean owner = task.customerId()
            .equals(principal.userId());
        boolean bookedTasker = bookingService.listBookings(principal.userId(),
                "tasker",
                null)
            .stream()
            .anyMatch(booking -> booking.taskId()
                .equals(task.id())
                && ("ASSIGNED".equals(booking.status())
                || "PAID".equals(booking.status())
                || "COMPLETED".equals(booking.status())));

        if (owner || bookedTasker) {
            return ResponseEntity.ok(toTaskResponse(task));
        }
        return ResponseEntity.ok(toPublicTaskResponse(task));
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

        TaskCreateResult result = taskService.createTask(
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
                body.intakeAnswersJson(),
                body.intakeSchemaVersion(),
                body.scopeSummary(),
                body.draftId()));

        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(toTaskResponse(result.task()));
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
        TaskUpdateResult result = taskService.updateTask(
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
            return ResponseEntity.ok(toTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case TaskUpdateResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
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
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .build();
        };
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTask(
        @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        TaskCancelResult result = taskService.cancelTask(principal.userId(),
            id);

        if (result.isSuccess()) {
            return ResponseEntity.ok(toTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case TaskCancelResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
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
                .build();
        };
    }

    @PostMapping("/{id}/applications")
    public ResponseEntity<?> applyToTask(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody ApplyTaskRequest body,
        HttpServletRequest request) {
        TaskApplyResult result = taskService.applyToTask(principal.userId(),
            principal.role(),
            id,
            body.message());

        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(toApplicationResponse(result.application()));
        }

        return switch (result.errorCode()) {
            case TaskApplyResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
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
                .build();
        };
    }

    private Map<String, Object> toApplicationResponse(TaskApplicationState app) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id",
            app.id());
        response.put("task_id",
            app.taskId());
        response.put(
            "tasker",
            Map.of(
                "id",
                app.taskerId(),
                "full_name",
                app.taskerFullName(),
                "avatar_url",
                app.taskerAvatarUrl() != null ? app.taskerAvatarUrl() : "",
                "rating_avg",
                app.taskerRatingAvg(),
                "completed_tasks",
                app.taskerCompletedTasks(),
                "is_pro",
                app.taskerIsPro()));
        response.put("message",
            app.message());
        response.put("status",
            app.status());
        response.put("created_at",
            app.createdAt()
                .toString());
        return response;
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
            result = taskService.listTaskApplications(principal.userId(),
                id,
                cursor,
                limit + 1);
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
            List<TaskApplicationState> pageData = hasMore ? applications.subList(0,
                limit) : applications;
            String nextCursor = hasMore ? pageData.getLast()
                .id() : null;

            List<Map<String, Object>> data =
                pageData.stream()
                    .map(this::toApplicationResponse)
                    .toList();
            return ResponseEntity.ok(new PagedResponse<>(data,
                new CursorPagination(nextCursor,
                    hasMore)));
        }

        return switch (result.errorCode()) {
            case TaskApplicationsListResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
            case TaskApplicationsListResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "code",
                    "FORBIDDEN",
                    "message",
                    "Only the task owner can view applications.",
                    "trace_id",
                    resolveTraceId(request)));
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .build();
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
        IdempotencyClaim claim =
            idempotencyService.claim(principal.userId(),
                IdempotencyOperations.ACCEPT_APPLICATION,
                idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String bookingId = claim.record()
                .resourceId()
                .toString();
            return bookingService
                .getBooking(bookingId)
                .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(basic(booking)))
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            TaskAcceptResult result = taskService.acceptApplication(
                principal.userId(),
                id,
                applicationId,
                Boolean.TRUE.equals(body.liabilityDisclaimerAccepted()));

            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.ACCEPT_APPLICATION,
                    idempotencyKey,
                    "BOOKING",
                    result.booking()
                        .id());
                return ResponseEntity.ok(basic(result.booking()));
            }

            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.ACCEPT_APPLICATION,
                idempotencyKey);
            return switch (result.errorCode()) {
                case TaskAcceptResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                        "code",
                        "NOT_FOUND",
                        "message",
                        "Task or application not found.",
                        "trace_id",
                        resolveTraceId(request)));
                case TaskAcceptResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "code",
                        "FORBIDDEN",
                        "message",
                        "Only the task owner can accept applications.",
                        "trace_id",
                        resolveTraceId(request)));
                case TaskAcceptResult.TASK_NOT_OPEN -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                        "code",
                        "TASK_NOT_OPEN",
                        "message",
                        "Task is no longer open.",
                        "trace_id",
                        resolveTraceId(request)));
                case TaskAcceptResult.DISCLAIMER_REQUIRED -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "code",
                        "DISCLAIMER_REQUIRED",
                        "message",
                        "Liability disclaimer must be accepted to confirm booking.",
                        "trace_id",
                        resolveTraceId(request)));
                case TaskAcceptResult.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                        "code",
                        "CONFLICT",
                        "message",
                        "Application already processed or task assigned.",
                        "trace_id",
                        resolveTraceId(request)));
                default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.ACCEPT_APPLICATION,
                idempotencyKey);
            throw exception;
        }
    }

    @PostMapping("/{id}/photos/upload-url")
    public ResponseEntity<?> getPostCreateUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody TaskPhotoUploadUrlRequest body,
        HttpServletRequest request) {
        Optional<TaskState> taskOpt = taskService.getTask(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code",
                    "NOT_FOUND",
                    "message",
                    "Task not found.",
                    "trace_id",
                    resolveTraceId(request)));
        }

        TaskState task = taskOpt.get();
        if (!task.customerId()
            .equals(principal.userId())) {
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

        return getPreCreateUploadUrl(principal,
            body,
            request);
    }

    @PostMapping("/photos/upload-url")
    public ResponseEntity<?> getPreCreateUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody TaskPhotoUploadUrlRequest body,
        HttpServletRequest request) {
        return taskService
            .createPhotoUploadUrl(principal.userId(),
                body.contentType())
            .<ResponseEntity<?>>map(upload ->
                ResponseEntity.ok(Map.of("upload_url",
                    upload.uploadUrl(),
                    "storage_key",
                    upload.storageKey())))
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
            TaskDraft draft = taskDraftService.createDraft(principal.userId(), body.categoryId());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(TaskDraftResponse.from(draft));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code", "CATEGORY_NOT_FOUND",
                    "message", e.getMessage(),
                    "trace_id", resolveTraceId(request)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                    "code", "DRAFT_CREATION_CONFLICT",
                    "message", e.getMessage(),
                    "trace_id", resolveTraceId(request)));
        }
    }

    @GetMapping("/drafts/{id}")
    public ResponseEntity<?> getDraft(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        HttpServletRequest request) {
        return taskDraftService.getDraft(id)
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
            TaskDraft updated = taskDraftService.updateDraft(id, body.intakeAnswers(), body.summaryDraft());
            return ResponseEntity.ok(TaskDraftResponse.from(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                    "code", "NOT_FOUND",
                    "message", e.getMessage(),
                    "trace_id", resolveTraceId(request)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                    "code", "DRAFT_EXPIRED",
                    "message", e.getMessage(),
                    "trace_id", resolveTraceId(request)));
        }
    }
}
