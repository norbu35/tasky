package mn.tasky.auth.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import mn.tasky.auth.dto.AuthUser;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RegisterConstructorMapper(AuthUser.class)
public interface UserDao {

    default void insert(String id,
                        String phone,
                        String phoneBlindIdx,
                        String role,
                        String status,
                        Instant createdAt) {
        insert(required(id,
                        "id"),
               phone,
               phoneBlindIdx,
               role,
               status,
               createdAt);
    }

    @SqlUpdate("INSERT INTO users (id, phone, phone_blind_idx, role, status, created_at) "
            + "VALUES (:id, :phone, :phoneBlindIdx, :role, :status, :createdAt)")
    void insert(@Bind("id") UUID id,
                @Bind("phone") String phone,
                @Bind("phoneBlindIdx") String phoneBlindIdx,
                @Bind("role") String role,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    default Optional<AuthUser> findById(String id) {
        return findById(required(id,
                                 "id"));
    }

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users WHERE id = :id")
    Optional<AuthUser> findById(@Bind("id") UUID id);

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users WHERE phone_blind_idx = " +
            ":phoneBlindIdx")
    Optional<AuthUser> findByPhoneBlindIndex(@Bind("phoneBlindIdx") String phoneBlindIdx);

    default void updateStatus(String id,
                              String status) {
        updateStatus(required(id,
                              "id"),
                     status);
    }

    @SqlUpdate("UPDATE users SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") UUID id,
                      @Bind("status") String status);

    default void updateStatusAndSuspensionEnd(String id,
                                              String status,
                                              Instant suspensionEndAt) {
        updateStatusAndSuspensionEnd(required(id,
                                              "id"),
                                     status,
                                     suspensionEndAt);
    }

    @SqlUpdate("UPDATE users SET status = :status, suspension_end_at = :suspensionEndAt WHERE id " +
            "= :id")
    void updateStatusAndSuspensionEnd(
            @Bind("id") UUID id,
            @Bind("status") String status,
            @Bind("suspensionEndAt") Instant suspensionEndAt
    );

    default Optional<Instant> findSuspensionEndAt(String id) {
        return findSuspensionEndAt(required(id,
                                            "id"));
    }

    @SqlQuery("SELECT suspension_end_at FROM users WHERE id = :id")
    Optional<Instant> findSuspensionEndAt(@Bind("id") UUID id);

    default void updateRole(String id,
                            String role) {
        updateRole(required(id,
                            "id"),
                   role);
    }

    @SqlUpdate("UPDATE users SET role = :role WHERE id = :id")
    void updateRole(@Bind("id") UUID id,
                    @Bind("role") String role);

    @SqlQuery("SELECT id, phone, role, status, created_at FROM users")
    List<AuthUser> findAll();
}
