package mn.tasky.auth.dao;

import mn.tasky.auth.dto.OtpChallenge;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.Optional;

@RegisterConstructorMapper(OtpChallenge.class)
public interface OtpChallengeDao {

    @SqlUpdate("INSERT INTO otp_challenges (phone_blind_idx, code, expires_at, attempts) "
             + "VALUES (:phoneBlindIdx, :code, :expiresAt, 0) "
             + "ON CONFLICT (phone_blind_idx) DO UPDATE SET code = :code, expires_at = :expiresAt, attempts = 0")
    void upsert(@Bind("phoneBlindIdx") String phoneBlindIdx,
                @Bind("code") String code,
                @Bind("expiresAt") Instant expiresAt);

    @SqlQuery("SELECT code, expires_at, attempts FROM otp_challenges WHERE phone_blind_idx = :phoneBlindIdx")
    Optional<OtpChallenge> findByPhoneBlindIdx(@Bind("phoneBlindIdx") String phoneBlindIdx);

    @SqlUpdate("DELETE FROM otp_challenges WHERE phone_blind_idx = :phoneBlindIdx")
    void delete(@Bind("phoneBlindIdx") String phoneBlindIdx);

    @SqlUpdate("UPDATE otp_challenges SET attempts = attempts + 1 WHERE phone_blind_idx = :phoneBlindIdx")
    void incrementAttempts(@Bind("phoneBlindIdx") String phoneBlindIdx);
}
