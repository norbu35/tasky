package mn.tasky.wallet;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dao.CreditedBookingDao;
import mn.tasky.wallet.dao.LedgerEntryDao;
import mn.tasky.wallet.dao.PayoutRequestDao;
import mn.tasky.wallet.dao.WalletDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WalletServiceTests {

    @Mock
    private WalletDao walletDao;

    @Mock
    private LedgerEntryDao ledgerEntryDao;

    @Mock
    private PayoutRequestDao payoutRequestDao;

    @Mock
    private CreditedBookingDao creditedBookingDao;

    private WalletService walletService;

    @BeforeEach
    void setUp() {
        walletService = new WalletService(walletDao, ledgerEntryDao, payoutRequestDao, creditedBookingDao);
    }

    @Test
    @DisplayName("TID-TASK-033-DOMAIN-WALLET-CREDIT TID-TASK-033-DOMAIN-FEE-DEDUCTION completion "
            + "credit applies fee deduction before net deposit")
    void creditTaskCompletionAppliesFeeAndNetDeposit() {
        String taskerId = uuid(1);
        String bookingId = uuid(2);
        when(creditedBookingDao.tryInsert(bookingId)).thenReturn(1);

        walletService.creditTaskCompletion(taskerId, bookingId, 10000, 1000);

        verify(walletDao).ensureExists(eq(taskerId), any());
        verify(walletDao).addBalance(eq(taskerId), eq(9000L), any());
        verify(ledgerEntryDao)
                .insert(
                        any(),
                        eq(taskerId),
                        eq(9000),
                        eq("DEPOSIT"),
                        eq(bookingId),
                        org.mockito.ArgumentMatchers.contains(bookingId),
                        any());
        verify(ledgerEntryDao)
                .insert(
                        any(),
                        isNull(),
                        eq(1000),
                        eq("FEE"),
                        eq(bookingId),
                        org.mockito.ArgumentMatchers.contains(bookingId),
                        any());
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    @Test
    void creditTaskCompletionIsIdempotentPerBooking() {
        String taskerId = uuid(3);
        String bookingId = uuid(4);
        when(creditedBookingDao.tryInsert(bookingId)).thenReturn(0);

        walletService.creditTaskCompletion(taskerId, bookingId, 10000, 1000);

        verify(walletDao, never())
                .addBalance(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyLong(), any());
        verify(ledgerEntryDao, never())
                .insert(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyInt(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        any());
    }
}
