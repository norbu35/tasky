package mn.tasky.dispute.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DisputeServiceTests {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";

    @Mock
    private BookingService bookingService;

    @Mock
    private DisputeDao disputeDao;

    @Mock
    private DisputeEvidenceDao disputeEvidenceDao;

    @Mock
    private AuditEventDao auditEventDao;

    private DisputeService disputeService;

    @BeforeEach
    void setUp() {
        disputeService =
                new DisputeService(bookingService, disputeDao, disputeEvidenceDao, auditEventDao, new ObjectMapper());
    }

    @Test
    void raiseDisputeRejectsBlankReason() {
        DisputeRaiseResult result = disputeService.raiseDispute(uuid(), uuid(), "   ");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("INVALID_REASON");
        verify(bookingService, never()).getBooking(anyString());
    }

    private String uuid() {
        return UUID.randomUUID().toString();
    }

    @Test
    void raiseDisputeRejectsMissingBooking() {
        String bookingId = uuid();
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        DisputeRaiseResult result = disputeService.raiseDispute(uuid(), bookingId, "Missing booking");

        assertThat(result.error()).isEqualTo("BOOKING_NOT_FOUND");
    }

    @Test
    void raiseDisputeRejectsForbiddenAndInvalidStatusAndDuplicate() {
        BookingState assigned = booking("ASSIGNED");
        when(bookingService.getBooking("forbidden")).thenReturn(Optional.of(assigned));
        assertThat(disputeService.raiseDispute(uuid(), "forbidden", "x").error())
                .isEqualTo("FORBIDDEN");

        BookingState cancelled = booking("CANCELLED");
        when(bookingService.getBooking("invalid-status")).thenReturn(Optional.of(cancelled));
        assertThat(disputeService
                        .raiseDispute(cancelled.customerId(), "invalid-status", "x")
                        .error())
                .isEqualTo("INVALID_STATUS");

        when(bookingService.getBooking("duplicate")).thenReturn(Optional.of(assigned));
        when(disputeDao.findOpenByBookingId("duplicate")).thenReturn(Optional.of(dispute("OPEN")));
        assertThat(disputeService
                        .raiseDispute(assigned.customerId(), "duplicate", "x")
                        .error())
                .isEqualTo("DISPUTE_EXISTS");
    }

    private BookingState booking(String status) {
        return new BookingState(
                uuid(),
                uuid(),
                uuid(),
                uuid(),
                10_000,
                status,
                null,
                false,
                null,
                "DIRECT",
                false,
                null,
                Instant.now(),
                Instant.now());
    }

    private Dispute dispute(String status) {
        return new Dispute(uuid(), uuid(), uuid(), "reason", status, null, null, null, Instant.now(), null);
    }

    @Test
    void raiseDisputePersistsSanitizedReason() {
        String bookingId = uuid();
        BookingState booking = booking("ASSIGNED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(disputeDao.findOpenByBookingId(bookingId)).thenReturn(Optional.empty());

        DisputeRaiseResult result =
                disputeService.raiseDispute(booking.customerId(), bookingId, "  <b>Late</b>   arrival ");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.dispute().reason()).isEqualTo("Late arrival");
        verify(disputeDao)
                .insert(
                        anyString(),
                        eq(bookingId),
                        eq(booking.customerId()),
                        eq("Late arrival"),
                        eq("OPEN"),
                        eq(null),
                        eq(null),
                        eq(null),
                        any(Instant.class),
                        eq(null));
    }

    @Test
    void getDisputeForUserAppliesParticipantGuard() {
        String disputeId = uuid();
        Dispute dispute = dispute("OPEN");
        when(disputeDao.findById(disputeId)).thenReturn(Optional.of(dispute));

        BookingState booking = new BookingState(
                dispute.bookingId(),
                uuid(),
                "tasker-1",
                "customer-1",
                10_000,
                "ASSIGNED",
                null,
                false,
                null,
                "DIRECT",
                false,
                null,
                Instant.now(),
                Instant.now());
        when(bookingService.getBooking(dispute.bookingId())).thenReturn(Optional.of(booking));

        assertThat(disputeService.getDisputeForUser(disputeId, "customer-1")).isPresent();
        assertThat(disputeService.getDisputeForUser(disputeId, "tasker-1")).isPresent();
        assertThat(disputeService.getDisputeForUser(disputeId, "other-user")).isEmpty();
    }

    @Test
    void resolveDisputeCoversErrorStates() {
        String disputeId = uuid();
        when(disputeDao.findById(disputeId)).thenReturn(Optional.empty());
        assertThat(disputeService
                        .resolveDispute(ADMIN_ID, disputeId, "RESOLVE_TASKER", "ok")
                        .error())
                .isEqualTo("NOT_FOUND");

        Dispute closed = new Dispute(
                uuid(), uuid(), uuid(), "reason", "ESCALATED", null, null, null, Instant.now(), Instant.now());
        when(disputeDao.findById("not-open")).thenReturn(Optional.of(closed));
        assertThat(disputeService
                        .resolveDispute(ADMIN_ID, "not-open", "RESOLVE_TASKER", "ok")
                        .error())
                .isEqualTo("NOT_OPEN");

        Dispute open = dispute("OPEN");
        when(disputeDao.findById("booking-missing")).thenReturn(Optional.of(open));
        when(bookingService.getBooking(open.bookingId())).thenReturn(Optional.empty());
        assertThat(disputeService
                        .resolveDispute(ADMIN_ID, "booking-missing", "RESOLVE_TASKER", "ok")
                        .error())
                .isEqualTo("BOOKING_NOT_FOUND");

        when(disputeDao.findById("invalid-outcome")).thenReturn(Optional.of(open));
        when(bookingService.getBooking(open.bookingId())).thenReturn(Optional.of(booking("ASSIGNED")));
        assertThat(disputeService
                        .resolveDispute(ADMIN_ID, "invalid-outcome", "NONE", "ok")
                        .error())
                .isEqualTo("INVALID_OUTCOME");
    }

    @Test
    void resolveDisputeUpdatesStatusAndSanitizesNotes() {
        Dispute open = dispute("OPEN");
        when(disputeDao.findById(open.id())).thenReturn(Optional.of(open));
        when(bookingService.getBooking(open.bookingId())).thenReturn(Optional.of(booking("ASSIGNED")));

        DisputeResolutionResult result =
                disputeService.resolveDispute(ADMIN_ID, open.id(), "RESOLVE_CUSTOMER", "  <i>Reviewed</i>  evidence ");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.dispute().status()).isEqualTo("RESOLVED_CUSTOMER");
        assertThat(result.dispute().resolutionNotes()).isEqualTo("Reviewed evidence");
        verify(disputeDao)
                .update(
                        eq(open.id()),
                        eq("RESOLVED_CUSTOMER"),
                        eq("RESOLVE_CUSTOMER"),
                        eq(null),
                        eq("Reviewed evidence"),
                        any(Instant.class));
        ArgumentCaptor<String> metadataCaptor = ArgumentCaptor.forClass(String.class);
        verify(auditEventDao)
                .insert(
                        eq(ADMIN_ID),
                        eq("DISPUTE_RESOLVED"),
                        eq("DISPUTE"),
                        eq(open.id()),
                        metadataCaptor.capture());
        String metadata = metadataCaptor.getValue();
        assertThat(metadata).contains("\"booking_id\":\"" + open.bookingId() + "\"");
        assertThat(metadata).contains("\"old_status\":\"OPEN\"");
        assertThat(metadata).contains("\"new_status\":\"RESOLVED_CUSTOMER\"");
        assertThat(metadata).contains("\"resolution_action\":\"RESOLVE_CUSTOMER\"");
        assertThat(metadata).contains("\"resolution_notes\":\"Reviewed evidence\"");
    }
}
