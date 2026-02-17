package mn.tasky.dispute.dao;

import mn.tasky.dispute.dto.Dispute;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(Dispute.class)
public interface DisputeDao {

    @SqlUpdate("INSERT INTO disputes (id, booking_id, raiser_id, reason, status, outcome, resolved_by, resolution_notes, created_at, resolved_at) "
             + "VALUES (CAST(:id AS UUID), CAST(:bookingId AS UUID), CAST(:raiserId AS UUID), :reason, :status, "
             + ":outcome, :resolvedBy, :resolutionNotes, :createdAt, :resolvedAt)")
    void insert(@Bind("id") String id,
                @Bind("bookingId") String bookingId,
                @Bind("raiserId") String raiserId,
                @Bind("reason") String reason,
                @Bind("status") String status,
                @Bind("outcome") String outcome,
                @Bind("resolvedBy") String resolvedBy,
                @Bind("resolutionNotes") String resolutionNotes,
                @Bind("createdAt") Instant createdAt,
                @Bind("resolvedAt") Instant resolvedAt);

    @SqlQuery("SELECT * FROM disputes WHERE id = CAST(:id AS UUID)")
    Optional<Dispute> findById(@Bind("id") String id);

    @SqlQuery("SELECT * FROM disputes WHERE booking_id = CAST(:bookingId AS UUID) AND status = 'OPEN'")
    Optional<Dispute> findOpenByBookingId(@Bind("bookingId") String bookingId);

    @SqlQuery("SELECT * FROM disputes WHERE status = 'OPEN'")
    List<Dispute> findPending();

    @SqlUpdate("UPDATE disputes SET status = :status, outcome = :outcome, resolved_by = :resolvedBy, "
             + "resolution_notes = :resolutionNotes, resolved_at = :resolvedAt WHERE id = CAST(:id AS UUID)")
    void update(@Bind("id") String id,
                @Bind("status") String status,
                @Bind("outcome") String outcome,
                @Bind("resolvedBy") String resolvedBy,
                @Bind("resolutionNotes") String resolutionNotes,
                @Bind("resolvedAt") Instant resolvedAt);
}
