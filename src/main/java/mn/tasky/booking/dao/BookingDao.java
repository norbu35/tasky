package mn.tasky.booking.dao;

import mn.tasky.booking.dto.BookingState;
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

@RegisterConstructorMapper(BookingState.class)
public interface BookingDao {

    default void insert(
        String id,
        String taskId,
        String taskerId,
        String customerId,
        int price,
        String status,
        Integer cancellationFee,
        boolean liabilityDisclaimerAccepted,
        Instant createdAt,
        Instant updatedAt) {
        insert(
            required(id,
                "id"),
            required(taskId,
                "taskId"),
            required(taskerId,
                "taskerId"),
            required(customerId,
                "customerId"),
            price,
            status,
            cancellationFee,
            liabilityDisclaimerAccepted,
            createdAt,
            updatedAt);
    }

    @SqlUpdate("INSERT INTO bookings (id, task_id, tasker_id, customer_id, price, status, "
        + "cancellation_fee, liability_disclaimer_accepted, created_at, updated_at) "
        + "VALUES (:id, :taskId, :taskerId, :customerId, :price, :status, "
        + ":cancellationFee, :liabilityDisclaimerAccepted, :createdAt, :updatedAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("taskId") UUID taskId,
        @Bind("taskerId") UUID taskerId,
        @Bind("customerId") UUID customerId,
        @Bind("price") int price,
        @Bind("status") String status,
        @Bind("cancellationFee") Integer cancellationFee,
        @Bind("liabilityDisclaimerAccepted") boolean liabilityDisclaimerAccepted,
        @Bind("createdAt") Instant createdAt,
        @Bind("updatedAt") Instant updatedAt);

    default Optional<BookingState> findById(String id) {
        return findById(required(id,
            "id"));
    }

    @SqlQuery("SELECT * FROM bookings WHERE id = :id")
    Optional<BookingState> findById(@Bind("id") UUID id);

    default void update(
        String id, String status, Integer cancellationFee, boolean liabilityDisclaimerAccepted, Instant updatedAt) {
        update(required(id,
                "id"),
            status,
            cancellationFee,
            liabilityDisclaimerAccepted,
            updatedAt);
    }

    @SqlUpdate("UPDATE bookings SET status = :status, cancellation_fee = :cancellationFee, "
        + "liability_disclaimer_accepted = :liabilityDisclaimerAccepted, updated_at = :updatedAt "
        + "WHERE id = :id")
    void update(
        @Bind("id") UUID id,
        @Bind("status") String status,
        @Bind("cancellationFee") Integer cancellationFee,
        @Bind("liabilityDisclaimerAccepted") boolean liabilityDisclaimerAccepted,
        @Bind("updatedAt") Instant updatedAt);

    default List<BookingState> findByCustomerId(String userId, String status) {
        return findByCustomerId(userId,
            status,
            null,
            100);
    }

    default List<BookingState> findByCustomerId(String userId, String status, String cursor, int limit) {
        return findByCustomerId(required(userId,
                "userId"),
            status,
            optional(cursor),
            limit);
    }

    default List<BookingState> findByCustomerId(UUID userId, String status, UUID cursor, int limit) {
        if (cursor == null) {
            return findByCustomerIdFirstPage(userId,
                status,
                limit);
        }
        return findByCustomerIdAfterCursor(userId,
            status,
            cursor,
            limit);
    }

    @SqlQuery("SELECT * FROM bookings WHERE customer_id = :userId "
        + "AND (:status IS NULL OR status = :status) "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByCustomerIdFirstPage(
        @Bind("userId") UUID userId, @Bind("status") String status, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM bookings WHERE customer_id = :userId "
        + "AND (:status IS NULL OR status = :status) "
        + "AND id > :cursor "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByCustomerIdAfterCursor(
        @Bind("userId") UUID userId,
        @Bind("status") String status,
        @Bind("cursor") UUID cursor,
        @Bind("limit") int limit);

    default List<BookingState> findByTaskerId(String userId, String status) {
        return findByTaskerId(userId,
            status,
            null,
            100);
    }

    default List<BookingState> findByTaskerId(String userId, String status, String cursor, int limit) {
        return findByTaskerId(required(userId,
                "userId"),
            status,
            optional(cursor),
            limit);
    }

    default List<BookingState> findByTaskerId(UUID userId, String status, UUID cursor, int limit) {
        if (cursor == null) {
            return findByTaskerIdFirstPage(userId,
                status,
                limit);
        }
        return findByTaskerIdAfterCursor(userId,
            status,
            cursor,
            limit);
    }

    @SqlQuery("SELECT * FROM bookings WHERE tasker_id = :userId "
        + "AND (:status IS NULL OR status = :status) "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByTaskerIdFirstPage(
        @Bind("userId") UUID userId, @Bind("status") String status, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM bookings WHERE tasker_id = :userId "
        + "AND (:status IS NULL OR status = :status) "
        + "AND id > :cursor "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByTaskerIdAfterCursor(
        @Bind("userId") UUID userId,
        @Bind("status") String status,
        @Bind("cursor") UUID cursor,
        @Bind("limit") int limit);

    default List<BookingState> findByParticipant(String userId, String status) {
        return findByParticipant(userId,
            status,
            null,
            100);
    }

    default List<BookingState> findByParticipant(String userId, String status, String cursor, int limit) {
        return findByParticipant(required(userId,
                "userId"),
            status,
            optional(cursor),
            limit);
    }

    default List<BookingState> findByParticipant(UUID userId, String status, UUID cursor, int limit) {
        if (cursor == null) {
            return findByParticipantFirstPage(userId,
                status,
                limit);
        }
        return findByParticipantAfterCursor(userId,
            status,
            cursor,
            limit);
    }

    @SqlQuery("SELECT * FROM bookings WHERE (customer_id = :userId OR tasker_id = :userId) "
        + "AND (:status IS NULL OR status = :status) "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByParticipantFirstPage(
        @Bind("userId") UUID userId, @Bind("status") String status, @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM bookings WHERE (customer_id = :userId OR tasker_id = :userId) "
        + "AND (:status IS NULL OR status = :status) "
        + "AND id > :cursor "
        + "ORDER BY id LIMIT :limit")
    List<BookingState> findByParticipantAfterCursor(
        @Bind("userId") UUID userId,
        @Bind("status") String status,
        @Bind("cursor") UUID cursor,
        @Bind("limit") int limit);
}
