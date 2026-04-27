package mn.tasky.dispute.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.dispute.dto.DisputeEvidenceResult;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for managing disputes raised by taskers or customers
 * regarding specific bookings. Handles the lifecycle of disputes from creation to resolution.
 */
@Service
public class DisputeService {

    private static final long COMPLETED_DISPUTE_WINDOW_HOURS = 24L;
    private static final long EVIDENCE_GRACE_HOURS = 24L;
    private static final String STATUS_OPEN = "OPEN";
    private static final String STATUS_EVIDENCE_NEEDED = "EVIDENCE_NEEDED";
    private static final Set<String> EVIDENCE_TYPES = Set.of("PHOTO", "CHAT_EXCERPT", "WRITTEN_TIMELINE");

    private final BookingQueryPort bookingQueryPort;
    private final BookingCommandPort bookingCommandPort;
    private final DisputeDao disputeDao;
    private final DisputeEvidenceDao disputeEvidenceDao;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public DisputeService(
            BookingQueryPort bookingQueryPort,
            @Lazy BookingCommandPort bookingCommandPort,
            DisputeDao disputeDao,
            DisputeEvidenceDao disputeEvidenceDao,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper) {
        this.bookingQueryPort = bookingQueryPort;
        this.bookingCommandPort = bookingCommandPort;
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

        var bookingOpt = bookingQueryPort.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return DisputeRaiseResult.error("BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        boolean participant =
                booking.customerId().equals(userId) || booking.taskerId().equals(userId);
        if (!participant) {
            return DisputeRaiseResult.error("FORBIDDEN");
        }

        if (!"ASSIGNED".equals(booking.status())
                && !"PAID".equals(booking.status())
                && !"COMPLETED".equals(booking.status())) {
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

        List<SanitizedEvidenceItem> evidence = sanitizeEvidenceItems(evidenceItems);
        if (evidenceItems != null && evidence.size() != evidenceItems.size()) {
            return DisputeRaiseResult.error("INVALID_EVIDENCE");
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        boolean evidenceNeeded = evidence.isEmpty();
        String status = evidenceNeeded ? STATUS_EVIDENCE_NEEDED : STATUS_OPEN;
        Instant evidenceReminderSentAt = evidenceNeeded ? now : null;
        Instant evidenceDueAt = evidenceNeeded ? now.plus(EVIDENCE_GRACE_HOURS, ChronoUnit.HOURS) : null;
        Dispute dispute = new Dispute(
                id,
                bookingId,
                userId,
                sanitizedReason,
                status,
                null,
                null,
                null,
                now,
                null,
                evidenceReminderSentAt,
                evidenceDueAt);
        disputeDao.insert(
                id,
                bookingId,
                userId,
                sanitizedReason,
                status,
                null,
                null,
                null,
                now,
                null,
                evidenceReminderSentAt,
                evidenceDueAt);

        insertEvidence(id, evidence);

        bookingCommandPort.transitionToDisputed(bookingId);

        return DisputeRaiseResult.success(dispute);
    }

    @Transactional
    public DisputeEvidenceResult addEvidence(
            String userId, String disputeId, List<DisputeRequest.EvidenceItem> evidenceItems) {
        List<SanitizedEvidenceItem> evidence = sanitizeEvidenceItems(evidenceItems);
        if (evidenceItems == null || evidenceItems.isEmpty() || evidence.size() != evidenceItems.size()) {
            return DisputeEvidenceResult.error("INVALID_EVIDENCE");
        }

        Optional<Dispute> disputeOpt = disputeDao.findById(disputeId);
        if (disputeOpt.isEmpty()) {
            return DisputeEvidenceResult.error("NOT_FOUND");
        }

        Dispute dispute = disputeOpt.get();
        var bookingOpt = bookingQueryPort.getBooking(dispute.bookingId());
        if (bookingOpt.isEmpty()) {
            return DisputeEvidenceResult.error("NOT_FOUND");
        }
        var booking = bookingOpt.get();
        boolean participant =
                booking.customerId().equals(userId) || booking.taskerId().equals(userId);
        if (!participant) {
            return DisputeEvidenceResult.error("FORBIDDEN");
        }
        if (!STATUS_OPEN.equals(dispute.status()) && !STATUS_EVIDENCE_NEEDED.equals(dispute.status())) {
            return DisputeEvidenceResult.error("INVALID_STATUS");
        }

        insertEvidence(dispute.id(), evidence);
        if (STATUS_EVIDENCE_NEEDED.equals(dispute.status())) {
            disputeDao.markEvidenceSubmitted(dispute.id());
            return DisputeEvidenceResult.success(new Dispute(
                    dispute.id(),
                    dispute.bookingId(),
                    dispute.raisedBy(),
                    dispute.reason(),
                    STATUS_OPEN,
                    dispute.resolutionAction(),
                    dispute.wrongfulPartyUserId(),
                    dispute.resolutionNotes(),
                    dispute.createdAt(),
                    dispute.resolvedAt(),
                    dispute.evidenceReminderSentAt(),
                    dispute.evidenceDueAt()));
        }
        return DisputeEvidenceResult.success(dispute);
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
        Optional<String> role = bookingQueryPort.getBooking(dispute.bookingId()).map(booking -> {
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
        if (!STATUS_OPEN.equals(dispute.status())) {
            return DisputeResolutionResult.error("NOT_OPEN");
        }

        var bookingOpt = bookingQueryPort.getBooking(dispute.bookingId());
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
                now,
                dispute.evidenceReminderSentAt(),
                dispute.evidenceDueAt());

        return DisputeResolutionResult.success(resolved);
    }

    private void insertEvidence(String disputeId, List<SanitizedEvidenceItem> evidence) {
        for (SanitizedEvidenceItem item : evidence) {
            disputeEvidenceDao.insert(
                    UUID.randomUUID().toString(), disputeId, item.type(), item.storageKey(), item.textPayload());
        }
    }

    private List<SanitizedEvidenceItem> sanitizeEvidenceItems(List<DisputeRequest.EvidenceItem> evidenceItems) {
        if (evidenceItems == null || evidenceItems.isEmpty()) {
            return List.of();
        }
        return evidenceItems.stream()
                .map(this::sanitizeEvidenceItem)
                .flatMap(Optional::stream)
                .toList();
    }

    private Optional<SanitizedEvidenceItem> sanitizeEvidenceItem(DisputeRequest.EvidenceItem item) {
        if (item == null || item.type() == null || !EVIDENCE_TYPES.contains(item.type())) {
            return Optional.empty();
        }
        if ("PHOTO".equals(item.type())) {
            String storageKey = TextSanitizer.plainText(item.storageKey());
            if (storageKey == null || storageKey.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new SanitizedEvidenceItem(item.type(), storageKey, null));
        }
        String textPayload = TextSanitizer.plainText(item.textPayload());
        if (textPayload == null || textPayload.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(new SanitizedEvidenceItem(item.type(), null, textPayload));
    }

    private record SanitizedEvidenceItem(String type, String storageKey, String textPayload) {}

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize dispute audit metadata.", exception);
        }
    }
}
