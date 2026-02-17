package mn.tasky.auth.dao;

import mn.tasky.auth.dto.AuthUser;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(AuthUser.class)
public interface UserDao {

    @SqlUpdate("INSERT INTO users (id, phone, phone_blind_idx, role, status, created_at) "
             + "VALUES (:id, :phone, :phoneBlindIdx, :role, :status, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("phone") String phone,
                @Bind("phoneBlindIdx") String phoneBlindIdx,
                @Bind("role") String role,
                @Bind("status") String status,
                @Bind("createdAt") java.time.Instant createdAt);

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users WHERE id = :id")
    Optional<AuthUser> findById(@Bind("id") String id);

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users WHERE phone_blind_idx = :phoneBlindIdx")
    Optional<AuthUser> findByPhoneBlindIndex(@Bind("phoneBlindIdx") String phoneBlindIdx);

    @SqlUpdate("UPDATE users SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") String id, @Bind("status") String status);

    @SqlUpdate("UPDATE users SET role = :role WHERE id = :id")
    void updateRole(@Bind("id") String id, @Bind("role") String role);

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users")
    List<AuthUser> findAll();
}
