package mn.tasky.dispute.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import mn.tasky.dispute.dto.Dispute;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RegisterConstructorMapper(Dispute.class)
public interface DisputeDao {

    default void insert(String id,
                        String bookingId,
                        String raiserId,
                        String reason,
                        String status,
                        String outcome,
                        String resolvedBy,
                        String resolutionNotes,
                        Instant createdAt,
                        Instant resolvedAt) {
        insert(
                required(id,
                         "id"),
                required(bookingId,
                         "bookingId"),
                required(raiserId,
                         "raiserId"),
                reason,
                status,
                outcome,
                optional(resolvedBy),
                resolutionNotes,
                createdAt,
                resolvedAt
        );
    }

    @SqlUpdate(
            "INSERT INTO disputes (id, booking_id, raiser_id, reason, status, outcome, " +
                    "resolved_by, resolution_notes, created_at, resolved_at) "
                    + "VALUES (:id, :bookingId, :raiserId, :reason, :status, "
                    + ":outcome, :resolvedBy, :resolutionNotes, :createdAt, :resolvedAt)")
    void insert(@Bind("id") UUID id,
                @Bind("bookingId") UUID bookingId,
                @Bind("raiserId") UUID raiserId,
                @Bind("reason") String reason,
                @Bind("status") String status,
                @Bind("outcome") String outcome,
                @Bind("resolvedBy") UUID resolvedBy,
                @Bind("resolutionNotes") String resolutionNotes,
                @Bind("createdAt") Instant createdAt,
                @Bind("resolvedAt") Instant resolvedAt);

    default Optional<Dispute> findById(String id) {
        return findById(required(id,
                                 "id"));
    }

    @SqlQuery("SELECT * FROM disputes WHERE id = :id")
    Optional<Dispute> findById(@Bind("id") UUID id);

    default Optional<Dispute> findOpenByBookingId(String bookingId) {
        return findOpenByBookingId(required(bookingId,
                                            "bookingId"));
    }

    @SqlQuery("SELECT * FROM disputes WHERE booking_id = :bookingId AND status = 'OPEN'")
    Optional<Dispute> findOpenByBookingId(@Bind("bookingId") UUID bookingId);

    default List<Dispute> findPending(String cursor,
                                      int limit) {
        return findPending(optional(cursor),
                           limit);
    }

    default List<Dispute> findPending(UUID cursor,
                                      int limit) {
        if (cursor == null) {
            return findPendingFirstPage(limit);
        }
        return findPendingAfterCursor(cursor,
                                      limit);
    }

    @SqlQuery("SELECT * FROM disputes WHERE status = 'OPEN' ORDER BY id LIMIT :limit")
    List<Dispute> findPendingFirstPage(@Bind("limit") int limit);

    @SqlQuery("SELECT * FROM disputes WHERE status = 'OPEN' AND id > :cursor ORDER BY id LIMIT " +
            ":limit")
    List<Dispute> findPendingAfterCursor(@Bind("cursor") UUID cursor,
                                         @Bind("limit") int limit);

    default List<Dispute> findPending() {
        return findPending((UUID) null,
                           100);
    }

    default void update(String id,
                        String status,
                        String outcome,
                        String resolvedBy,
                        String resolutionNotes,
                        Instant resolvedAt) {
        update(required(id,
                        "id"),
               status,
               outcome,
               optional(resolvedBy),
               resolutionNotes,
               resolvedAt);
    }

    @SqlUpdate(
            "UPDATE disputes SET status = :status, outcome = :outcome, resolved_by = :resolvedBy, "
                    +
                    "resolution_notes = :resolutionNotes, resolved_at = :resolvedAt WHERE id = :id")
    void update(@Bind("id") UUID id,
                @Bind("status") String status,
                @Bind("outcome") String outcome,
                @Bind("resolvedBy") UUID resolvedBy,
                @Bind("resolutionNotes") String resolutionNotes,
                @Bind("resolvedAt") Instant resolvedAt);
}
