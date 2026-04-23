package mn.tasky.booking.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingCompletionSignal;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.lang.Nullable;

@RegisterConstructorMapper(BookingCompletionSignal.class)
public interface BookingCompletionSignalDao {

    default int markDone(String bookingId, String taskerId, Instant markedDoneAt) {
        return markDone(required(bookingId, "bookingId"), required(taskerId, "taskerId"), markedDoneAt);
    }

    @SqlUpdate("INSERT INTO booking_completion_signals (booking_id, tasker_id, marked_done_at) "
            + "VALUES (:bookingId, :taskerId, :markedDoneAt) "
            + "ON CONFLICT (booking_id) DO NOTHING")
    int markDone(
            @Bind("bookingId") UUID bookingId,
            @Bind("taskerId") UUID taskerId,
            @Bind("markedDoneAt") Instant markedDoneAt);

    default int markDoneWithProof(
            String bookingId,
            String taskerId,
            Instant markedDoneAt,
            @Nullable String proofPhotoKey,
            @Nullable String proofNote) {
        return markDoneWithProof(
                required(bookingId, "bookingId"),
                required(taskerId, "taskerId"),
                markedDoneAt,
                proofPhotoKey,
                proofNote);
    }

    @SqlUpdate("INSERT INTO booking_completion_signals "
            + "(booking_id, tasker_id, marked_done_at, proof_photo_key, proof_note) "
            + "VALUES (:bookingId, :taskerId, :markedDoneAt, :proofPhotoKey, :proofNote) "
            + "ON CONFLICT (booking_id) DO UPDATE SET "
            + "marked_done_at = :markedDoneAt, "
            + "proof_photo_key = COALESCE(:proofPhotoKey, booking_completion_signals.proof_photo_key), "
            + "proof_note = COALESCE(:proofNote, booking_completion_signals.proof_note)")
    int markDoneWithProof(
            @Bind("bookingId") UUID bookingId,
            @Bind("taskerId") UUID taskerId,
            @Bind("markedDoneAt") Instant markedDoneAt,
            @Bind("proofPhotoKey") String proofPhotoKey,
            @Bind("proofNote") String proofNote);

    default Optional<BookingCompletionSignal> findByBookingId(String bookingId) {
        return findByBookingId(required(bookingId, "bookingId"));
    }

    @SqlQuery("SELECT booking_id, tasker_id, marked_done_at, "
            + "proof_photo_key, proof_note "
            + "FROM booking_completion_signals WHERE booking_id = :bookingId")
    Optional<BookingCompletionSignal> findByBookingId(@Bind("bookingId") UUID bookingId);
}
