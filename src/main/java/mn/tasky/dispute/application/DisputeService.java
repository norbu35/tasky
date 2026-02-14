package mn.tasky.dispute.application;

import mn.tasky.booking.application.BookingService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.wallet.application.WalletService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DisputeService {

    private final BookingService bookingService;
    private final WalletService walletService;
    private final ConcurrentHashMap<String, Dispute> disputesById = new ConcurrentHashMap<>();

    public DisputeService(BookingService bookingService, WalletService walletService) {
        this.bookingService = bookingService;
        this.walletService = walletService;
    }

    public DisputeRaiseResult raiseDispute(String userId, String bookingId, String reason) {
        var bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return DisputeRaiseResult.error("BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();

        if (!booking.customerId().equals(userId)) {
            return DisputeRaiseResult.error("FORBIDDEN");
        }

        if (!"COMPLETED".equals(booking.status())) {
            return DisputeRaiseResult.error("INVALID_STATUS");
        }

        boolean exists = disputesById.values().stream()
            .anyMatch(d -> d.bookingId().equals(bookingId) && "OPEN".equals(d.status()));
        if (exists) {
            return DisputeRaiseResult.error("DISPUTE_EXISTS");
        }

        Dispute dispute = new Dispute(
            UUID.randomUUID().toString(),
            bookingId,
            userId,
            reason,
            "OPEN",
            null,
            null,
            null,
            Instant.now(),
            null
        );
        disputesById.put(dispute.id(), dispute);

        // Hold funds
        int taskerShare = (int) (booking.price() * 0.9);
        walletService.holdFunds(booking.taskerId(), taskerShare, dispute.id(), "Dispute raised for booking " + bookingId);

        return DisputeRaiseResult.success(dispute);
    }

    public List<Dispute> listPendingDisputes() {
        return disputesById.values().stream()
            .filter(d -> "OPEN".equals(d.status()))
            .toList();
    }

    public DisputeResolutionResult resolveDispute(String adminId, String disputeId, String outcome, String resolutionNotes) {
        Dispute dispute = disputesById.get(disputeId);
        if (dispute == null) {
            return DisputeResolutionResult.error("NOT_FOUND");
        }
        if (!"OPEN".equals(dispute.status())) {
            return DisputeResolutionResult.error("NOT_OPEN");
        }

        var bookingOpt = bookingService.getBooking(dispute.bookingId());
        if (bookingOpt.isEmpty()) {
            return DisputeResolutionResult.error("BOOKING_NOT_FOUND");
        }
        var booking = bookingOpt.get();
        int taskerShare = (int) (booking.price() * 0.9);

        String newStatus;
        if ("RELEASE_FUNDS".equals(outcome)) {
            newStatus = "RESOLVED_RELEASED";
            walletService.releaseFunds(booking.taskerId(), taskerShare, disputeId, "Dispute resolved: Funds released");
        } else if ("REFUND_CUSTOMER".equals(outcome)) {
            newStatus = "RESOLVED_REFUNDED";
            walletService.confiscateFunds(booking.taskerId(), taskerShare, disputeId, "Dispute resolved: Refunded to customer");
        } else {
            return DisputeResolutionResult.error("INVALID_OUTCOME");
        }

        Dispute resolved = new Dispute(
            dispute.id(), dispute.bookingId(), dispute.raiserId(), dispute.reason(),
            newStatus, outcome, adminId, resolutionNotes, dispute.createdAt(), Instant.now()
        );
        disputesById.put(disputeId, resolved);

        return DisputeResolutionResult.success(resolved);
    }
}
