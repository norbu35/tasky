package mn.tasky.auth.dao;

import mn.tasky.auth.dto.VerificationRequest;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(VerificationRequest.class)
public interface VerificationDao {

    default void insert(String id,
                        String userId,
                        String idCardFrontKey,
                        String idCardBackKey,
                        String status,
                        Instant submittedAt,
                        String adminNotes,
                        Instant reviewedAt) {
        insert(
            required(id,
                "id"),
            required(userId,
                "userId"),
            idCardFrontKey,
            idCardBackKey,
            status,
            submittedAt,
            adminNotes,
            reviewedAt
        );
    }

    @SqlUpdate(
        "INSERT INTO verifications (id, user_id, id_card_front_key, id_card_back_key, status," +
            " submitted_at, admin_notes, reviewed_at) "
            +
            "VALUES (:id, :userId, :idCardFrontKey, :idCardBackKey, :status, " +
            ":submittedAt, :adminNotes, :reviewedAt)")
    void insert(@Bind("id") UUID id,
                @Bind("userId") UUID userId,
                @Bind("idCardFrontKey") String idCardFrontKey,
                @Bind("idCardBackKey") String idCardBackKey,
                @Bind("status") String status,
                @Bind("submittedAt") Instant submittedAt,
                @Bind("adminNotes") String adminNotes,
                @Bind("reviewedAt") Instant reviewedAt);

    default Optional<VerificationRequest> findById(String id) {
        return findById(required(id,
            "id"));
    }

    @SqlQuery("SELECT * FROM verifications WHERE id = :id")
    Optional<VerificationRequest> findById(@Bind("id") UUID id);

    default Optional<VerificationRequest> findLatestByUserId(String userId) {
        return findLatestByUserId(required(userId,
            "userId"));
    }

    @SqlQuery("SELECT * FROM verifications WHERE user_id = :userId ORDER BY submitted_at DESC " +
        "LIMIT 1")
    Optional<VerificationRequest> findLatestByUserId(@Bind("userId") UUID userId);

    default List<VerificationRequest> findPending(String cursor,
                                                  int limit) {
        return findPending(optional(cursor),
            limit);
    }

    default List<VerificationRequest> findPending(UUID cursor,
                                                  int limit) {
        if (cursor == null) {
            return findPendingFirstPage(limit);
        }
        return findPendingAfterCursor(cursor,
            limit);
    }

    @SqlQuery("SELECT * FROM verifications WHERE status = 'PENDING' ORDER BY id LIMIT :limit")
    List<VerificationRequest> findPendingFirstPage(@Bind("limit") int limit);

    @SqlQuery("SELECT * FROM verifications WHERE status = 'PENDING' AND id > :cursor ORDER BY id " +
        "LIMIT :limit")
    List<VerificationRequest> findPendingAfterCursor(@Bind("cursor") UUID cursor,
                                                     @Bind("limit") int limit);

    default void updateStatus(String id,
                              String status,
                              String adminNotes,
                              Instant reviewedAt) {
        updateStatus(required(id,
                "id"),
            status,
            adminNotes,
            reviewedAt);
    }

    @SqlUpdate("UPDATE verifications SET status = :status, admin_notes = :adminNotes, reviewed_at" +
        " = :reviewedAt WHERE id = :id")
    void updateStatus(@Bind("id") UUID id,
                      @Bind("status") String status,
                      @Bind("adminNotes") String adminNotes,
                      @Bind("reviewedAt") Instant reviewedAt);
}
