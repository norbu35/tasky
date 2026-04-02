package mn.tasky.booking.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingScheduleEvent;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(BookingScheduleEvent.class)
public interface BookingScheduleEventDao {

    default void insert(
            String id,
            String bookingId,
            String actorUserId,
            String eventType,
            Instant proposedScheduledAt,
            String reason) {
        insert(
                required(id, "id"),
                required(bookingId, "bookingId"),
                required(actorUserId, "actorUserId"),
                eventType,
                proposedScheduledAt,
                reason);
    }

    @SqlUpdate("INSERT INTO booking_schedule_events (id, booking_id, actor_user_id, event_type, "
            + "proposed_scheduled_at, reason) "
            + "VALUES (:id, :bookingId, :actorUserId, :eventType, :proposedScheduledAt, :reason)")
    void insert(
            @Bind("id") UUID id,
            @Bind("bookingId") UUID bookingId,
            @Bind("actorUserId") UUID actorUserId,
            @Bind("eventType") String eventType,
            @Bind("proposedScheduledAt") Instant proposedScheduledAt,
            @Bind("reason") String reason);

    default List<BookingScheduleEvent> findByBookingId(String bookingId) {
        return findByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT * FROM booking_schedule_events WHERE booking_id = :bookingId " + "ORDER BY created_at DESC")
    List<BookingScheduleEvent> findByBookingId(@Bind("bookingId") UUID bookingId);

    default Optional<BookingScheduleEvent> findLatestAcceptedByBookingId(String bookingId) {
        return findLatestAcceptedByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT * FROM booking_schedule_events "
            + "WHERE booking_id = :bookingId AND event_type = 'ACCEPTED' "
            + "ORDER BY created_at DESC LIMIT 1")
    Optional<BookingScheduleEvent> findLatestAcceptedByBookingId(@Bind("bookingId") UUID bookingId);

    default List<BookingScheduleEvent> findPendingRequestsByBookingId(String bookingId) {
        return findPendingRequestsByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT * FROM booking_schedule_events " + "WHERE booking_id = :bookingId AND event_type = 'REQUESTED'")
    List<BookingScheduleEvent> findPendingRequestsByBookingId(@Bind("bookingId") UUID bookingId);

    default void updateStatus(String id, String eventType) {
        updateStatus(required(id, "id"), eventType);
    }

    @SqlUpdate("UPDATE booking_schedule_events SET event_type = :eventType WHERE id = :id")
    void updateStatus(@Bind("id") UUID id, @Bind("eventType") String eventType);

    default Optional<BookingScheduleEvent> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM booking_schedule_events WHERE id = :id")
    Optional<BookingScheduleEvent> findById(@Bind("id") UUID id);

    @SqlQuery("SELECT * FROM booking_schedule_events WHERE event_type = 'REQUESTED'")
    List<BookingScheduleEvent> findAllPendingRequests();
}
