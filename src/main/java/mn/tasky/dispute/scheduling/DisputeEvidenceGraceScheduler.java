package mn.tasky.dispute.scheduling;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Hourly scheduler that auto-closes OPEN disputes with zero evidence
 * after the 24-hour grace period has elapsed.
 */
@Component
public class DisputeEvidenceGraceScheduler {

    private static final Logger log = LoggerFactory.getLogger(DisputeEvidenceGraceScheduler.class);
    private static final String CLOSED_STATUS = "CLOSED_INSUFFICIENT_EVIDENCE";

    private final DisputeDao disputeDao;
    private final DisputeEvidenceDao disputeEvidenceDao;
    private final SchedulerLockRunner lockRunner;

    public DisputeEvidenceGraceScheduler(
            DisputeDao disputeDao, DisputeEvidenceDao disputeEvidenceDao, SchedulerLockRunner lockRunner) {
        this.disputeDao = disputeDao;
        this.disputeEvidenceDao = disputeEvidenceDao;
        this.lockRunner = lockRunner;
    }

    @Scheduled(fixedDelay = 3600000)
    public void closeStaleDisputes() {
        lockRunner.runWithLock("dispute_evidence_grace", this::processStaleDisputes);
    }

    private void processStaleDisputes() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        var disputes = disputeDao.findOpenOlderThan(cutoff);

        int closed = 0;
        for (Dispute dispute : disputes) {
            int evidenceCount = disputeEvidenceDao.countByDisputeId(dispute.id());
            if (evidenceCount == 0) {
                disputeDao.update(dispute.id(), CLOSED_STATUS, null, null, null, Instant.now());
                closed++;
                log.info("Auto-closed dispute {} — no evidence after 24h grace period", dispute.id());
            }
        }

        if (closed > 0) {
            log.info("Dispute evidence grace scheduler closed {} of {} eligible disputes", closed, disputes.size());
        }
    }
}
