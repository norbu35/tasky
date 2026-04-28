package mn.tasky.dispute.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeEvidence;
import mn.tasky.dispute.dto.DisputeEvidenceResult;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.dispute.dto.DisputeResolutionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DisputeServiceTest {

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private BookingCommandPort bookingCommandPort;

    @Mock
    private DisputeDao disputeDao;

    @Mock
    private DisputeEvidenceDao disputeEvidenceDao;

    @Mock
    private AuditEventDao auditEventDao;

    private ObjectMapper objectMapper = new ObjectMapper();

    private DisputeService disputeService;

    private static final String USER_ID = "user-1";
    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";
    private static final String BOOKING_ID = "booking-1";
    private static final String ADMIN_ID = "admin-1";

    private BookingState assignedBooking;
    private BookingState completedBooking;
    private BookingState cancelledBooking;

    @BeforeEach
    void setUp() {
        disputeService = new DisputeService(
                bookingQueryPort, bookingCommandPort, disputeDao, disputeEvidenceDao, auditEventDao, objectMapper);

        Instant now = Instant.now();
        assignedBooking = new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                100,
                "ASSIGNED",
                null,
                false,
                null,
                "SPLIT",
                false,
                null,
                0,
                null,
                now.minusSeconds(3600),
                now);

        completedBooking = new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                100,
                "COMPLETED",
                null,
                false,
                null,
                "SPLIT",
                false,
                null,
                0,
                null,
                now.minusSeconds(3600),
                now);

        cancelledBooking = new BookingState(
                BOOKING_ID,
                "task-1",
                TASKER_ID,
                CUSTOMER_ID,
                100,
                "CANCELLED",
                null,
                false,
                null,
                "SPLIT",
                false,
                null,
                0,
                null,
                now.minusSeconds(3600),
                now);
    }

    // ─── raiseDispute ───────────────────────────────────────────────

    @Nested
    @DisplayName("raiseDispute")
    class RaiseDispute {

        @Test
        @DisplayName("INVALID_REASON when reason is null")
        void raiseDispute_nullReason_returnsInvalidReason() {
            DisputeRaiseResult result = disputeService.raiseDispute(USER_ID, BOOKING_ID, null);
            assertFalse(result.isSuccess());
            assertEquals("INVALID_REASON", result.error());
        }

        @Test
        @DisplayName("INVALID_REASON when reason is blank")
        void raiseDispute_blankReason_returnsInvalidReason() {
            DisputeRaiseResult result = disputeService.raiseDispute(USER_ID, BOOKING_ID, "   ");
            assertFalse(result.isSuccess());
            assertEquals("INVALID_REASON", result.error());
        }

        @Test
        @DisplayName("INVALID_REASON when reason is empty")
        void raiseDispute_emptyReason_returnsInvalidReason() {
            DisputeRaiseResult result = disputeService.raiseDispute(USER_ID, BOOKING_ID, "");
            assertFalse(result.isSuccess());
            assertEquals("INVALID_REASON", result.error());
        }

        @Test
        @DisplayName("BOOKING_NOT_FOUND when booking does not exist")
        void raiseDispute_bookingNotFound_returnsError() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.empty());
            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertFalse(result.isSuccess());
            assertEquals("BOOKING_NOT_FOUND", result.error());
        }

        @Test
        @DisplayName("FORBIDDEN when user is not a participant")
        void raiseDispute_notParticipant_returnsForbidden() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            DisputeRaiseResult result = disputeService.raiseDispute("stranger", BOOKING_ID, "Valid reason");
            assertFalse(result.isSuccess());
            assertEquals("FORBIDDEN", result.error());
        }

        @Test
        @DisplayName("INVALID_STATUS when booking is CANCELLED")
        void raiseDispute_invalidStatus_returnsError() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(cancelledBooking));
            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertFalse(result.isSuccess());
            assertEquals("INVALID_STATUS", result.error());
        }

        @Test
        @DisplayName("DISPUTE_WINDOW_EXPIRED when completed booking past 24h window")
        void raiseDispute_disputeWindowExpired_returnsError() {
            Instant oldUpdated = Instant.now().minusSeconds(25 * 3600);
            BookingState oldCompleted = new BookingState(
                    BOOKING_ID,
                    "task-1",
                    TASKER_ID,
                    CUSTOMER_ID,
                    100,
                    "COMPLETED",
                    null,
                    false,
                    null,
                    "SPLIT",
                    false,
                    null,
                    0,
                    null,
                    oldUpdated.minusSeconds(3600),
                    oldUpdated);
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(oldCompleted));
            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertFalse(result.isSuccess());
            assertEquals("DISPUTE_WINDOW_EXPIRED", result.error());
        }

        @Test
        @DisplayName("DISPUTE_EXISTS when open dispute already present")
        void raiseDispute_disputeExists_returnsError() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID))
                    .thenReturn(Optional.of(new Dispute(
                            "existing", BOOKING_ID, USER_ID, "reason", "OPEN", null, null, null, Instant.now(), null)));
            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertFalse(result.isSuccess());
            assertEquals("DISPUTE_EXISTS", result.error());
        }

        @Test
        @DisplayName("Success without evidence for ASSIGNED booking")
        void raiseDispute_successAssigned_withoutEvidence() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertTrue(result.isSuccess());
            assertNull(result.error());
            assertNotNull(result.dispute());
            assertEquals(BOOKING_ID, result.dispute().bookingId());
            assertEquals(CUSTOMER_ID, result.dispute().raisedBy());
            assertEquals("Valid reason", result.dispute().reason());
            assertEquals("EVIDENCE_NEEDED", result.dispute().status());
            assertNotNull(result.dispute().evidenceReminderSentAt());
            assertNotNull(result.dispute().evidenceDueAt());

            verify(disputeDao)
                    .insert(
                            anyString(),
                            eq(BOOKING_ID),
                            eq(CUSTOMER_ID),
                            eq("Valid reason"),
                            eq("EVIDENCE_NEEDED"),
                            isNull(),
                            isNull(),
                            isNull(),
                            any(Instant.class),
                            isNull(),
                            any(Instant.class),
                            any(Instant.class));
            verify(bookingCommandPort).transitionToDisputed(BOOKING_ID);
            verifyNoInteractions(disputeEvidenceDao);
        }

        @Test
        @DisplayName("Success without evidence for PAID booking")
        void raiseDispute_successPaid() {
            Instant now = Instant.now();
            BookingState paidBooking = new BookingState(
                    BOOKING_ID,
                    "task-1",
                    TASKER_ID,
                    CUSTOMER_ID,
                    100,
                    "PAID",
                    null,
                    false,
                    null,
                    "SPLIT",
                    false,
                    null,
                    0,
                    null,
                    now.minusSeconds(3600),
                    now);
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(paidBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            DisputeRaiseResult result = disputeService.raiseDispute(TASKER_ID, BOOKING_ID, "Problem with payment");
            assertTrue(result.isSuccess());
            assertEquals(TASKER_ID, result.dispute().raisedBy());
            verify(bookingCommandPort).transitionToDisputed(BOOKING_ID);
        }

        @Test
        @DisplayName("Success with COMPLETED booking within window")
        void raiseDispute_successCompleted_withinWindow() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(completedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason");
            assertTrue(result.isSuccess());
            verify(bookingCommandPort).transitionToDisputed(BOOKING_ID);
        }

        @Test
        @DisplayName("Success with evidence items")
        void raiseDispute_success_withEvidence() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            List<DisputeRequest.EvidenceItem> evidence = List.of(
                    new DisputeRequest.EvidenceItem("PHOTO", "storage/key1", null),
                    new DisputeRequest.EvidenceItem("CHAT_EXCERPT", null, "chat text content"),
                    new DisputeRequest.EvidenceItem("WRITTEN_TIMELINE", null, "timeline text"));

            DisputeRaiseResult result = disputeService.raiseDispute(CUSTOMER_ID, BOOKING_ID, "Valid reason", evidence);
            assertTrue(result.isSuccess());
            assertNull(result.error());

            verify(disputeDao)
                    .insert(
                            anyString(),
                            eq(BOOKING_ID),
                            eq(CUSTOMER_ID),
                            eq("Valid reason"),
                            eq("OPEN"),
                            isNull(),
                            isNull(),
                            isNull(),
                            any(Instant.class),
                            isNull(),
                            isNull(),
                            isNull());
            verify(disputeEvidenceDao, times(3)).insert(anyString(), anyString(), anyString(), any(), any());
            verify(bookingCommandPort).transitionToDisputed(BOOKING_ID);
        }

        @Test
        @DisplayName("HTML in reason is sanitized")
        void raiseDispute_sanitizesReason() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            DisputeRaiseResult result = disputeService.raiseDispute(
                    CUSTOMER_ID, BOOKING_ID, "<script>alert('xss')</script> Malicious reason");
            assertTrue(result.isSuccess());
            assertFalse(result.dispute().reason().contains("<script>"));
        }

        @Test
        @DisplayName("INVALID_EVIDENCE when evidence artifact is malformed")
        void raiseDispute_invalidEvidence_returnsError() {
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());

            DisputeRaiseResult result = disputeService.raiseDispute(
                    CUSTOMER_ID,
                    BOOKING_ID,
                    "Valid reason",
                    List.of(new DisputeRequest.EvidenceItem("PHOTO", "", null)));

            assertFalse(result.isSuccess());
            assertEquals("INVALID_EVIDENCE", result.error());
        }
    }

    @Nested
    @DisplayName("addEvidence")
    class AddEvidence {

        @Test
        @DisplayName("Adds evidence during grace path and marks dispute open")
        void addEvidence_duringGrace_marksOpen() {
            Instant now = Instant.now();
            Dispute dispute = new Dispute(
                    "d-1",
                    BOOKING_ID,
                    CUSTOMER_ID,
                    "reason",
                    "EVIDENCE_NEEDED",
                    null,
                    null,
                    null,
                    now.minusSeconds(3600),
                    null,
                    now.minusSeconds(3600),
                    now.plusSeconds(23 * 3600));
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeEvidenceResult result = disputeService.addEvidence(
                    CUSTOMER_ID,
                    "d-1",
                    List.of(new DisputeRequest.EvidenceItem("WRITTEN_TIMELINE", null, "timeline text")));

            assertTrue(result.isSuccess());
            assertEquals("OPEN", result.dispute().status());
            verify(disputeEvidenceDao)
                    .insert(anyString(), eq("d-1"), eq("WRITTEN_TIMELINE"), isNull(), eq("timeline text"));
            verify(disputeDao).markEvidenceSubmitted("d-1");
        }

        @Test
        @DisplayName("FORBIDDEN when non-participant adds evidence")
        void addEvidence_nonParticipant_forbidden() {
            Dispute dispute = new Dispute(
                    "d-1", BOOKING_ID, CUSTOMER_ID, "reason", "EVIDENCE_NEEDED", null, null, null, Instant.now(), null);
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeEvidenceResult result = disputeService.addEvidence(
                    "stranger",
                    "d-1",
                    List.of(new DisputeRequest.EvidenceItem("WRITTEN_TIMELINE", null, "timeline text")));

            assertFalse(result.isSuccess());
            assertEquals("FORBIDDEN", result.error());
        }

        @Test
        @DisplayName("INVALID_STATUS when dispute is closed")
        void addEvidence_closedDispute_invalidStatus() {
            Dispute dispute = new Dispute(
                    "d-1",
                    BOOKING_ID,
                    CUSTOMER_ID,
                    "reason",
                    "CLOSED_INSUFFICIENT_EVIDENCE",
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeEvidenceResult result = disputeService.addEvidence(
                    CUSTOMER_ID,
                    "d-1",
                    List.of(new DisputeRequest.EvidenceItem("WRITTEN_TIMELINE", null, "timeline text")));

            assertFalse(result.isSuccess());
            assertEquals("INVALID_STATUS", result.error());
        }
    }

    // ─── hasOpenDispute ─────────────────────────────────────────────

    @Nested
    @DisplayName("hasOpenDispute")
    class HasOpenDispute {

        @Test
        @DisplayName("Returns true when open dispute exists")
        void hasOpenDispute_true() {
            when(disputeDao.findOpenByBookingId(BOOKING_ID))
                    .thenReturn(Optional.of(new Dispute(
                            "d-1", BOOKING_ID, USER_ID, "r", "OPEN", null, null, null, Instant.now(), null)));
            assertTrue(disputeService.hasOpenDispute(BOOKING_ID));
        }

        @Test
        @DisplayName("Returns false when no open dispute exists")
        void hasOpenDispute_false() {
            when(disputeDao.findOpenByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
            assertFalse(disputeService.hasOpenDispute(BOOKING_ID));
        }
    }

    // ─── listPendingDisputes ────────────────────────────────────────

    @Nested
    @DisplayName("listPendingDisputes")
    class ListPendingDisputes {

        @Test
        @DisplayName("Default overload delegates with null cursor and limit 50")
        void listPendingDisputes_defaultOverload() {
            when(disputeDao.findPending((String) null, 50)).thenReturn(List.of());
            disputeService.listPendingDisputes();
            verify(disputeDao).findPending((String) null, 50);
        }

        @Test
        @DisplayName("With cursor and limit delegates to DAO")
        void listPendingDisputes_withCursor() {
            when(disputeDao.findPending("cursor-1", 10)).thenReturn(List.of());
            disputeService.listPendingDisputes("cursor-1", 10);
            verify(disputeDao).findPending("cursor-1", 10);
        }
    }

    // ─── getDispute ─────────────────────────────────────────────────

    @Nested
    @DisplayName("getDispute")
    class GetDispute {

        @Test
        @DisplayName("Returns dispute when found")
        void getDispute_found() {
            Dispute dispute =
                    new Dispute("d-1", BOOKING_ID, USER_ID, "reason", "OPEN", null, null, null, Instant.now(), null);
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            Optional<Dispute> result = disputeService.getDispute("d-1");
            assertTrue(result.isPresent());
            assertEquals("d-1", result.get().id());
        }

        @Test
        @DisplayName("Returns empty when not found")
        void getDispute_notFound() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.empty());
            Optional<Dispute> result = disputeService.getDispute("d-1");
            assertTrue(result.isEmpty());
        }
    }

    // ─── getDisputeEvidence ─────────────────────────────────────────

    @Nested
    @DisplayName("getDisputeEvidence")
    class GetDisputeEvidence {

        @Test
        @DisplayName("Returns evidence list")
        void getDisputeEvidence_returnsList() {
            List<DisputeEvidence> evidence =
                    List.of(new DisputeEvidence("e-1", "d-1", "PHOTO", "storage/key", null, Instant.now()));
            when(disputeEvidenceDao.findByDisputeId("d-1")).thenReturn(evidence);
            List<DisputeEvidence> result = disputeService.getDisputeEvidence("d-1");
            assertEquals(1, result.size());
            assertEquals("e-1", result.get(0).id());
        }

        @Test
        @DisplayName("Returns empty list when no evidence")
        void getDisputeEvidence_empty() {
            when(disputeEvidenceDao.findByDisputeId("d-1")).thenReturn(List.of());
            List<DisputeEvidence> result = disputeService.getDisputeEvidence("d-1");
            assertTrue(result.isEmpty());
        }
    }

    // ─── getDisputeForUser ──────────────────────────────────────────

    @Nested
    @DisplayName("getDisputeForUser")
    class GetDisputeForUser {

        private Dispute dispute =
                new Dispute("d-1", BOOKING_ID, CUSTOMER_ID, "reason", "OPEN", null, null, null, Instant.now(), null);

        @Test
        @DisplayName("Returns empty when dispute not found")
        void getDisputeForUser_disputeNotFound() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.empty());
            Optional<Dispute> result = disputeService.getDisputeForUser("d-1", CUSTOMER_ID);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Returns dispute when user is customer participant")
        void getDisputeForUser_customerParticipant() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            Optional<Dispute> result = disputeService.getDisputeForUser("d-1", CUSTOMER_ID);
            assertTrue(result.isPresent());
            assertEquals("d-1", result.get().id());
        }

        @Test
        @DisplayName("Returns dispute when user is tasker participant")
        void getDisputeForUser_taskerParticipant() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            Optional<Dispute> result = disputeService.getDisputeForUser("d-1", TASKER_ID);
            assertTrue(result.isPresent());
        }

        @Test
        @DisplayName("Returns empty when user is not a participant")
        void getDisputeForUser_notParticipant() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            Optional<Dispute> result = disputeService.getDisputeForUser("d-1", "stranger");
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Returns empty when booking not found")
        void getDisputeForUser_bookingNotFound() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(dispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.empty());
            Optional<Dispute> result = disputeService.getDisputeForUser("d-1", CUSTOMER_ID);
            assertTrue(result.isEmpty());
        }
    }

    // ─── resolveDispute ─────────────────────────────────────────────

    @Nested
    @DisplayName("resolveDispute")
    class ResolveDispute {

        private Dispute openDispute = new Dispute(
                "d-1",
                BOOKING_ID,
                CUSTOMER_ID,
                "reason",
                "OPEN",
                null,
                null,
                null,
                Instant.now().minusSeconds(60),
                null);

        @Test
        @DisplayName("NOT_FOUND when dispute does not exist")
        void resolveDispute_notFound() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.empty());
            DisputeResolutionResult result = disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_TASKER", "notes");
            assertFalse(result.isSuccess());
            assertEquals("NOT_FOUND", result.error());
        }

        @Test
        @DisplayName("NOT_OPEN when dispute is not OPEN")
        void resolveDispute_notOpen() {
            Dispute closedDispute = new Dispute(
                    "d-1",
                    BOOKING_ID,
                    CUSTOMER_ID,
                    "reason",
                    "RESOLVED_TASKER",
                    "RESOLVE_TASKER",
                    null,
                    "notes",
                    Instant.now().minusSeconds(60),
                    Instant.now());
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(closedDispute));
            DisputeResolutionResult result = disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_TASKER", "notes");
            assertFalse(result.isSuccess());
            assertEquals("NOT_OPEN", result.error());
        }

        @Test
        @DisplayName("BOOKING_NOT_FOUND when booking is missing")
        void resolveDispute_bookingNotFound() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.empty());
            DisputeResolutionResult result = disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_TASKER", "notes");
            assertFalse(result.isSuccess());
            assertEquals("BOOKING_NOT_FOUND", result.error());
        }

        @Test
        @DisplayName("INVALID_OUTCOME when outcome is unrecognized")
        void resolveDispute_invalidOutcome() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));
            DisputeResolutionResult result = disputeService.resolveDispute(ADMIN_ID, "d-1", "INVALID", "notes");
            assertFalse(result.isSuccess());
            assertEquals("INVALID_OUTCOME", result.error());
        }

        @Test
        @DisplayName("Success with RESOLVE_TASKER")
        void resolveDispute_resolveTasker() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeResolutionResult result =
                    disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_TASKER", "Tasker was right");
            assertTrue(result.isSuccess());
            assertNull(result.error());
            assertEquals("RESOLVED_TASKER", result.dispute().status());
            assertEquals("RESOLVE_TASKER", result.dispute().resolutionAction());
            assertEquals("Tasker was right", result.dispute().resolutionNotes());
            assertNotNull(result.dispute().resolvedAt());

            verify(disputeDao)
                    .update(
                            eq("d-1"),
                            eq("RESOLVED_TASKER"),
                            eq("RESOLVE_TASKER"),
                            isNull(),
                            eq("Tasker was right"),
                            any(Instant.class));
            verify(auditEventDao).insert(eq(ADMIN_ID), eq("DISPUTE_RESOLVED"), eq("DISPUTE"), eq("d-1"), anyString());
        }

        @Test
        @DisplayName("Success with RESOLVE_CUSTOMER")
        void resolveDispute_resolveCustomer() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeResolutionResult result =
                    disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_CUSTOMER", "Customer wins");
            assertTrue(result.isSuccess());
            assertEquals("RESOLVED_CUSTOMER", result.dispute().status());
            assertEquals("RESOLVE_CUSTOMER", result.dispute().resolutionAction());
        }

        @Test
        @DisplayName("Success with ESCALATE")
        void resolveDispute_escalate() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeResolutionResult result =
                    disputeService.resolveDispute(ADMIN_ID, "d-1", "ESCALATE", "Needs more review");
            assertTrue(result.isSuccess());
            assertEquals("ESCALATED", result.dispute().status());
            assertEquals("ESCALATE", result.dispute().resolutionAction());
        }

        @Test
        @DisplayName("Null resolution notes are handled")
        void resolveDispute_nullNotes() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            DisputeResolutionResult result = disputeService.resolveDispute(ADMIN_ID, "d-1", "ESCALATE", null);
            assertTrue(result.isSuccess());
            verify(disputeDao)
                    .update(eq("d-1"), eq("ESCALATED"), eq("ESCALATE"), isNull(), isNull(), any(Instant.class));
        }

        @Test
        @DisplayName("Audit event contains correct metadata JSON")
        void resolveDispute_auditMetadata() {
            when(disputeDao.findById("d-1")).thenReturn(Optional.of(openDispute));
            when(bookingQueryPort.getBooking(BOOKING_ID)).thenReturn(Optional.of(assignedBooking));

            disputeService.resolveDispute(ADMIN_ID, "d-1", "RESOLVE_TASKER", "notes");

            ArgumentCaptor<String> metadataCaptor = ArgumentCaptor.forClass(String.class);
            verify(auditEventDao)
                    .insert(eq(ADMIN_ID), eq("DISPUTE_RESOLVED"), eq("DISPUTE"), eq("d-1"), metadataCaptor.capture());
            String metadata = metadataCaptor.getValue();
            assertTrue(metadata.contains("booking_id"));
            assertTrue(metadata.contains("RESOLVED_TASKER"));
            assertTrue(metadata.contains("RESOLVE_TASKER"));
        }
    }
}
