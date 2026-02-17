package mn.tasky.auth.dao;

import mn.tasky.auth.dto.UserProfileState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.Optional;

@RegisterConstructorMapper(UserProfileState.class)
public interface ProfileDao {

    @SqlUpdate("INSERT INTO profiles (user_id, full_name, avatar_url, rating_avg, completed_tasks) "
             + "VALUES (:userId, :fullName, NULL, 0, 0) "
             + "ON CONFLICT (user_id) DO NOTHING")
    void ensureExists(@Bind("userId") String userId, @Bind("fullName") String fullName);

    @SqlQuery("SELECT full_name, avatar_url, rating_avg, completed_tasks FROM profiles WHERE user_id = :userId")
    Optional<UserProfileState> findByUserId(@Bind("userId") String userId);

    @SqlUpdate("UPDATE profiles SET full_name = :fullName, avatar_url = :avatarUrl WHERE user_id = :userId")
    void updateNameAndAvatar(@Bind("userId") String userId,
                             @Bind("fullName") String fullName,
                             @Bind("avatarUrl") String avatarUrl);

    @SqlUpdate("UPDATE profiles SET rating_avg = :ratingAvg, completed_tasks = :completedTasks WHERE user_id = :userId")
    void updateStats(@Bind("userId") String userId,
                     @Bind("ratingAvg") double ratingAvg,
                     @Bind("completedTasks") int completedTasks);
}
