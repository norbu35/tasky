package mn.tasky.auth.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dto.UserProfileState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(UserProfileState.class)
public interface ProfileDao {

    default void ensureExists(String userId, String fullName) {
        ensureExists(required(userId, "userId"), fullName);
    }

    @SqlUpdate("INSERT INTO profiles (user_id, full_name, avatar_url, rating_avg, completed_tasks) "
            + "VALUES (:userId, :fullName, NULL, 0, 0) "
            + "ON CONFLICT (user_id) DO NOTHING")
    void ensureExists(@Bind("userId") UUID userId, @Bind("fullName") String fullName);

    default Optional<UserProfileState> findByUserId(String userId) {
        return findByUserId(required(userId, "userId"));
    }

    @SqlQuery("SELECT full_name, avatar_url, rating_avg, completed_tasks, instant_match_revoked_until "
            + "FROM profiles WHERE user_id = :userId")
    Optional<UserProfileState> findByUserId(@Bind("userId") UUID userId);

    default void updateNameAndAvatar(String userId, String fullName, String avatarUrl) {
        updateNameAndAvatar(required(userId, "userId"), fullName, avatarUrl);
    }

    @SqlUpdate("UPDATE profiles SET full_name = :fullName, avatar_url = :avatarUrl WHERE user_id = :userId")
    void updateNameAndAvatar(
            @Bind("userId") UUID userId, @Bind("fullName") String fullName, @Bind("avatarUrl") String avatarUrl);

    default void updateStats(String userId, double ratingAvg, int completedTasks) {
        updateStats(required(userId, "userId"), ratingAvg, completedTasks);
    }

    @SqlUpdate("UPDATE profiles SET rating_avg = :ratingAvg, completed_tasks = :completedTasks "
            + "WHERE user_id = :userId")
    void updateStats(
            @Bind("userId") UUID userId,
            @Bind("ratingAvg") double ratingAvg,
            @Bind("completedTasks") int completedTasks);

    default void setInstantMatchRevokedUntil(String userId, Instant revokedUntil) {
        setInstantMatchRevokedUntil(required(userId, "userId"), revokedUntil);
    }

    @SqlUpdate("UPDATE profiles SET instant_match_revoked_until = :revokedUntil WHERE user_id = :userId")
    void setInstantMatchRevokedUntil(@Bind("userId") UUID userId, @Bind("revokedUntil") Instant revokedUntil);

    @SqlUpdate("UPDATE profiles SET last_active_at = now() "
            + "WHERE user_id = :userId "
            + "AND (last_active_at IS NULL OR last_active_at < now() - interval '2 minutes')")
    void touchLastActive(@Bind("userId") UUID userId);
}
