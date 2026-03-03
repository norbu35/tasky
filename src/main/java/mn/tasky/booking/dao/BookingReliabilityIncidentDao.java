package mn.tasky.booking.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

public interface BookingReliabilityIncidentDao {

    default void insert(
        String id, String bookingId, String userId, String incidentType, String details, Instant recordedAt) {
        insert(
            required(id,
                "id"),
            required(bookingId,
                "bookingId"),
            required(userId,
                "userId"),
            incidentType,
            details,
            recordedAt);
    }

    @SqlUpdate("INSERT INTO booking_reliability_incidents (id, booking_id, user_id, incident_type, "
        + "details, recorded_at) "
        + "VALUES (:id, :bookingId, :userId, :incidentType, :details, :recordedAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("bookingId") UUID bookingId,
        @Bind("userId") UUID userId,
        @Bind("incidentType") String incidentType,
        @Bind("details") String details,
        @Bind("recordedAt") Instant recordedAt);
}
