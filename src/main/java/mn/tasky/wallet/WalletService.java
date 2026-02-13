package mn.tasky.wallet;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;

@Service
public class WalletService {

    private final ConcurrentHashMap<String, Long> balancesByUserId = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<LedgerEntry> ledger = new CopyOnWriteArrayList<>();

    public WalletBalance getBalance(String userId) {
        long balance = balancesByUserId.getOrDefault(userId, 0L);
        return new WalletBalance(balance, 0L, "MNT");
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
}
