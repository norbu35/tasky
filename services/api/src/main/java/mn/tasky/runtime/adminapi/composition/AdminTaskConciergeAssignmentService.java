package mn.tasky.runtime.adminapi.composition;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.runtime.publicapi.composition.BookingResponseCompositionService;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminTaskConciergeAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AdminTaskConciergeAssignmentService.class);

    private final TaskDao taskDao;
    private final IdentityQueryPort identityQueryPort;
    private final BookingCommandPort bookingCommandPort;
    private final BookingQueryPort bookingQueryPort;
    private final IdempotencyService idempotencyService;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;
    private final BookingResponseCompositionService bookingResponseCompositionService;

    public AdminTaskConciergeAssignmentService(
            TaskDao taskDao,
            IdentityQueryPort identityQueryPort,
            BookingCommandPort bookingCommandPort,
            BookingQueryPort bookingQueryPort,
            IdempotencyService idempotencyService,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper,
            BookingResponseCompositionService bookingResponseCompositionService) {
        this.taskDao = taskDao;
        this.identityQueryPort = identityQueryPort;
        this.bookingCommandPort = bookingCommandPort;
        this.bookingQueryPort = bookingQueryPort;
        this.idempotencyService = idempotencyService;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
    }

    @Transactional
    public AdminTaskConciergeAssignmentOutcome conciergeAssign(
            String adminId,
            String taskId,
            String taskerId,
            String overrideReason,
            boolean liabilityDisclaimerAccepted,
            String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return AdminTaskConciergeAssignmentOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return AdminTaskConciergeAssignmentOutcome.replayMissing();
            }
            return bookingQueryPort
                    .getBooking(claim.record().resourceId().toString())
                    .map(booking -> AdminTaskConciergeAssignmentOutcome.success(
                            bookingResponseCompositionService.basicBookingResponse(booking)))
                    .orElseGet(AdminTaskConciergeAssignmentOutcome::replayMissing);
        }

        try {
            if (!liabilityDisclaimerAccepted) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return AdminTaskConciergeAssignmentOutcome.failure(
                        AdminTaskConciergeAssignmentOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted.");
            }

            TaskState task = taskDao.findById(taskId).orElse(null);
            if (task == null) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return AdminTaskConciergeAssignmentOutcome.failure(
                        AdminTaskConciergeAssignmentOutcome.Status.NOT_FOUND, "NOT_FOUND", "Task not found.");
            }
            if (!"OPEN".equals(task.status())) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return AdminTaskConciergeAssignmentOutcome.failure(
                        AdminTaskConciergeAssignmentOutcome.Status.TASK_NOT_OPEN,
                        "TASK_NOT_OPEN",
                        "Task is not in OPEN status.");
            }

            UserProfile tasker = identityQueryPort.getProfile(taskerId).orElse(null);
            if (tasker == null) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return AdminTaskConciergeAssignmentOutcome.failure(
                        AdminTaskConciergeAssignmentOutcome.Status.TASKER_NOT_FOUND,
                        "TASKER_NOT_FOUND",
                        "Tasker not found.");
            }
            if (!"VERIFIED".equals(tasker.status())) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                return AdminTaskConciergeAssignmentOutcome.failure(
                        AdminTaskConciergeAssignmentOutcome.Status.TASKER_NOT_VERIFIED,
                        "TASKER_NOT_VERIFIED",
                        "Tasker is not in VERIFIED status.");
            }

            var booking = bookingCommandPort.createBooking(
                    task.id(), taskerId, task.customerId(), task.budget(), true, task.scheduledAt());
            taskDao.updateStatus(task.id(), "ASSIGNED", Instant.now());

            String metadataJson;
            try {
                metadataJson = objectMapper.writeValueAsString(java.util.Map.of(
                        "task_id", task.id(),
                        "tasker_id", taskerId,
                        "override_reason", overrideReason,
                        "booking_id", booking.id(),
                        "admin_id", adminId));
            } catch (JsonProcessingException jsonException) {
                metadataJson = "{}";
                log.warn("Failed to serialize concierge-assign audit metadata", jsonException);
            }
            auditEventDao.insert(adminId, "CONCIERGE_ASSIGN", "BOOKING", booking.id(), metadataJson);

            idempotencyService.completeWithResource(
                    adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey, "BOOKING", booking.id());
            log.info(
                    "Concierge assignment completed: task={}, tasker={}, booking={}, admin={}",
                    task.id(),
                    taskerId,
                    booking.id(),
                    adminId);

            return AdminTaskConciergeAssignmentOutcome.success(
                    bookingResponseCompositionService.basicBookingResponse(booking));
        } catch (RuntimeException exception) {
            idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
            throw exception;
        }
    }
}
