package mn.tasky.auth.dao;

import mn.tasky.auth.dto.VerificationRequest;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(VerificationRequest.class)
public interface VerificationDao {

    @SqlUpdate("INSERT INTO verifications (id, user_id, id_card_front_key, id_card_back_key, status, submitted_at, admin_notes, reviewed_at) "
             + "VALUES (:id, :userId, :idCardFrontKey, :idCardBackKey, :status, :submittedAt, :adminNotes, :reviewedAt)")
    void insert(@Bind("id") String id,
                @Bind("userId") String userId,
                @Bind("idCardFrontKey") String idCardFrontKey,
                @Bind("idCardBackKey") String idCardBackKey,
                @Bind("status") String status,
                @Bind("submittedAt") Instant submittedAt,
                @Bind("adminNotes") String adminNotes,
                @Bind("reviewedAt") Instant reviewedAt);

    @SqlQuery("SELECT * FROM verifications WHERE id = :id")
    Optional<VerificationRequest> findById(@Bind("id") String id);

    @SqlQuery("SELECT * FROM verifications WHERE user_id = :userId ORDER BY submitted_at DESC LIMIT 1")
    Optional<VerificationRequest> findLatestByUserId(@Bind("userId") String userId);

    @SqlQuery("SELECT * FROM verifications WHERE status = 'PENDING' ORDER BY submitted_at LIMIT :limit")
    List<VerificationRequest> findPending(@Bind("limit") int limit);

    @SqlUpdate("UPDATE verifications SET status = :status, admin_notes = :adminNotes, reviewed_at = :reviewedAt WHERE id = :id")
    void updateStatus(@Bind("id") String id,
                      @Bind("status") String status,
                      @Bind("adminNotes") String adminNotes,
                      @Bind("reviewedAt") Instant reviewedAt);
}
