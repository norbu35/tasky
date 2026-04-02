package mn.tasky.booking.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingIntentState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(BookingIntentState.class)
public interface BookingIntentDao {

    default void insert(
            String id,
            String taskId,
            String taskerId,
            String customerId,
            String source,
            String status,
            String originalBookingId,
            String offerId,
            Instant expiresAt,
            Instant createdAt,
            Instant updatedAt) {
        insert(
                required(id, "id"),
                required(taskId, "taskId"),
                required(taskerId, "taskerId"),
                required(customerId, "customerId"),
                source,
                status,
                optional(originalBookingId),
                optional(offerId),
                expiresAt,
                createdAt,
                updatedAt);
    }

    @SqlUpdate("INSERT INTO booking_intents (id, task_id, tasker_id, customer_id, source, status, "
            + "original_booking_id, offer_id, expires_at, created_at, updated_at) "
            + "VALUES (:id, :taskId, :taskerId, :customerId, :source, :status, "
            + ":originalBookingId, :offerId, :expiresAt, :createdAt, :updatedAt)")
    void insert(
            @Bind("id") UUID id,
            @Bind("taskId") UUID taskId,
            @Bind("taskerId") UUID taskerId,
            @Bind("customerId") UUID customerId,
            @Bind("source") String source,
            @Bind("status") String status,
            @Bind("originalBookingId") UUID originalBookingId,
            @Bind("offerId") UUID offerId,
            @Bind("expiresAt") Instant expiresAt,
            @Bind("createdAt") Instant createdAt,
            @Bind("updatedAt") Instant updatedAt);

    default Optional<BookingIntentState> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM booking_intents WHERE id = :id")
    Optional<BookingIntentState> findById(@Bind("id") UUID id);

    default void markConfirmed(String id, String confirmedBookingId, Instant confirmedAt, Instant updatedAt) {
        markConfirmed(required(id, "id"), required(confirmedBookingId, "confirmedBookingId"), confirmedAt, updatedAt);
    }

    @SqlUpdate("UPDATE booking_intents SET status = 'CONFIRMED', confirmed_booking_id = :confirmedBookingId, "
            + "confirmed_at = :confirmedAt, updated_at = :updatedAt WHERE id = :id")
    void markConfirmed(
            @Bind("id") UUID id,
            @Bind("confirmedBookingId") UUID confirmedBookingId,
            @Bind("confirmedAt") Instant confirmedAt,
            @Bind("updatedAt") Instant updatedAt);
}
