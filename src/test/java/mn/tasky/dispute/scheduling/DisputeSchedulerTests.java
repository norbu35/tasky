package mn.tasky.dispute.scheduling;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DisputeSchedulerTests {

    @Mock
    private DisputeDao disputeDao;

    @Mock
    private DisputeEvidenceDao disputeEvidenceDao;

    @Mock
    private SchedulerLockRunner lockRunner;

    private DisputeEvidenceGraceScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DisputeEvidenceGraceScheduler(disputeDao, disputeEvidenceDao, lockRunner);
    }

    @Test
    @DisplayName("closeStaleDisputes delegates to lock runner with correct job name")
    void closeStaleDisputesDelegatesToLockRunner() {
        scheduler.closeStaleDisputes();

        verify(lockRunner).runWithLock(eq("dispute_evidence_grace"), any(Runnable.class));
    }

    @Test
    @DisplayName("closeStaleDisputes auto-closes disputes with zero evidence after 24h")
    void closesDisputesWithNoEvidence() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("dispute_evidence_grace"), any(Runnable.class));

        Instant now = Instant.now();
        Dispute dispute = new Dispute(
                "dispute-1", "booking-1", "user-1", "reason", "OPEN", null, null, null, now.minusSeconds(90000), null);
        when(disputeDao.findOpenOlderThan(any(Instant.class))).thenReturn(List.of(dispute));
        when(disputeEvidenceDao.countByDisputeId("dispute-1")).thenReturn(0);

        scheduler.closeStaleDisputes();

        verify(disputeDao)
                .update(
                        eq("dispute-1"),
                        eq("CLOSED_INSUFFICIENT_EVIDENCE"),
                        isNull(),
                        isNull(),
                        isNull(),
                        any(Instant.class));
    }

    @Test
    @DisplayName("closeStaleDisputes skips disputes that have evidence")
    void skipsDisputesWithEvidence() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("dispute_evidence_grace"), any(Runnable.class));

        Instant now = Instant.now();
        Dispute dispute = new Dispute(
                "dispute-2", "booking-2", "user-2", "reason", "OPEN", null, null, null, now.minusSeconds(90000), null);
        when(disputeDao.findOpenOlderThan(any(Instant.class))).thenReturn(List.of(dispute));
        when(disputeEvidenceDao.countByDisputeId("dispute-2")).thenReturn(3);

        scheduler.closeStaleDisputes();

        verify(disputeDao, never())
                .update(
                        eq("dispute-2"),
                        any(String.class),
                        any(String.class),
                        any(String.class),
                        any(String.class),
                        any(Instant.class));
    }

    @Test
    @DisplayName("closeStaleDisputes handles empty list gracefully")
    void handlesEmptyDisputeList() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("dispute_evidence_grace"), any(Runnable.class));

        when(disputeDao.findOpenOlderThan(any(Instant.class))).thenReturn(List.of());

        scheduler.closeStaleDisputes();

        verify(disputeEvidenceDao, never()).countByDisputeId(any(String.class));
    }
}
