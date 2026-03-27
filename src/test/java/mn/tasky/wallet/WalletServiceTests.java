package mn.tasky.wallet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dao.CreditedBookingDao;
import mn.tasky.wallet.dao.LedgerEntryDao;
import mn.tasky.wallet.dao.PayoutRequestDao;
import mn.tasky.wallet.dao.WalletDao;
import mn.tasky.wallet.dto.PayoutRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    @Mock
    private AuditEventDao auditEventDao;

    private WalletService walletService;

    @BeforeEach
    void setUp() {
        walletService = new WalletService(
                walletDao, ledgerEntryDao, payoutRequestDao, creditedBookingDao, auditEventDao, new ObjectMapper());
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

    @Test
    @DisplayName("TID-TASK-034-DOMAIN-PAYOUT-CAS payout processing stops when compare-and-set loses")
    void processPayoutStopsWhenCompareAndSetFails() {
        String payoutId = uuid(5);
        String taskerId = uuid(6);
        when(payoutRequestDao.findById(payoutId))
                .thenReturn(Optional.of(new PayoutRequest(
                        payoutId, taskerId, 5000, "PENDING", Instant.parse("2026-03-27T00:00:00Z"))));
        when(payoutRequestDao.updateStatusIfCurrent(eq(payoutId), eq("PENDING"), eq("PROCESSED"), any()))
                .thenReturn(0);

        assertThatThrownBy(() -> walletService.processPayout(uuid(7), payoutId, "Manual release"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(ledgerEntryDao, never())
                .insert(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyInt(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        any());
        verify(auditEventDao, never())
                .insert(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("TID-TASK-034-AUDIT-PAYOUT-PROCESS payout audit metadata includes actor state change and reason")
    void processPayoutWritesAuditMetadata() {
        String actorId = uuid(8);
        String payoutId = uuid(9);
        String taskerId = uuid(10);
        when(payoutRequestDao.findById(payoutId))
                .thenReturn(Optional.of(new PayoutRequest(
                        payoutId, taskerId, 5000, "PENDING", Instant.parse("2026-03-27T00:00:00Z"))));
        when(payoutRequestDao.updateStatusIfCurrent(eq(payoutId), eq("PENDING"), eq("PROCESSED"), any()))
                .thenReturn(1);

        walletService.processPayout(actorId, payoutId, "Manual settlement release");

        ArgumentCaptor<String> metadataCaptor = ArgumentCaptor.forClass(String.class);
        verify(auditEventDao)
                .insert(eq(actorId), eq("PAYOUT_PROCESSED"), eq("PAYOUT"), eq(payoutId), metadataCaptor.capture());
        String metadata = metadataCaptor.getValue();
        assertThat(metadata).contains("\"user_id\":\"" + taskerId + "\"");
        assertThat(metadata).contains("\"old_status\":\"PENDING\"");
        assertThat(metadata).contains("\"new_status\":\"PROCESSED\"");
        assertThat(metadata).contains("\"reason\":\"Manual settlement release\"");
    }
}
