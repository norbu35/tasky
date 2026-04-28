package mn.tasky.dispute.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.dispute.dto.Dispute;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(Dispute.class)
public interface DisputeDao {

    default void insert(
            String id,
            String bookingId,
            String raisedBy,
            String reason,
            String status,
            String resolutionAction,
            String wrongfulPartyUserId,
            String resolutionNotes,
            Instant createdAt,
            Instant resolvedAt,
            Instant evidenceReminderSentAt,
            Instant evidenceDueAt) {
        insert(
                required(id, "id"),
                required(bookingId, "bookingId"),
                required(raisedBy, "raisedBy"),
                reason,
                status,
                resolutionAction,
                optional(wrongfulPartyUserId),
                resolutionNotes,
                createdAt,
                resolvedAt,
                evidenceReminderSentAt,
                evidenceDueAt);
    }

    default void insert(
            String id,
            String bookingId,
            String raisedBy,
            String reason,
            String status,
            String resolutionAction,
            String wrongfulPartyUserId,
            String resolutionNotes,
            Instant createdAt,
            Instant resolvedAt) {
        insert(
                id,
                bookingId,
                raisedBy,
                reason,
                status,
                resolutionAction,
                wrongfulPartyUserId,
                resolutionNotes,
                createdAt,
                resolvedAt,
                null,
                null);
    }

    @SqlUpdate("INSERT INTO disputes (id, booking_id, raised_by, reason, status, resolution_action, "
            + "wrongful_party_user_id, resolution_notes, created_at, resolved_at, "
            + "evidence_reminder_sent_at, evidence_due_at) "
            + "VALUES (:id, :bookingId, :raisedBy, :reason, :status, "
            + ":resolutionAction, :wrongfulPartyUserId, :resolutionNotes, :createdAt, :resolvedAt, "
            + ":evidenceReminderSentAt, :evidenceDueAt)")
    void insert(
            @Bind("id") UUID id,
            @Bind("bookingId") UUID bookingId,
            @Bind("raisedBy") UUID raisedBy,
            @Bind("reason") String reason,
            @Bind("status") String status,
            @Bind("resolutionAction") String resolutionAction,
            @Bind("wrongfulPartyUserId") UUID wrongfulPartyUserId,
            @Bind("resolutionNotes") String resolutionNotes,
            @Bind("createdAt") Instant createdAt,
            @Bind("resolvedAt") Instant resolvedAt,
            @Bind("evidenceReminderSentAt") Instant evidenceReminderSentAt,
            @Bind("evidenceDueAt") Instant evidenceDueAt);

    default Optional<Dispute> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT id, booking_id, raised_by, reason, status, resolution_action, "
            + "wrongful_party_user_id, resolution_notes, created_at, resolved_at, "
            + "evidence_reminder_sent_at, evidence_due_at "
            + "FROM disputes WHERE id = :id")
    Optional<Dispute> findById(@Bind("id") UUID id);

    default Optional<Dispute> findOpenByBookingId(String bookingId) {
        return findOpenByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT id, booking_id, raised_by, reason, status, resolution_action, "
            + "wrongful_party_user_id, resolution_notes, created_at, resolved_at, "
            + "evidence_reminder_sent_at, evidence_due_at "
            + "FROM disputes WHERE booking_id = :bookingId AND status IN ('OPEN', 'EVIDENCE_NEEDED')")
    Optional<Dispute> findOpenByBookingId(@Bind("bookingId") UUID bookingId);

    default List<Dispute> findPending(String cursor, int limit) {
        return findPending(optional(cursor), limit);
    }

    default List<Dispute> findPending(UUID cursor, int limit) {
        if (cursor == null) {
            return findPendingFirstPage(limit);
        }
        return findPendingAfterCursor(cursor, limit);
    }

    @SqlQuery("SELECT id, booking_id, raised_by, reason, status, resolution_action, "
            + "wrongful_party_user_id, resolution_notes, created_at, resolved_at, "
            + "evidence_reminder_sent_at, evidence_due_at "
            + "FROM disputes WHERE status IN ('OPEN', 'EVIDENCE_NEEDED') "
            + "ORDER BY created_at ASC, id ASC LIMIT :limit")
    List<Dispute> findPendingFirstPage(@Bind("limit") int limit);

    @SqlQuery("WITH cursor_row AS (SELECT created_at, id FROM disputes WHERE id = :cursor) "
            + "SELECT d.id, d.booking_id, d.raised_by, d.reason, d.status, d.resolution_action, "
            + "d.wrongful_party_user_id, d.resolution_notes, d.created_at, d.resolved_at, "
            + "d.evidence_reminder_sent_at, d.evidence_due_at "
            + "FROM disputes d, cursor_row c "
            + "WHERE d.status IN ('OPEN', 'EVIDENCE_NEEDED') "
            + "AND (d.created_at > c.created_at OR (d.created_at = c.created_at AND d.id > c.id)) "
            + "ORDER BY d.created_at ASC, d.id ASC LIMIT :limit")
    List<Dispute> findPendingAfterCursor(@Bind("cursor") UUID cursor, @Bind("limit") int limit);

    default List<Dispute> findPending() {
        return findPending((UUID) null, 100);
    }

    @SqlQuery("SELECT id, booking_id, raised_by, reason, status, resolution_action, "
            + "wrongful_party_user_id, resolution_notes, created_at, resolved_at, "
            + "evidence_reminder_sent_at, evidence_due_at "
            + "FROM disputes WHERE status = 'EVIDENCE_NEEDED' AND evidence_due_at <= :now")
    List<Dispute> findEvidenceGraceDue(@Bind("now") Instant now);

    default boolean existsOpenForUser(String userId) {
        return existsOpenForUser(required(userId, "userId"));
    }

    @SqlQuery("SELECT EXISTS("
            + "SELECT 1 FROM disputes d "
            + "JOIN bookings b ON b.id = d.booking_id "
            + "WHERE d.status IN ('OPEN', 'EVIDENCE_NEEDED') "
            + "AND (b.customer_id = :userId OR b.tasker_id = :userId))")
    boolean existsOpenForUser(@Bind("userId") UUID userId);

    default void update(
            String id,
            String status,
            String resolutionAction,
            String wrongfulPartyUserId,
            String resolutionNotes,
            Instant resolvedAt) {
        update(
                required(id, "id"),
                status,
                resolutionAction,
                optional(wrongfulPartyUserId),
                resolutionNotes,
                resolvedAt);
    }

    @SqlUpdate("UPDATE disputes SET status = :status, resolution_action = :resolutionAction, "
            + "wrongful_party_user_id = :wrongfulPartyUserId, "
            + "resolution_notes = :resolutionNotes, resolved_at = :resolvedAt WHERE id = :id")
    void update(
            @Bind("id") UUID id,
            @Bind("status") String status,
            @Bind("resolutionAction") String resolutionAction,
            @Bind("wrongfulPartyUserId") UUID wrongfulPartyUserId,
            @Bind("resolutionNotes") String resolutionNotes,
            @Bind("resolvedAt") Instant resolvedAt);

    default void markEvidenceSubmitted(String id) {
        markEvidenceSubmitted(required(id, "id"));
    }

    @SqlUpdate("UPDATE disputes SET status = 'OPEN' WHERE id = :id AND status = 'EVIDENCE_NEEDED'")
    void markEvidenceSubmitted(@Bind("id") UUID id);
}
