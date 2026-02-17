package mn.tasky.wallet.application;

import mn.tasky.wallet.dao.CreditedBookingDao;
import mn.tasky.wallet.dao.LedgerEntryDao;
import mn.tasky.wallet.dao.PayoutRequestDao;
import mn.tasky.wallet.dao.WalletDao;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.dto.WalletBalance;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WalletService {

    private final WalletDao walletDao;
    private final LedgerEntryDao ledgerEntryDao;
    private final PayoutRequestDao payoutRequestDao;
    private final CreditedBookingDao creditedBookingDao;

    public WalletService(WalletDao walletDao,
                         LedgerEntryDao ledgerEntryDao,
                         PayoutRequestDao payoutRequestDao,
                         CreditedBookingDao creditedBookingDao) {
        this.walletDao          = walletDao;
        this.ledgerEntryDao     = ledgerEntryDao;
        this.payoutRequestDao   = payoutRequestDao;
        this.creditedBookingDao = creditedBookingDao;
    }

    public WalletBalance getBalance(String userId) {
        walletDao.ensureExists(userId,
                               Instant.now());
        Long balance = walletDao.getBalance(userId);
        long pendingPayout = payoutRequestDao.sumPendingByUserId(userId);
        return new WalletBalance(balance != null
                                         ? balance
                                         : 0L,
                                 pendingPayout,
                                 "MNT");
    }

    public List<LedgerEntry> listTransactions(String userId) {
        return ledgerEntryDao.findByUserId(userId);
    }

    public void creditTaskCompletion(String taskerId,
                                     String bookingId,
                                     int totalAmount,
                                     double feePercent) {
        if (creditedBookingDao.tryInsert(bookingId) == 0) {
            return;
        }

        int feeAmount = (int) Math.round(totalAmount * feePercent);
        int creditAmount = totalAmount - feeAmount;

        Instant now = Instant.now();
        walletDao.ensureExists(taskerId,
                               now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                taskerId,
                creditAmount,
                "DEPOSIT",
                bookingId,
                "Booking completion credit for #" + bookingId,
                now
        );
        walletDao.addBalance(taskerId,
                             creditAmount,
                             now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                null,
                feeAmount,
                "FEE",
                bookingId,
                "Platform fee for booking #" + bookingId,
                now
        );
    }

    public void holdFunds(String userId,
                          int amount,
                          String referenceId,
                          String description) {
        walletDao.ensureExists(userId,
                               Instant.now());
        Long currentBalance = walletDao.getBalance(userId);
        if (currentBalance == null || currentBalance < amount) {
            throw new IllegalArgumentException("Insufficient balance to hold");
        }

        Instant now = Instant.now();
        walletDao.addBalance(userId,
                             -amount,
                             now);
        walletDao.addHeldBalance(userId,
                                 amount,
                                 now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                -amount,
                "HOLD",
                referenceId,
                description,
                now
        );
    }

    public void releaseFunds(String userId,
                             int amount,
                             String referenceId,
                             String description) {
        Long currentHeld = walletDao.getHeldBalance(userId);
        if (currentHeld == null || currentHeld < amount) {
            throw new IllegalArgumentException("Insufficient held balance to release");
        }

        Instant now = Instant.now();
        walletDao.addHeldBalance(userId,
                                 -amount,
                                 now);
        walletDao.addBalance(userId,
                             amount,
                             now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                amount,
                "RELEASE",
                referenceId,
                description,
                now
        );
    }

    public void confiscateFunds(String userId,
                                int amount,
                                String referenceId,
                                String description) {
        Long currentHeld = walletDao.getHeldBalance(userId);
        if (currentHeld == null || currentHeld < amount) {
            throw new IllegalArgumentException("Insufficient held balance to confiscate");
        }

        Instant now = Instant.now();
        walletDao.addHeldBalance(userId,
                                 -amount,
                                 now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                -amount,
                "CONFISCATE",
                referenceId,
                description,
                now
        );
    }

    public String requestPayout(String userId,
                                int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Payout amount must be greater than zero");
        }

        walletDao.ensureExists(userId,
                               Instant.now());
        Long currentBalance = walletDao.getBalance(userId);
        if (currentBalance == null || currentBalance < amount) {
            throw new IllegalArgumentException("Insufficient balance for payout");
        }

        walletDao.addBalance(userId,
                             -amount,
                             Instant.now());

        String payoutId = UUID.randomUUID()
                .toString();
        payoutRequestDao.insert(payoutId,
                                userId,
                                amount,
                                "PENDING",
                                Instant.now());
        return payoutId;
    }

    public List<PayoutRequest> listPendingPayouts() {
        return payoutRequestDao.findPending();
    }

    public Optional<PayoutRequest> getPayout(String payoutId) {
        return payoutRequestDao.findById(payoutId);
    }

    public void processPayout(String payoutId) {
        Optional<PayoutRequest> pOpt = payoutRequestDao.findById(payoutId);
        if (pOpt.isEmpty()) throw new IllegalArgumentException("Payout not found");
        PayoutRequest p = pOpt.get();
        if (!"PENDING".equals(p.status()))
            throw new IllegalArgumentException("Payout already processed");

        Instant now = Instant.now();
        payoutRequestDao.updateStatus(payoutId,
                                      "PROCESSED",
                                      now);

        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                p.userId(),
                -p.amount(),
                "PAYOUT",
                p.id(),
                "Payout processed",
                now
        );
    }

    public void creditRefund(String userId,
                             int amount,
                             String bookingId,
                             String description) {
        if (amount <= 0) {
            return;
        }
        walletDao.ensureExists(userId,
                               Instant.now());
        Instant now = Instant.now();
        walletDao.addBalance(userId,
                             amount,
                             now);
        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                amount,
                "REFUND",
                bookingId,
                description,
                now
        );
    }

    public void creditCancellationFee(String userId,
                                      int amount,
                                      String bookingId) {
        if (amount <= 0) {
            return;
        }
        walletDao.ensureExists(userId,
                               Instant.now());
        Instant now = Instant.now();
        walletDao.addBalance(userId,
                             amount,
                             now);
        ledgerEntryDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                amount,
                "REFUND",
                bookingId,
                "Late cancellation fee for booking #" + bookingId,
                now
        );
    }

}
