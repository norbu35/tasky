package mn.tasky.auth.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dto.ReliabilityScore;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(ReliabilityScore.class)
public interface ReliabilityScoreDao {

    default void upsert(
            String taskerId,
            double score,
            Double completionRate,
            Double punctualityRate,
            Double cancellationRate,
            Double reviewAvg,
            int windowDays) {
        upsert(
                required(taskerId, "taskerId"),
                score,
                completionRate,
                punctualityRate,
                cancellationRate,
                reviewAvg,
                windowDays);
    }

    @SqlUpdate("INSERT INTO tasker_reliability_scores "
            + "(tasker_id, score, completion_rate, punctuality_rate, "
            + "cancellation_rate, review_avg, window_days, computed_at) "
            + "VALUES (:taskerId, :score, :completionRate, :punctualityRate, "
            + ":cancellationRate, :reviewAvg, :windowDays, now()) "
            + "ON CONFLICT (tasker_id) DO UPDATE SET "
            + "score = :score, completion_rate = :completionRate, "
            + "punctuality_rate = :punctualityRate, "
            + "cancellation_rate = :cancellationRate, review_avg = :reviewAvg, "
            + "window_days = :windowDays, computed_at = now()")
    void upsert(
            @Bind("taskerId") UUID taskerId,
            @Bind("score") double score,
            @Bind("completionRate") Double completionRate,
            @Bind("punctualityRate") Double punctualityRate,
            @Bind("cancellationRate") Double cancellationRate,
            @Bind("reviewAvg") Double reviewAvg,
            @Bind("windowDays") int windowDays);

    default Optional<ReliabilityScore> findByTaskerId(String taskerId) {
        return findByTaskerId(required(taskerId, "taskerId"));
    }

    @SqlQuery("SELECT * FROM tasker_reliability_scores WHERE tasker_id = :taskerId")
    Optional<ReliabilityScore> findByTaskerId(@Bind("taskerId") UUID taskerId);
}
