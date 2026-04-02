package mn.tasky.booking.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.booking.dto.BookingTimelineEvent;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(BookingTimelineEvent.class)
public interface BookingTimelineEventDao {

    default void insert(String id, String bookingId, String eventType, String actorUserId, String metadataJson) {
        insert(required(id, "id"), required(bookingId, "bookingId"), eventType, optional(actorUserId), metadataJson);
    }

    @SqlUpdate("INSERT INTO booking_timeline_events (id, booking_id, event_type, actor_user_id, metadata_json) "
            + "VALUES (:id, :bookingId, :eventType, :actorUserId, CAST(:metadataJson AS jsonb))")
    void insert(
            @Bind("id") UUID id,
            @Bind("bookingId") UUID bookingId,
            @Bind("eventType") String eventType,
            @Bind("actorUserId") UUID actorUserId,
            @Bind("metadataJson") String metadataJson);

    default List<BookingTimelineEvent> findByBookingId(String bookingId) {
        return findByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT * FROM booking_timeline_events WHERE booking_id = :bookingId " + "ORDER BY created_at DESC")
    List<BookingTimelineEvent> findByBookingId(@Bind("bookingId") UUID bookingId);

    default boolean existsRecentByBookingId(String bookingId, Instant since) {
        return existsRecentByBookingId(required(bookingId, "bookingId"), since);
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM booking_timeline_events "
            + "WHERE booking_id = :bookingId AND created_at >= :since)")
    boolean existsRecentByBookingId(@Bind("bookingId") UUID bookingId, @Bind("since") Instant since);

    default boolean existsByBookingIdAndEventType(String bookingId, String eventType) {
        return existsByBookingIdAndEventType(required(bookingId, "bookingId"), eventType);
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM booking_timeline_events "
            + "WHERE booking_id = :bookingId AND event_type = :eventType)")
    boolean existsByBookingIdAndEventType(@Bind("bookingId") UUID bookingId, @Bind("eventType") String eventType);
}
