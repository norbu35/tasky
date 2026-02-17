package mn.tasky.dispute.application;

import mn.tasky.booking.application.BookingService;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DisputeService {

    private static final long COMPLETED_DISPUTE_WINDOW_HOURS = 24L;

    private final BookingService bookingService;
    private final DisputeDao disputeDao;

    public DisputeService(BookingService bookingService, DisputeDao disputeDao) {
        this.bookingService = bookingService;
        this.disputeDao = disputeDao;
    }

    public DisputeRaiseResult raiseDispute(String userId, String bookingId, String reason) {
        String sanitizedReason = TextSanitizer.plainText(reason);
        if (sanitizedReason == null || sanitizedReason.isBlank()) {
            return DisputeRaiseResult.error("INVALID_REASON");
        }

        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return DisputeRaiseResult.error("BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        boolean participant = booking.customerId().equals(userId) || booking.taskerId().equals(userId);
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

        return DisputeRaiseResult.success(dispute);
    }

    public List<Dispute> listPendingDisputes() {
        return listPendingDisputes(null, 50);
    }

    public List<Dispute> listPendingDisputes(String cursor, int limit) {
        return disputeDao.findPending(cursor, limit);
    }

    public Optional<Dispute> getDispute(String disputeId) {
        return disputeDao.findById(disputeId);
    }

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

    public DisputeResolutionResult resolveDispute(String adminId, String disputeId, String outcome, String resolutionNotes) {
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

        String newStatus = switch (outcome) {
            case "RESOLVE_TASKER" -> "RESOLVED_TASKER";
            case "RESOLVE_CUSTOMER" -> "RESOLVED_CUSTOMER";
            case "ESCALATE" -> "ESCALATED";
            default -> null;
        };
        if (newStatus == null) {
            return DisputeResolutionResult.error("INVALID_OUTCOME");
        }

        Instant now = Instant.now();
        disputeDao.update(disputeId, newStatus, outcome, adminId, sanitizedNotes, now);

        Dispute resolved = new Dispute(
            dispute.id(), dispute.bookingId(), dispute.raiserId(), dispute.reason(),
            newStatus, outcome, adminId, sanitizedNotes, dispute.createdAt(), now
        );

        return DisputeResolutionResult.success(resolved);
    }
}
