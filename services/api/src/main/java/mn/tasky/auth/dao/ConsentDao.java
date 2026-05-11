package mn.tasky.auth.dao;

import java.util.UUID;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface ConsentDao {

    @SqlUpdate("INSERT INTO user_consents (user_id, policy_kind, version, accepted_at) "
            + "VALUES (:userId, :policyKind, :version, now()) "
            + "ON CONFLICT (user_id, policy_kind, version) DO NOTHING")
    int recordConsent(UUID userId, String policyKind, String version);

    @SqlQuery("SELECT COUNT(*) FROM user_consents "
            + "WHERE user_id = :userId AND policy_kind = :policyKind AND version = :version")
    boolean hasConsented(UUID userId, String policyKind, String version);
}
