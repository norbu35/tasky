package mn.tasky.wallet.dao;

import mn.tasky.wallet.dto.PayoutRequest;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(PayoutRequest.class)
public interface PayoutRequestDao {

    @SqlUpdate("INSERT INTO payout_requests (id, user_id, amount, status, created_at) "
             + "VALUES (:id, :userId, :amount, :status, :createdAt)")
    void insert(@Bind("id") UUID id,
                @Bind("userId") UUID userId,
                @Bind("amount") int amount,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    default void insert(String id, String userId, int amount, String status, Instant createdAt) {
        insert(required(id, "id"), required(userId, "userId"), amount, status, createdAt);
    }

    @SqlQuery("SELECT * FROM payout_requests WHERE id = :id")
    Optional<PayoutRequest> findById(@Bind("id") UUID id);

    default Optional<PayoutRequest> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM payout_requests WHERE status = 'PENDING'")
    List<PayoutRequest> findPending();

    @SqlQuery("SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE user_id = :userId AND status = 'PENDING'")
    long sumPendingByUserId(@Bind("userId") UUID userId);

    default long sumPendingByUserId(String userId) {
        return sumPendingByUserId(required(userId, "userId"));
    }

    @SqlUpdate("UPDATE payout_requests SET status = :status, processed_at = :processedAt WHERE id = :id")
    void updateStatus(@Bind("id") UUID id, @Bind("status") String status, @Bind("processedAt") Instant processedAt);

    default void updateStatus(String id, String status, Instant processedAt) {
        updateStatus(required(id, "id"), status, processedAt);
    }
}
