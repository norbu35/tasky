package mn.tasky.auth.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.ReliabilityScoreDao;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.review.dao.ReviewDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Computes a weighted reliability score for taskers over a trailing 90-day window.
 * Weights: completion 40%, punctuality 20%, cancellation 20%, review average 20%.
 * Minimum 5 bookings required before score is computed (cold-start guard).
 */
@Service
public class ReliabilityScoreService {

    private static final Logger log = LoggerFactory.getLogger(ReliabilityScoreService.class);
    private static final int WINDOW_DAYS = 90;
    private static final int MIN_SAMPLE_SIZE = 5;

    private final BookingDao bookingDao;
    private final ReviewDao reviewDao;
    private final ReliabilityScoreDao reliabilityScoreDao;
    private final ProfileDao profileDao;

    public ReliabilityScoreService(
            BookingDao bookingDao,
            ReviewDao reviewDao,
            ReliabilityScoreDao reliabilityScoreDao,
            ProfileDao profileDao) {
        this.bookingDao = bookingDao;
        this.reviewDao = reviewDao;
        this.reliabilityScoreDao = reliabilityScoreDao;
        this.profileDao = profileDao;
    }

    /**
     * Recomputes the reliability score for the given tasker over the trailing 90-day window.
     * If total bookings (completed + cancelled + no-show) is below 5, computation is skipped
     * to avoid noisy scores from small samples.
     *
     * @param taskerId the tasker's user ID
     */
    public void recompute(String taskerId) {
        Instant since = Instant.now().minus(WINDOW_DAYS, ChronoUnit.DAYS);

        int completed = bookingDao.countByTaskerAndStatusSince(taskerId, "COMPLETED", since);
        int cancelled = bookingDao.countByTaskerAndStatusSince(taskerId, "CANCELLED", since);
        int noShow = bookingDao.countByTaskerAndStatusSince(taskerId, "NO_SHOW", since);
        int total = completed + cancelled + noShow;

        if (total < MIN_SAMPLE_SIZE) {
            log.debug("Skipping reliability score for tasker {} — only {} bookings in window (min {})",
                    taskerId, total, MIN_SAMPLE_SIZE);
            return;
        }

        double completionRate = (double) completed / total;
        double punctualityRate = reviewDao.averagePunctualityByRevieweeSince(taskerId, since)
                .orElse(0.0) / 5.0;
        double cancellationRateRaw = (double) cancelled / total;
        double cancellationRate = 1.0 - cancellationRateRaw;

        // Use profile's rating_avg / 5.0 as pragmatic approximation for review component
        double ratingAvg = profileDao.findByUserId(taskerId)
                .map(UserProfileState::ratingAvg)
                .orElse(0.0);
        double reviewAvg = ratingAvg / 5.0;

        double score = 0.4 * completionRate
                + 0.2 * punctualityRate
                + 0.2 * cancellationRate
                + 0.2 * reviewAvg;

        reliabilityScoreDao.upsert(
                taskerId,
                score,
                completionRate * 100,
                punctualityRate * 100,
                cancellationRateRaw * 100,
                ratingAvg,
                WINDOW_DAYS);

        log.info("Reliability score for tasker {}: {} (completed={}, cancelled={}, noShow={}, total={})",
                taskerId, score, completed, cancelled, noShow, total);
    }
}
