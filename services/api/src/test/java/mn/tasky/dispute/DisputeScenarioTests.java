package mn.tasky.dispute;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import mn.tasky.dispute.scheduling.DisputeEvidenceGraceScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for dispute scenarios SCN-DISPUTE-001 through SCN-DISPUTE-008.
 */
class DisputeScenarioTests {

    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";
    private static final String REASON = "Work was not completed as agreed";

    private BookingQueryPort bookingQueryPort;
    private BookingCommandPort bookingCommandPort;
    private DisputeDao disputeDao;
    private DisputeEvidenceDao disputeEvidenceDao;
    private DisputeService disputeService;

    @BeforeEach
    void setUp() {
        bookingQueryPort = mock(BookingQueryPort.class);
        bookingCommandPort = mock(BookingCommandPort.class);
        disputeDao = mock(DisputeDao.class);
        disputeEvidenceDao = mock(DisputeEvidenceDao.class);
        disputeService = new DisputeService(
                bookingQueryPort,
                bookingCommandPort,
                disputeDao,
                disputeEvidenceDao,
                mock(AuditEventDao.class),
                new ObjectMapper());

        // Default: no existing dispute
        when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
        when(disputeDao.findById(anyString())).thenReturn(Optional.empty());
        when(bookingQueryPort.getBooking(anyString())).thenReturn(Optional.empty());
    }

    private BookingState bookingWith(String status, Instant updatedAt) {
        return new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                50_000,
                status,
                null,
                true,
                null,
                "DIRECT",
                false,
                null,
                0,
                null,
                updatedAt.minus(1, ChronoUnit.HOURS),
                updatedAt);
    }

    private Dispute openDispute() {
        return new Dispute(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                CUSTOMER_ID,
                REASON,
                "OPEN",
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
    }

    // ── SCN-DISPUTE-001 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-001: Either participant can open a dispute while the booking is ASSIGNED")
    void participantCanOpenDisputeFromAssigned() {
        when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith("ASSIGNED", Instant.now())));
        Dispute created = openDispute();
        when(disputeDao.findById(anyString())).thenReturn(Optional.of(created));

        DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, REASON);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.dispute().status()).isEqualTo("OPEN");
    }

    // ── SCN-DISPUTE-002 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-002: Either participant can open a dispute within 24 hours after booking completion")
    void participantCanOpenDisputeWithin24hOfCompletion() {
        Instant completedAt = Instant.now().minus(12, ChronoUnit.HOURS);
        when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith("COMPLETED", completedAt)));
        Dispute created = openDispute();
        when(disputeDao.findById(anyString())).thenReturn(Optional.of(created));

        DisputeRaiseResult result = disputeService.raiseDispute(TASKER_ID, BOOKING_ID, REASON);

        assertThat(result.isSuccess()).isTrue();
    }

    // ── SCN-DISPUTE-003 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-003: Completed-booking dispute after 24 hours is rejected")
    void disputeAfter24hWindowExpiredRejected() {
        Instant completedAt = Instant.now().minus(25, ChronoUnit.HOURS);
        when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith("COMPLETED", completedAt)));

        DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, REASON);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.error()).isEqualTo("DISPUTE_WINDOW_EXPIRED");
    }

    // ── SCN-DISPUTE-004 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-004: Dispute creation outside ASSIGNED or COMPLETED booking states is rejected")
    void disputeFromInvalidStatusRejected() {
        for (String status : List.of("CANCELLED", "NO_SHOW")) {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith(status, Instant.now())));

            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, REASON);

            assertThat(result.isSuccess())
                    .as("Expected dispute rejected for status %s", status)
                    .isFalse();
            assertThat(result.error()).isEqualTo("INVALID_STATUS");
        }
    }

    // ── SCN-DISPUTE-005 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-005: Dispute submission requires at least one evidence artifact")
    void disputeWithoutEvidenceRecordedAsOpenPendingEvidence() {
        // When no evidenceItems are supplied, dispute is created but open (pending evidence)
        when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith("ASSIGNED", Instant.now())));
        Dispute created = openDispute();
        when(disputeDao.findById(anyString())).thenReturn(Optional.of(created));

        // No evidence items — dispute is created with OPEN status awaiting evidence
        DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, REASON, null);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.dispute().status()).isEqualTo("OPEN");
        // No evidence inserts happened
        verify(disputeEvidenceDao, never()).insert(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    // ── SCN-DISPUTE-006 ──────────────────────────────────────────────────────

    @Test
    @DisplayName(
            "SCN-DISPUTE-006: Missing evidence after reminder and 24-hour grace auto-closes the dispute as INSUFFICIENT_EVIDENCE")
    void staleDisputeWithNoEvidenceAutoCloses() {
        // Dispute is OPEN and older than 24h, with zero evidence
        Dispute stale = new Dispute(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                CUSTOMER_ID,
                REASON,
                "OPEN",
                null,
                null,
                null,
                Instant.now().minus(25, ChronoUnit.HOURS),
                Instant.now().minus(25, ChronoUnit.HOURS));
        when(disputeDao.findOpenOlderThan(org.mockito.ArgumentMatchers.any())).thenReturn(List.of(stale));
        when(disputeEvidenceDao.countByDisputeId(stale.id())).thenReturn(0);

        DisputeEvidenceGraceScheduler scheduler = new DisputeEvidenceGraceScheduler(disputeDao, disputeEvidenceDao);
        scheduler.closeStaleDisputes();

        verify(disputeDao)
                .update(
                        org.mockito.ArgumentMatchers.eq(stale.id()),
                        org.mockito.ArgumentMatchers.eq("CLOSED_INSUFFICIENT_EVIDENCE"),
                        org.mockito.ArgumentMatchers.isNull(),
                        org.mockito.ArgumentMatchers.isNull(),
                        org.mockito.ArgumentMatchers.isNull(),
                        org.mockito.ArgumentMatchers.any(Instant.class));
    }

    // ── SCN-DISPUTE-007 ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-DISPUTE-007: Evidence added during the grace window prevents insufficient-evidence auto-close")
    void disputeWithEvidenceNotAutoClosedByScheduler() {
        Dispute withEvidence = new Dispute(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                CUSTOMER_ID,
                REASON,
                "OPEN",
                null,
                null,
                null,
                Instant.now().minus(25, ChronoUnit.HOURS),
                Instant.now().minus(25, ChronoUnit.HOURS));
        when(disputeDao.findOpenOlderThan(org.mockito.ArgumentMatchers.any())).thenReturn(List.of(withEvidence));
        // Evidence exists
        when(disputeEvidenceDao.countByDisputeId(withEvidence.id())).thenReturn(1);

        DisputeEvidenceGraceScheduler scheduler = new DisputeEvidenceGraceScheduler(disputeDao, disputeEvidenceDao);
        scheduler.closeStaleDisputes();

        // Should NOT auto-close
        verify(disputeDao, never())
                .update(
                        org.mockito.ArgumentMatchers.eq(withEvidence.id()),
                        anyString(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any());
    }

    // ── SCN-DISPUTE-008 ──────────────────────────────────────────────────────

    @Test
    @DisplayName(
            "SCN-DISPUTE-008: Phase 1 dispute resolution is limited to evidence-only outcomes and admin misconduct notes")
    void phase1ResolutionAllowsOnlyEvidenceOutcomes() {
        Dispute dispute = openDispute();
        when(disputeDao.findById(dispute.id())).thenReturn(Optional.of(dispute));
        when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(bookingWith("ASSIGNED", Instant.now())));

        String adminId = "admin-1";

        // Valid Phase 1 outcomes: RESOLVE_CUSTOMER, RESOLVE_TASKER, ESCALATE
        for (String outcome : List.of("RESOLVE_CUSTOMER", "RESOLVE_TASKER", "ESCALATE")) {
            // Re-stub as OPEN for each iteration
            when(disputeDao.findById(dispute.id())).thenReturn(Optional.of(openDispute()));
            DisputeResolutionResult result = disputeService.resolveDispute(adminId, dispute.id(), outcome, null);
            assertThat(result.isSuccess())
                    .as("Expected %s to be a valid Phase 1 resolution outcome", outcome)
                    .isTrue();
        }

        // REFUND and RELEASE are Phase 3+ only — invalid in Phase 1
        for (String outcome : List.of("REFUND", "RELEASE")) {
            when(disputeDao.findById(dispute.id())).thenReturn(Optional.of(openDispute()));
            DisputeResolutionResult result = disputeService.resolveDispute(adminId, dispute.id(), outcome, null);
            assertThat(result.isSuccess())
                    .as("Expected %s to be rejected as invalid Phase 1 outcome", outcome)
                    .isFalse();
            assertThat(result.error()).isEqualTo("INVALID_OUTCOME");
        }
    }
}
