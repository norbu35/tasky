package mn.tasky.runtime.adminapi.composition;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AdminBookingCompositionService {

    private static final Logger log = LoggerFactory.getLogger(AdminBookingCompositionService.class);

    private final BookingQueryPort bookingQueryPort;
    private final BookingCommandPort bookingCommandPort;
    private final AdminAuditCommandPort adminAuditCommandPort;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public AdminBookingCompositionService(
            BookingQueryPort bookingQueryPort,
            BookingCommandPort bookingCommandPort,
            AdminAuditCommandPort adminAuditCommandPort,
            IdempotencyService idempotencyService,
            ObjectMapper objectMapper) {
        this.bookingQueryPort = bookingQueryPort;
        this.bookingCommandPort = bookingCommandPort;
        this.adminAuditCommandPort = adminAuditCommandPort;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    public Optional<Map<String, Object>> bookingDetail(String bookingId) {
        return bookingQueryPort.getBooking(bookingId).map(this::toBookingDetailResponse);
    }

    public AdminBookingOverrideOutcome overrideBookingStatus(
            String adminId, String bookingId, String newStatus, String reason, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return AdminBookingOverrideOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return AdminBookingOverrideOutcome.replayMissing();
            }
            return bookingQueryPort
                    .getBooking(claim.record().resourceId().toString())
                    .map(booking -> AdminBookingOverrideOutcome.success(toBookingDetailResponse(booking)))
                    .orElseGet(AdminBookingOverrideOutcome::replayMissing);
        }

        try {
            var result = bookingCommandPort.forceTransition(bookingId, newStatus);
            if (!result.isSuccess()) {
                idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
                if ("NOT_FOUND".equals(result.errorCode())) {
                    return AdminBookingOverrideOutcome.notFound();
                }
                return AdminBookingOverrideOutcome.invalidTransition();
            }

            BookingState updated = result.booking();

            // Record audit events
            String metadataJson = serializeMetadata(Map.of(
                    "booking_id", bookingId,
                    "old_status", "ADMIN_OVERRIDE",
                    "new_status", newStatus,
                    "reason", reason));
            adminAuditCommandPort.recordAdminAction(
                    adminId, "BOOKING_STATUS_OVERRIDE", "BOOKING", bookingId, metadataJson);

            idempotencyService.completeWithResource(
                    adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey, "BOOKING", bookingId);
            log.info("Admin {} overrode booking {} to status {}", adminId, bookingId, newStatus);

            return AdminBookingOverrideOutcome.success(toBookingDetailResponse(updated));
        } catch (RuntimeException exception) {
            idempotencyService.abandon(adminId, IdempotencyOperations.CONCIERGE_ASSIGN, idempotencyKey);
            throw exception;
        }
    }

    private Map<String, Object> toBookingDetailResponse(BookingState booking) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", booking.id());
        response.put("task_id", booking.taskId());
        response.put("tasker_id", booking.taskerId());
        response.put("customer_id", booking.customerId());
        response.put("price", booking.price());
        response.put("status", booking.status());
        response.put("cancellation_fee", booking.cancellationFee());
        response.put("liability_disclaimer_accepted", booking.liabilityDisclaimerAccepted());
        response.put(
                "confirmed_scheduled_at",
                booking.confirmedScheduledAt() != null
                        ? booking.confirmedScheduledAt().toString()
                        : null);
        response.put("settlement_mode", booking.settlementMode());
        response.put("late_cancel_incident", booking.lateCancelIncident());
        response.put(
                "liability_disclaimer_accepted_at",
                booking.liabilityDisclaimerAcceptedAt() != null
                        ? booking.liabilityDisclaimerAcceptedAt().toString()
                        : null);
        response.put("created_at", booking.createdAt().toString());
        response.put("updated_at", booking.updatedAt().toString());
        return response;
    }

    private String serializeMetadata(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit metadata", e);
            return data.toString();
        }
    }
}
