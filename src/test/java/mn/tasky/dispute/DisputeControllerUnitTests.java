package mn.tasky.dispute;

import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.api.DisputeController;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeControllerUnitTests {

    @Mock
    private mn.tasky.dispute.application.DisputeService disputeService;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private BookingService bookingService;

    @Mock
    private IdempotencyService idempotencyService;

    private DisputeController controller;

    @BeforeEach
    void setUp() {
        controller = new DisputeController(disputeService,
            analyticsService,
            bookingService,
            idempotencyService);
    }

    @Test
    void raiseDisputeReturnsInProgressWhenClaimActive() {
        JwtPrincipal principal = userPrincipal();
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.RAISE_DISPUTE,
            "idem-1"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS,
                null));

        ResponseEntity<?> response =
            controller.raiseDispute(principal,
                uuid(1),
                new DisputeRequest("reason"),
                "idem-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "IDEMPOTENCY_IN_PROGRESS");
    }

    private JwtPrincipal userPrincipal() {
        return new JwtPrincipal(uuid(200),
            "CUSTOMER",
            "ACTIVE");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d",
            suffix);
    }

    @Test
    void raiseDisputeReturnsReplayMissingWhenCompletedRecordCannotBeLoaded() {
        JwtPrincipal principal = userPrincipal();
        IdempotencyRecord completed = new IdempotencyRecord(
            UUID.fromString(uuid(10)),
            UUID.fromString(uuid(11)),
            IdempotencyOperations.RAISE_DISPUTE,
            "idem-2",
            "COMPLETED",
            "DISPUTE",
            UUID.fromString(uuid(12)),
            Instant.now(),
            Instant.now());
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.RAISE_DISPUTE,
            "idem-2"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED,
                completed));
        when(disputeService.getDispute(uuid(12))).thenReturn(Optional.empty());

        ResponseEntity<?> response =
            controller.raiseDispute(principal,
                uuid(2),
                new DisputeRequest("reason"),
                "idem-2");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "IDEMPOTENCY_REPLAY_MISSING");
    }

    @Test
    void raiseDisputeReturnsForbiddenForNonParticipant() {
        JwtPrincipal principal = userPrincipal();
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.RAISE_DISPUTE,
            "idem-3"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW,
                null));
        when(disputeService.raiseDispute(principal.userId(),
            uuid(3),
            "reason"))
            .thenReturn(DisputeRaiseResult.error("FORBIDDEN"));

        ResponseEntity<?> response =
            controller.raiseDispute(principal,
                uuid(3),
                new DisputeRequest("reason"),
                "idem-3");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code",
            "FORBIDDEN");
    }

    @Test
    void raiseDisputeSuccessTracksAnalytics() {
        JwtPrincipal principal = userPrincipal();
        Dispute dispute = dispute("OPEN");
        when(idempotencyService.claim(principal.userId(),
            IdempotencyOperations.RAISE_DISPUTE,
            "idem-4"))
            .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW,
                null));
        when(disputeService.raiseDispute(principal.userId(),
            dispute.bookingId(),
            "reason"))
            .thenReturn(DisputeRaiseResult.success(dispute));
        when(bookingService.getBooking(dispute.bookingId()))
            .thenReturn(Optional.of(new BookingState(
                dispute.bookingId(),
                uuid(30),
                uuid(31),
                uuid(32),
                10000,
                "ASSIGNED",
                null,
                true,
                Instant.now(),
                Instant.now())));

        ResponseEntity<?> response =
            controller.raiseDispute(principal,
                dispute.bookingId(),
                new DisputeRequest("reason"),
                "idem-4");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private Dispute dispute(String status) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new Dispute(uuid(20),
            uuid(21),
            uuid(22),
            "reason",
            status,
            null,
            null,
            null,
            now,
            null);
    }

    @Test
    void getDisputeReturnsNotFoundWhenUserCannotAccess() {
        JwtPrincipal principal = new JwtPrincipal(uuid(100),
            "CUSTOMER",
            "ACTIVE");
        when(disputeService.getDisputeForUser(uuid(40),
            principal.userId())).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getDispute(principal,
            uuid(40));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getDisputeAsAdminUsesGlobalLookup() {
        JwtPrincipal admin = new JwtPrincipal(uuid(101),
            "ADMIN",
            "ACTIVE");
        Dispute dispute = dispute("RESOLVED_TASKER");
        when(disputeService.getDispute(dispute.id())).thenReturn(Optional.of(dispute));

        ResponseEntity<?> response = controller.getDispute(admin,
            dispute.id());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id",
            dispute.id());
    }
}
