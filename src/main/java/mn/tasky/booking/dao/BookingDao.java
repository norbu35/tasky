package mn.tasky.booking.dao;

import mn.tasky.booking.dto.BookingState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(BookingState.class)
public interface BookingDao {

    @SqlUpdate("INSERT INTO bookings (id, task_id, tasker_id, customer_id, price, status, "
             + "cancellation_fee, liability_disclaimer_accepted, created_at, updated_at) "
             + "VALUES (:id, :taskId, :taskerId, :customerId, :price, :status, "
             + ":cancellationFee, :liabilityDisclaimerAccepted, :createdAt, :updatedAt)")
    void insert(@Bind("id") String id,
                @Bind("taskId") String taskId,
                @Bind("taskerId") String taskerId,
                @Bind("customerId") String customerId,
                @Bind("price") int price,
                @Bind("status") String status,
                @Bind("cancellationFee") Integer cancellationFee,
                @Bind("liabilityDisclaimerAccepted") boolean liabilityDisclaimerAccepted,
                @Bind("createdAt") Instant createdAt,
                @Bind("updatedAt") Instant updatedAt);

    @SqlQuery("SELECT * FROM bookings WHERE id = :id")
    Optional<BookingState> findById(@Bind("id") String id);

    @SqlUpdate("UPDATE bookings SET status = :status, cancellation_fee = :cancellationFee, "
             + "liability_disclaimer_accepted = :liabilityDisclaimerAccepted, updated_at = :updatedAt "
             + "WHERE id = :id")
    void update(@Bind("id") String id,
                @Bind("status") String status,
                @Bind("cancellationFee") Integer cancellationFee,
                @Bind("liabilityDisclaimerAccepted") boolean liabilityDisclaimerAccepted,
                @Bind("updatedAt") Instant updatedAt);

    @SqlQuery("SELECT * FROM bookings WHERE customer_id = :userId "
             + "AND (:status IS NULL OR status = :status) "
             + "ORDER BY created_at DESC")
    List<BookingState> findByCustomerId(@Bind("userId") String userId,
                                        @Bind("status") String status);

    @SqlQuery("SELECT * FROM bookings WHERE tasker_id = :userId "
             + "AND (:status IS NULL OR status = :status) "
             + "ORDER BY created_at DESC")
    List<BookingState> findByTaskerId(@Bind("userId") String userId,
                                      @Bind("status") String status);

    @SqlQuery("SELECT * FROM bookings WHERE (customer_id = :userId OR tasker_id = :userId) "
             + "AND (:status IS NULL OR status = :status) "
             + "ORDER BY created_at DESC")
    List<BookingState> findByParticipant(@Bind("userId") String userId,
                                         @Bind("status") String status);
}
