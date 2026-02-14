package mn.tasky.wallet.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;

@Service
public class WalletService {

    private final ConcurrentHashMap<String, Long> balancesByUserId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> heldBalancesByUserId = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<LedgerEntry> ledger = new CopyOnWriteArrayList<>();
    private final ConcurrentHashMap<String, PayoutRequest> payoutsById = new ConcurrentHashMap<>();
    private final Set<String> creditedBookingIds = ConcurrentHashMap.newKeySet();

    public WalletBalance getBalance(String userId) {
        long balance = balancesByUserId.getOrDefault(userId, 0L);
        long pendingPayout = payoutsById.values().stream()
            .filter(p -> p.userId().equals(userId) && "PENDING".equals(p.status()))
            .mapToLong(PayoutRequest::amount)
            .sum();
        return new WalletBalance(balance, pendingPayout, "MNT");
    }

    public List<LedgerEntry> listTransactions(String userId) {
        List<LedgerEntry> entries = new ArrayList<>();
        for (LedgerEntry entry : ledger) {
            if (entry.userId().equals(userId)) {
                entries.add(entry);
            }
        }
        Collections.reverse(entries);
        return entries;
    }

    public void creditTaskCompletion(String taskerId, String bookingId, int totalAmount, double feePercent) {
        if (!creditedBookingIds.add(bookingId)) {
            return;
        }

        int feeAmount = (int) Math.round(totalAmount * feePercent);
        int creditAmount = totalAmount - feeAmount;

        Instant now = Instant.now();

        // Add credit entry
        LedgerEntry creditEntry = new LedgerEntry(
            UUID.randomUUID().toString(),
            taskerId,
            creditAmount,
            "DEPOSIT",
            bookingId,
            "Booking completion credit for #" + bookingId,
            now
        );
        ledger.add(creditEntry);

        // Update balance
        balancesByUserId.compute(taskerId, (id, current) -> (current == null ? 0L : current) + creditAmount);
        
        // Record platform fee (auditable)
        LedgerEntry feeEntry = new LedgerEntry(
            UUID.randomUUID().toString(),
            "SYSTEM",
            feeAmount,
            "FEE",
            bookingId,
            "Platform fee for booking #" + bookingId,
            now
        );
        ledger.add(feeEntry);
    }

    public void holdFunds(String userId, int amount, String referenceId, String description) {
        balancesByUserId.compute(userId, (id, current) -> {
            long currentVal = current == null ? 0L : current;
            if (currentVal < amount) throw new IllegalArgumentException("Insufficient balance to hold");
            return currentVal - amount;
        });
        heldBalancesByUserId.compute(userId, (id, current) -> (current == null ? 0L : current) + amount);
        
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(), userId, -amount, "HOLD", referenceId, description, Instant.now()
        ));
    }

    public void releaseFunds(String userId, int amount, String referenceId, String description) {
        heldBalancesByUserId.compute(userId, (id, current) -> {
            long currentVal = current == null ? 0L : current;
            if (currentVal < amount) throw new IllegalArgumentException("Insufficient held balance to release");
            return currentVal - amount;
        });
        balancesByUserId.compute(userId, (id, current) -> (current == null ? 0L : current) + amount);
        
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(), userId, amount, "RELEASE", referenceId, description, Instant.now()
        ));
    }

    public void confiscateFunds(String userId, int amount, String referenceId, String description) {
        heldBalancesByUserId.compute(userId, (id, current) -> {
            long currentVal = current == null ? 0L : current;
            if (currentVal < amount) throw new IllegalArgumentException("Insufficient held balance to confiscate");
            return currentVal - amount;
        });
        
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(), userId, -amount, "CONFISCATE", referenceId, description, Instant.now()
        ));
    }

    public String requestPayout(String userId, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Payout amount must be greater than zero");
        }

        balancesByUserId.compute(userId, (id, current) -> {
            long currentVal = current == null ? 0L : current;
            if (currentVal < amount) throw new IllegalArgumentException("Insufficient balance for payout");
            return currentVal - amount;
        });

        String payoutId = UUID.randomUUID().toString();
        PayoutRequest request = new PayoutRequest(payoutId, userId, amount, "PENDING", Instant.now());
        payoutsById.put(payoutId, request);
        return payoutId;
    }

    public List<PayoutRequest> listPendingPayouts() {
        return payoutsById.values().stream()
            .filter(p -> "PENDING".equals(p.status()))
            .toList();
    }

    public void processPayout(String payoutId) {
        PayoutRequest p = payoutsById.get(payoutId);
        if (p == null) throw new IllegalArgumentException("Payout not found");
        if (!"PENDING".equals(p.status())) throw new IllegalArgumentException("Payout already processed");

        payoutsById.put(payoutId, new PayoutRequest(p.id(), p.userId(), p.amount(), "PROCESSED", p.createdAt()));
        
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(), p.userId(), -p.amount(), "PAYOUT", p.id(), "Payout processed", Instant.now()
        ));
    }

    public void creditRefund(String userId, int amount, String bookingId, String description) {
        if (amount <= 0) {
            return;
        }
        balancesByUserId.compute(userId, (id, current) -> (current == null ? 0L : current) + amount);
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(),
            userId,
            amount,
            "REFUND",
            bookingId,
            description,
            Instant.now()
        ));
    }

    public void creditCancellationFee(String userId, int amount, String bookingId) {
        if (amount <= 0) {
            return;
        }
        balancesByUserId.compute(userId, (id, current) -> (current == null ? 0L : current) + amount);
        ledger.add(new LedgerEntry(
            UUID.randomUUID().toString(),
            userId,
            amount,
            "REFUND",
            bookingId,
            "Late cancellation fee for booking #" + bookingId,
            Instant.now()
        ));
    }

    public record WalletBalance(long balance, long pendingPayout, String currency) {
    }

    public record LedgerEntry(
        String id,
        String userId,
        int amount,
        String type,
        String referenceId,
        String description,
        Instant createdAt
    ) {
    }

    public record PayoutRequest(
        String id,
        String userId,
        int amount,
        String status,
        Instant createdAt
    ) {}
}
