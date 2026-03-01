package mn.tasky.auth.dao;

import mn.tasky.auth.dto.ModerationPolicy;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.Optional;

@RegisterConstructorMapper(ModerationPolicy.class)
public interface ModerationPolicyDao {

    @SqlQuery(
        "SELECT strike_window_days, strike_threshold, first_suspension_days, " +
            "repeat_suspension_days, "
            + "repeat_offense_window_days, auto_unsuspend_enabled, updated_at "
            + "FROM moderation_policy WHERE id = 1"
    )
    Optional<ModerationPolicy> findActive();

    @SqlUpdate(
        "UPDATE moderation_policy "
            + "SET strike_window_days = :strikeWindowDays, "
            + "strike_threshold = :strikeThreshold, "
            + "first_suspension_days = :firstSuspensionDays, "
            + "repeat_suspension_days = :repeatSuspensionDays, "
            + "repeat_offense_window_days = :repeatOffenseWindowDays, "
            + "auto_unsuspend_enabled = :autoUnsuspendEnabled, "
            + "updated_at = :updatedAt "
            + "WHERE id = 1"
    )
    int update(
        @Bind("strikeWindowDays") int strikeWindowDays,
        @Bind("strikeThreshold") int strikeThreshold,
        @Bind("firstSuspensionDays") int firstSuspensionDays,
        @Bind("repeatSuspensionDays") int repeatSuspensionDays,
        @Bind("repeatOffenseWindowDays") int repeatOffenseWindowDays,
        @Bind("autoUnsuspendEnabled") boolean autoUnsuspendEnabled,
        @Bind("updatedAt") Instant updatedAt
    );
}
