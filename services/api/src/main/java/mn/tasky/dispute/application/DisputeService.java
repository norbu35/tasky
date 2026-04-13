package mn.tasky.dispute.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for managing disputes raised by taskers or customers
 * regarding specific bookings. Handles the lifecycle of disputes from creation to resolution.
 */
@Service
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);
    private static final long COMPLETED_DISPUTE_WINDOW_HOURS = 24L;

    private final BookingService bookingService;
    private final DisputeDao disputeDao;
    private final DisputeEvidenceDao disputeEvidenceDao;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public DisputeService(
            BookingService bookingService,
            DisputeDao disputeDao,
            DisputeEvidenceDao disputeEvidenceDao,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper) {
        this.bookingService = bookingService;
        this.disputeDao = disputeDao;
        this.disputeEvidenceDao = disputeEvidenceDao;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
    }

    /**
     * Raises a new dispute for a given booking.
     * Validates that the user is a participant, the booking is in a valid state for disputes,
     * and the dispute window has not expired.
     *
     * @param userId    The ID of the user raising the dispute.
     * @param bookingId The ID of the booking being disputed.
     * @param reason    The reason for the dispute.
     * @return A {@link DisputeRaiseResult} indicating success or failure with an error code.
     */
    public DisputeRaiseResult raiseDispute(String userId, String bookingId, String reason) {
        return raiseDispute(userId, bookingId, reason, null);
    }

    /**
     * Checks if the given booking has an open dispute.
     */
    public boolean hasOpenDispute(String bookingId) {
        return disputeDao.findOpenByBookingId(bookingId).isPresent();
    }

    /**
     * Raises a new dispute for a given booking, optionally with evidence items.
     * Evidence can be provided at creation time or added later within the 24h grace period.
     *
     * @param userId         The ID of the user raising the dispute.
     * @param bookingId      The ID of the booking being disputed.
     * @param reason         The reason for the dispute.
     * @param evidenceItems  Optional list of evidence items to attach.
     * @return A {@link DisputeRaiseResult} indicating success or failure with an error code.
     */
    @Transactional
    public DisputeRaiseResult raiseDispute(
            String userId, String bookingId, String reason, List<DisputeRequest.EvidenceItem> evidenceItems) {
        String sanitizedReason = TextSanitizer.plainText(reason);
        if (sanitizedReason == null || sanitizedReason.isBlank()) {
            return DisputeRaiseResult.error("INVALID_REASON");
        }

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return DisputeRaiseResult.error("BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        boolean participant =
                booking.customerId().equals(userId) || booking.taskerId().equals(userId);
        if (!participant) {
            return DisputeRaiseResult.error("FORBIDDEN");
        }

        if (!"ASSIGNED".equals(booking.status()) && !"COMPLETED".equals(booking.status())) {
            return DisputeRaiseResult.error("INVALID_STATUS");
        }
        if ("COMPLETED".equals(booking.status())) {
            Instant deadline = booking.updatedAt().plusSeconds(COMPLETED_DISPUTE_WINDOW_HOURS * 3600);
            if (Instant.now().isAfter(deadline)) {
                return DisputeRaiseResult.error("DISPUTE_WINDOW_EXPIRED");
            }
        }

        if (disputeDao.findOpenByBookingId(bookingId).isPresent()) {
            return DisputeRaiseResult.error("DISPUTE_EXISTS");
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Dispute dispute = new Dispute(id, bookingId, userId, sanitizedReason, "OPEN", null, null, null, now, null);
        disputeDao.insert(id, bookingId, userId, sanitizedReason, "OPEN", null, null, null, now, null);

        if (evidenceItems != null) {
            for (DisputeRequest.EvidenceItem item : evidenceItems) {
                String evidenceId = UUID.randomUUID().toString();
                String storageKey = "PHOTO".equals(item.type()) ? item.storageKey() : null;
                String textPayload = "CHAT_EXCERPT".equals(item.type()) || "WRITTEN_TIMELINE".equals(item.type())
                        ? TextSanitizer.plainText(item.textPayload())
                        : null;
                disputeEvidenceDao.insert(evidenceId, id, item.type(), storageKey, textPayload);
            }
        }

        return DisputeRaiseResult.success(dispute);
    }

    /**
     * Lists the first page of pending (OPEN) disputes.
     *
     * @return A list of {@link Dispute} objects.
     */
    public List<Dispute> listPendingDisputes() {
        return listPendingDisputes(null, 50);
    }

    /**
     * Lists pending (OPEN) disputes with pagination.
     *
     * @param cursor The pagination cursor.
     * @param limit  The maximum number of results to return.
     * @return A list of {@link Dispute} objects.
     */
    public List<Dispute> listPendingDisputes(String cursor, int limit) {
        return disputeDao.findPending(cursor, limit);
    }

    /**
     * Retrieves a dispute by its unique ID.
     *
     * @param disputeId The ID of the dispute.
     * @return An Optional containing the {@link Dispute}, or empty if not found.
     */
    public Optional<Dispute> getDispute(String disputeId) {
        return disputeDao.findById(disputeId);
    }

    /**
     * Retrieves evidence items attached to a dispute.
     *
     * @param disputeId The ID of the dispute.
     * @return A list of {@link DisputeEvidence} items.
     */
    public List<DisputeEvidence> getDisputeEvidence(String disputeId) {
        return disputeEvidenceDao.findByDisputeId(disputeId);
    }

    /**
     * Retrieves a dispute, ensuring the requesting user is a participant in the associated booking.
     *
     * @param disputeId The ID of the dispute.
     * @param userId    The ID of the user requesting the dispute.
     * @return An Optional containing the {@link Dispute}, or empty if not found or unauthorized.
     */
    public Optional<Dispute> getDisputeForUser(String disputeId, String userId) {
        Optional<Dispute> disputeOpt = disputeDao.findById(disputeId);
        if (disputeOpt.isEmpty()) {
            return Optional.empty();
        }

        Dispute dispute = disputeOpt.get();
        Optional<String> role = bookingService.getBooking(dispute.bookingId()).map(booking -> {
            if (booking.customerId().equals(userId) || booking.taskerId().equals(userId)) {
                return "PARTICIPANT";
            }
            return "NONE";
        });

        if ("PARTICIPANT".equals(role.orElse("NONE"))) {
            return Optional.of(dispute);
        }
        return Optional.empty();
    }

    /**
     * Resolves an open dispute. Admins can decide the outcome and provide notes.
     * Valid outcomes are "RESOLVE_TASKER", "RESOLVE_CUSTOMER", or "ESCALATE".
     *
     * @param adminId         The ID of the admin resolving the dispute.
     * @param disputeId       The ID of the dispute to resolve.
     * @param outcome         The resolution outcome.
     * @param resolutionNotes Notes explaining the resolution.
     * @return A {@link DisputeResolutionResult} indicating success or failure.
     */
    @Transactional
    public DisputeResolutionResult resolveDispute(
            String adminId, String disputeId, String outcome, String resolutionNotes) {
        String sanitizedNotes = TextSanitizer.plainText(resolutionNotes);
        var disputeOpt = disputeDao.findById(disputeId);
        if (disputeOpt.isEmpty()) {
            return DisputeResolutionResult.error("NOT_FOUND");
        }
        Dispute dispute = disputeOpt.get();
        if (!"OPEN".equals(dispute.status())) {
            return DisputeResolutionResult.error("NOT_OPEN");
        }

        var bookingOpt = bookingService.getBooking(dispute.bookingId());
        if (bookingOpt.isEmpty()) {
            return DisputeResolutionResult.error("BOOKING_NOT_FOUND");
        }

        String newStatus =
                switch (outcome) {
                    case "RESOLVE_TASKER" -> "RESOLVED_TASKER";
                    case "RESOLVE_CUSTOMER" -> "RESOLVED_CUSTOMER";
                    case "ESCALATE" -> "ESCALATED";
                    default -> null;
                };
        if (newStatus == null) {
            return DisputeResolutionResult.error("INVALID_OUTCOME");
        }

        Instant now = Instant.now();
        disputeDao.update(disputeId, newStatus, outcome, null, sanitizedNotes, now);
        auditEventDao.insert(
                adminId,
                "DISPUTE_RESOLVED",
                "DISPUTE",
                disputeId,
                toJson(Map.of(
                        "booking_id",
                        dispute.bookingId(),
                        "old_status",
                        dispute.status(),
                        "new_status",
                        newStatus,
                        "resolution_action",
                        outcome,
                        "resolution_notes",
                        sanitizedNotes == null ? "" : sanitizedNotes)));

        Dispute resolved = new Dispute(
                dispute.id(),
                dispute.bookingId(),
                dispute.raisedBy(),
                dispute.reason(),
                newStatus,
                outcome,
                null,
                sanitizedNotes,
                dispute.createdAt(),
                now);

        return DisputeResolutionResult.success(resolved);
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize dispute audit metadata.", exception);
        }
    }
}
