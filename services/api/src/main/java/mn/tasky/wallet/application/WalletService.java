package mn.tasky.wallet.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.wallet.dao.CreditedBookingDao;
import mn.tasky.wallet.dao.LedgerEntryDao;
import mn.tasky.wallet.dao.PayoutRequestDao;
import mn.tasky.wallet.dao.WalletDao;
import mn.tasky.wallet.dto.LedgerEntry;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.dto.WalletBalance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user wallets, financial transactions, holds, and payouts.
 * Handles platform fee deductions and ensures balance integrity.
 */
@Service
public class WalletService {

    private static final Logger log = LoggerFactory.getLogger(WalletService.class);

    private final WalletDao walletDao;
    private final LedgerEntryDao ledgerEntryDao;
    private final PayoutRequestDao payoutRequestDao;
    private final CreditedBookingDao creditedBookingDao;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public WalletService(
            WalletDao walletDao,
            LedgerEntryDao ledgerEntryDao,
            PayoutRequestDao payoutRequestDao,
            CreditedBookingDao creditedBookingDao,
            AuditEventDao auditEventDao,
            ObjectMapper objectMapper) {
        this.walletDao = walletDao;
        this.ledgerEntryDao = ledgerEntryDao;
        this.payoutRequestDao = payoutRequestDao;
        this.creditedBookingDao = creditedBookingDao;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
    }

    public WalletBalance getBalance(String userId) {
        walletDao.ensureExists(userId, Instant.now());
        Long balance = walletDao.getBalance(userId);
        long pendingPayout = payoutRequestDao.sumPendingByUserId(userId);
        return new WalletBalance(balance != null ? balance : 0L, pendingPayout, "MNT");
    }

    public List<LedgerEntry> listTransactions(String userId) {
        return ledgerEntryDao.findByUserId(userId);
    }

    @Transactional
    public void creditTaskCompletion(String taskerId, String bookingId, int totalAmount, int feeBasisPoints) {
        if (creditedBookingDao.tryInsert(bookingId) == 0) {
            return;
        }

        int feeAmount = (int) ((long) totalAmount * feeBasisPoints / 10_000);
        int creditAmount = totalAmount - feeAmount;

        Instant now = Instant.now();
        walletDao.ensureExists(taskerId, now);

        ledgerEntryDao.insert(
                UUID.randomUUID().toString(),
                taskerId,
                creditAmount,
                "DEPOSIT",
                bookingId,
                "Booking completion credit for #" + bookingId,
                now);
        walletDao.addBalance(taskerId, creditAmount, now);

        ledgerEntryDao.insert(
                UUID.randomUUID().toString(),
                null,
                feeAmount,
                "FEE",
                bookingId,
                "Platform fee for booking #" + bookingId,
                now);

        log.info(
                "wallet_credit taskerId={} bookingId={} creditAmount={} feeAmount={}",
                taskerId,
                bookingId,
                creditAmount,
                feeAmount);
    }

    @Transactional
    public void holdFunds(String userId, int amount, String referenceId, String description) {
        walletDao.ensureExists(userId, Instant.now());
        Instant now = Instant.now();
        int rows = walletDao.debitBalance(userId, amount, now);
        if (rows == 0) {
            throw new IllegalArgumentException("Insufficient balance to hold");
        }
        walletDao.addHeldBalance(userId, amount, now);
        ledgerEntryDao.insert(UUID.randomUUID().toString(), userId, -amount, "HOLD", referenceId, description, now);
        log.info("wallet_hold userId={} amount={} referenceId={}", userId, amount, referenceId);
    }

    @Transactional
    public void releaseFunds(String userId, int amount, String referenceId, String description) {
        Instant now = Instant.now();
        int rows = walletDao.debitHeldBalance(userId, amount, now);
        if (rows == 0) {
            throw new IllegalArgumentException("Insufficient held balance to release");
        }
        walletDao.addBalance(userId, amount, now);
        ledgerEntryDao.insert(UUID.randomUUID().toString(), userId, amount, "RELEASE", referenceId, description, now);
        log.info("wallet_release userId={} amount={} referenceId={}", userId, amount, referenceId);
    }

    @Transactional
    public void confiscateFunds(String userId, int amount, String referenceId, String description) {
        Instant now = Instant.now();
        int rows = walletDao.debitHeldBalance(userId, amount, now);
        if (rows == 0) {
            throw new IllegalArgumentException("Insufficient held balance to confiscate");
        }
        ledgerEntryDao.insert(
                UUID.randomUUID().toString(), userId, -amount, "CONFISCATE", referenceId, description, now);
        log.info("wallet_confiscate userId={} amount={} referenceId={}", userId, amount, referenceId);
    }

    @Transactional
    public String requestPayout(String userId, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Payout amount must be greater than zero");
        }

        walletDao.ensureExists(userId, Instant.now());
        Instant now = Instant.now();
        int rows = walletDao.debitBalance(userId, amount, now);
        if (rows == 0) {
            throw new IllegalArgumentException("Insufficient balance for payout");
        }

        String payoutId = UUID.randomUUID().toString();
        payoutRequestDao.insert(payoutId, userId, amount, "PENDING", now);
        log.info("wallet_payout_requested userId={} amount={} payoutId={}", userId, amount, payoutId);
        return payoutId;
    }

    public List<PayoutRequest> listPendingPayouts() {
        return payoutRequestDao.findPending();
    }

    public Optional<PayoutRequest> getPayout(String payoutId) {
        return payoutRequestDao.findById(payoutId);
    }

    @Transactional
    public void processPayout(String actorUserId, String payoutId, String reason) {
        Optional<PayoutRequest> payoutOpt = payoutRequestDao.findById(payoutId);
        if (payoutOpt.isEmpty()) {
            throw new IllegalArgumentException("Payout not found");
        }
        PayoutRequest payout = payoutOpt.get();
        if (!"PENDING".equals(payout.status())) {
            throw new IllegalArgumentException("Payout already processed");
        }

        Instant now = Instant.now();
        int updatedRows = payoutRequestDao.updateStatusIfCurrent(payoutId, "PENDING", "PROCESSED", now);
        if (updatedRows == 0) {
            throw new IllegalArgumentException("Payout already processed");
        }
        String sanitizedReason = TextSanitizer.plainText(reason);
        if (sanitizedReason == null || sanitizedReason.isBlank()) {
            throw new IllegalArgumentException("Payout processing reason is required");
        }

        ledgerEntryDao.insert(
                UUID.randomUUID().toString(),
                payout.userId(),
                -payout.amount(),
                "PAYOUT",
                payout.id(),
                "Payout processed",
                now);
        auditEventDao.insert(
                actorUserId, "PAYOUT_PROCESSED", "PAYOUT", payout.id(), toAuditMetadata(payout, sanitizedReason));
        log.info(
                "wallet_payout_processed payoutId={} userId={} amount={} actorUserId={}",
                payoutId,
                payout.userId(),
                payout.amount(),
                actorUserId);
    }

    @Transactional
    public void creditRefund(String userId, int amount, String bookingId, String description) {
        if (amount <= 0) {
            return;
        }
        walletDao.ensureExists(userId, Instant.now());
        Instant now = Instant.now();
        walletDao.addBalance(userId, amount, now);
        ledgerEntryDao.insert(UUID.randomUUID().toString(), userId, amount, "REFUND", bookingId, description, now);
        log.info("wallet_refund userId={} amount={} bookingId={}", userId, amount, bookingId);
    }

    @Transactional
    public void creditCancellationFee(String userId, int amount, String bookingId) {
        if (amount <= 0) {
            return;
        }
        walletDao.ensureExists(userId, Instant.now());
        Instant now = Instant.now();
        walletDao.addBalance(userId, amount, now);
        ledgerEntryDao.insert(
                UUID.randomUUID().toString(),
                userId,
                amount,
                "REFUND",
                bookingId,
                "Late cancellation fee for booking #" + bookingId,
                now);
        log.info("wallet_cancellation_fee userId={} amount={} bookingId={}", userId, amount, bookingId);
    }

    private String toAuditMetadata(PayoutRequest payout, String reason) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "user_id",
                    payout.userId(),
                    "amount",
                    payout.amount(),
                    "old_status",
                    "PENDING",
                    "new_status",
                    "PROCESSED",
                    "reason",
                    reason));
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize payout audit metadata.", exception);
        }
    }
}
