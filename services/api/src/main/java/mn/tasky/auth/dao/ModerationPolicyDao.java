package mn.tasky.auth.dao;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.auth.dto.ModerationPolicy;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(ModerationPolicy.class)
public interface ModerationPolicyDao {

    @SqlQuery("SELECT strike_window_days, strike_threshold, first_suspension_days, " + "repeat_suspension_days, "
            + "repeat_offense_window_days, auto_unsuspend_enabled, updated_at "
            + "FROM moderation_policy WHERE id = 1")
    Optional<ModerationPolicy> findActive();

    @SqlUpdate("INSERT INTO moderation_policy (id, strike_window_days, strike_threshold, "
            + "first_suspension_days, repeat_suspension_days, repeat_offense_window_days, "
            + "auto_unsuspend_enabled, updated_at) "
            + "VALUES (1, :strikeWindowDays, :strikeThreshold, :firstSuspensionDays, "
            + ":repeatSuspensionDays, :repeatOffenseWindowDays, :autoUnsuspendEnabled, :updatedAt) "
            + "ON CONFLICT (id) DO UPDATE SET "
            + "strike_window_days = EXCLUDED.strike_window_days, "
            + "strike_threshold = EXCLUDED.strike_threshold, "
            + "first_suspension_days = EXCLUDED.first_suspension_days, "
            + "repeat_suspension_days = EXCLUDED.repeat_suspension_days, "
            + "repeat_offense_window_days = EXCLUDED.repeat_offense_window_days, "
            + "auto_unsuspend_enabled = EXCLUDED.auto_unsuspend_enabled, "
            + "updated_at = EXCLUDED.updated_at")
    int update(
            @Bind("strikeWindowDays") int strikeWindowDays,
            @Bind("strikeThreshold") int strikeThreshold,
            @Bind("firstSuspensionDays") int firstSuspensionDays,
            @Bind("repeatSuspensionDays") int repeatSuspensionDays,
            @Bind("repeatOffenseWindowDays") int repeatOffenseWindowDays,
            @Bind("autoUnsuspendEnabled") boolean autoUnsuspendEnabled,
            @Bind("updatedAt") Instant updatedAt);
}
