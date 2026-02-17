package mn.tasky.dispute.application;

import mn.tasky.booking.application.BookingService;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.wallet.application.WalletService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DisputeService {

    private final BookingService bookingService;
    private final WalletService walletService;
    private final DisputeDao disputeDao;

    public DisputeService(BookingService bookingService, WalletService walletService, DisputeDao disputeDao) {
        this.bookingService = bookingService;
        this.walletService = walletService;
        this.disputeDao = disputeDao;
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

        if (disputeDao.findOpenByBookingId(bookingId).isPresent()) {
            return DisputeRaiseResult.error("DISPUTE_EXISTS");
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Dispute dispute = new Dispute(id, bookingId, userId, reason, "OPEN", null, null, null, now, null);
        disputeDao.insert(id, bookingId, userId, reason, "OPEN", null, null, null, now, null);

        int taskerShare = (int) (booking.price() * 0.9);
        walletService.holdFunds(booking.taskerId(), taskerShare, dispute.id(), "Dispute raised for booking " + bookingId);

        return DisputeRaiseResult.success(dispute);
    }

    public List<Dispute> listPendingDisputes() {
        return disputeDao.findPending();
    }

    public DisputeResolutionResult resolveDispute(String adminId, String disputeId, String outcome, String resolutionNotes) {
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

        Instant now = Instant.now();
        disputeDao.update(disputeId, newStatus, outcome, adminId, resolutionNotes, now);

        Dispute resolved = new Dispute(
            dispute.id(), dispute.bookingId(), dispute.raiserId(), dispute.reason(),
            newStatus, outcome, adminId, resolutionNotes, dispute.createdAt(), now
        );

        return DisputeResolutionResult.success(resolved);
    }
}
