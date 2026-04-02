package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.admin.dto.ConciergeAssignRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.api.BookingResponseMapper;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/tasks")
@Validated
public class AdminTaskController {

    private static final Logger log = LoggerFactory.getLogger(AdminTaskController.class);

    private final TaskDao taskDao;
    private final AuthService authService;
    private final BookingService bookingService;
    private final IdempotencyService idempotencyService;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public AdminTaskController(
            TaskDao taskDao,
            AuthService authService,
            BookingService bookingService,
            IdempotencyService idempotencyService,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper) {
        this.taskDao = taskDao;
        this.authService = authService;
        this.bookingService = bookingService;
        this.idempotencyService = idempotencyService;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{id}/concierge-assign")
    @Transactional
    public ResponseEntity<?> conciergeAssign(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody ConciergeAssignRequest body,
            HttpServletRequest request) {

        // Idempotency check
        IdempotencyClaim claim =
                idempotencyService.claim(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() != null && claim.record().resourceId() != null) {
                return bookingService
                        .getBooking(claim.record().resourceId().toString())
                        .<ResponseEntity<?>>map(b -> ResponseEntity.ok(BookingResponseMapper.basic(b)))
                        .orElseGet(() -> idempotencyReplayMissing(request));
            }
            return idempotencyReplayMissing(request);
        }

        try {
            // Validate liability disclaimer accepted
            if (!Boolean.TRUE.equals(body.liabilityDisclaimerAccepted())) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "code",
                                "DISCLAIMER_REQUIRED",
                                "message",
                                "Liability disclaimer must be accepted.",
                                "trace_id",
                                resolveTraceId(request)));
            }

            // Validate task exists and is OPEN
            var taskOpt = taskDao.findById(id);
            if (taskOpt.isEmpty()) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return ResponseEntity.status(404)
                        .body(Map.of(
                                "code",
                                "NOT_FOUND",
                                "message",
                                "Task not found.",
                                "trace_id",
                                resolveTraceId(request)));
            }
            TaskState task = taskOpt.get();
            if (!"OPEN".equals(task.status())) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return ResponseEntity.status(409)
                        .body(Map.of(
                                "code",
                                "TASK_NOT_OPEN",
                                "message",
                                "Task is not in OPEN status.",
                                "trace_id",
                                resolveTraceId(request)));
            }

            // Validate tasker exists and is VERIFIED
            var taskerOpt = authService.getProfile(body.taskerId());
            if (taskerOpt.isEmpty()) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return ResponseEntity.status(404)
                        .body(Map.of(
                                "code",
                                "TASKER_NOT_FOUND",
                                "message",
                                "Tasker not found.",
                                "trace_id",
                                resolveTraceId(request)));
            }
            UserProfile tasker = taskerOpt.get();
            if (!"VERIFIED".equals(tasker.status())) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return ResponseEntity.status(409)
                        .body(Map.of(
                                "code",
                                "TASKER_NOT_VERIFIED",
                                "message",
                                "Tasker is not in VERIFIED status.",
                                "trace_id",
                                resolveTraceId(request)));
            }

            // Create booking and update task status
            BookingState booking = bookingService.createBooking(
                    task.id(), body.taskerId(), task.customerId(), task.budget(), true, task.scheduledAt());
            taskDao.updateStatus(task.id(), "ASSIGNED", java.time.Instant.now());

            // Write audit event
            String metadataJson;
            try {
                metadataJson = objectMapper.writeValueAsString(Map.of(
                        "task_id", task.id(),
                        "tasker_id", body.taskerId(),
                        "override_reason", body.overrideReason(),
                        "booking_id", booking.id(),
                        "admin_id", principal.userId()));
            } catch (com.fasterxml.jackson.core.JsonProcessingException jsonEx) {
                metadataJson = "{}";
                log.warn("Failed to serialize concierge-assign audit metadata", jsonEx);
            }
            auditEventDao.insert(principal.userId(), "CONCIERGE_ASSIGN", "BOOKING", booking.id(), metadataJson);

            // Mark idempotency as completed
            idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.CONCIERGE_ASSIGN,
                    idempotencyKey,
                    "BOOKING",
                    booking.id());

            log.info(
                    "Concierge assignment completed: task={}, tasker={}, booking={}, admin={}",
                    task.id(),
                    body.taskerId(),
                    booking.id(),
                    principal.userId());

            return ResponseEntity.ok(BookingResponseMapper.basic(booking));
        } catch (RuntimeException e) {
            idempotencyService.abandon(principal.userId(), IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
            throw e;
        }
    }
}
