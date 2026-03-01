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

/**
 * Service managing user wallets, financial transactions, holds, and payouts.
 * Handles platform fee deductions and ensures balance integrity.
 */
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

    /**
     * Retrieves the current balance and pending payouts for a given user.
     * Ensures the wallet exists before querying.
     *
     * @param userId The ID of the user.
     * @return A {@link WalletBalance} object representing the user's funds.
     */
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

    /**
     * Lists all ledger entries (transactions) for a specific user.
     *
     * @param userId The ID of the user.
     * @return A list of {@link LedgerEntry} objects.
     */
    public List<LedgerEntry> listTransactions(String userId) {
        return ledgerEntryDao.findByUserId(userId);
    }

    /**
     * Credits the tasker's wallet upon task completion, deducting the platform fee.
     * Records the deposit for the tasker and the fee for the platform.
     *
     * @param taskerId    The ID of the tasker receiving the funds.
     * @param bookingId   The ID of the completed booking.
     * @param totalAmount The total amount paid by the customer.
     * @param feePercent  The platform fee percentage (e.g., 0.15 for 15%).
     */
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

    /**
     * Holds a specified amount of funds in the user's wallet, reducing their available balance.
     * Used typically during disputes or pending operations.
     *
     * @param userId      The ID of the user.
     * @param amount      The amount to hold.
     * @param referenceId A reference ID (e.g., dispute ID).
     * @param description A description of why funds are held.
     */
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

    /**
     * Releases previously held funds back into the user's available balance.
     *
     * @param userId      The ID of the user.
     * @param amount      The amount to release.
     * @param referenceId A reference ID.
     * @param description A description of the release.
     */
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

    /**
     * Confiscates currently held funds, permanently removing them from the user's account.
     * Typically used when a dispute is resolved against the user.
     *
     * @param userId      The ID of the user.
     * @param amount      The amount to confiscate.
     * @param referenceId A reference ID.
     * @param description A description of the confiscation.
     */
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

    /**
     * Initiates a request to withdraw funds from the wallet.
     * Deducts the requested amount from the available balance and creates a pending payout request.
     *
     * @param userId The ID of the user requesting the payout.
     * @param amount The amount to withdraw.
     * @return The ID of the generated payout request.
     */
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

    /**
     * Retrieves all payout requests that are currently in a PENDING state.
     *
     * @return A list of pending {@link PayoutRequest} objects.
     */
    public List<PayoutRequest> listPendingPayouts() {
        return payoutRequestDao.findPending();
    }

    /**
     * Retrieves a specific payout request by its ID.
     *
     * @param payoutId The ID of the payout request.
     * @return An Optional containing the {@link PayoutRequest} if found.
     */
    public Optional<PayoutRequest> getPayout(String payoutId) {
        return payoutRequestDao.findById(payoutId);
    }

    /**
     * Processes a pending payout request, marking it as PROCESSED and creating a ledger entry.
     *
     * @param payoutId The ID of the payout request to process.
     */
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

    /**
     * Credits a refund to the user's wallet.
     *
     * @param userId      The ID of the user receiving the refund.
     * @param amount      The refunded amount.
     * @param bookingId   The ID of the associated booking.
     * @param description A description of the refund.
     */
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

    /**
     * Credits a late cancellation fee to the user's wallet.
     *
     * @param userId    The ID of the user receiving the cancellation fee.
     * @param amount    The fee amount.
     * @param bookingId The ID of the canceled booking.
     */
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
