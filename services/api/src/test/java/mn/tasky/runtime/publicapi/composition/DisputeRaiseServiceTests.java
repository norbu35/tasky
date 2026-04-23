package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRaiseResult;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DisputeRaiseServiceTests {

    @Mock
    private TrustCommandPort trustCommandPort;

    @Mock
    private TrustQueryPort trustQueryPort;

    @Mock
    private AnalyticsCommandPort analyticsCommandPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private DisputePublicCompositionService disputePublicCompositionService;

    private DisputeRaiseService service;

    @BeforeEach
    void setUp() {
        service = new DisputeRaiseService(
                trustCommandPort,
                trustQueryPort,
                analyticsCommandPort,
                bookingQueryPort,
                idempotencyService,
                disputePublicCompositionService);
    }

    private DisputeRequest buildDisputeRequest() {
        return new DisputeRequest(
                "The tasker did not show up and I want a refund for the service",
                List.of(new DisputeRequest.EvidenceItem("TEXT", null, "Screenshot of chat")));
    }

    private Dispute buildDispute() {
        return new Dispute(
                "dispute-001",
                "booking-001",
                "user-001",
                "The tasker did not show up",
                "OPEN",
                null,
                null,
                null,
                Instant.parse("2025-06-20T10:00:00Z"),
                null);
    }

    private BookingState buildBooking() {
        return new BookingState(
                "booking-001",
                "task-001",
                "tasker-001",
                "user-001",
                50000,
                "ASSIGNED",
                null,
                true,
                null,
                "MANUAL",
                false,
                null,
                0,
                null,
                Instant.parse("2025-06-18T08:00:00Z"),
                Instant.parse("2025-06-18T08:00:00Z"));
    }

    @Nested
    @DisplayName("raiseDispute idempotency: NEW claim")
    class NewClaim {

        @Test
        @DisplayName("happy path: raises dispute, tracks analytics, completes idempotency")
        void happyPath() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();
            Dispute dispute = buildDispute();
            Map<String, Object> summary = Map.of("id", "dispute-001", "status", "OPEN");

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.success(dispute));
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(buildBooking()));
            when(disputePublicCompositionService.disputeSummary(dispute)).thenReturn(summary);

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(summary);

            verify(idempotencyService)
                    .completeWithResource(
                            userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey, "DISPUTE", dispute.id());
            verify(analyticsCommandPort).track(eq(AnalyticsCommandPort.EVENT_DISPUTE_RAISED), eq(userId), any());
        }

        @Test
        @DisplayName("tracks analytics with booking-derived task_id")
        void tracksAnalyticsWithTaskId() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();
            Dispute dispute = buildDispute();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.success(dispute));
            when(bookingQueryPort.getBooking(bookingId)).thenReturn(Optional.of(buildBooking()));
            when(disputePublicCompositionService.disputeSummary(dispute)).thenReturn(Map.of());

            service.raiseDispute(userId, bookingId, body, idempotencyKey);

            verify(analyticsCommandPort)
                    .track(eq(AnalyticsCommandPort.EVENT_DISPUTE_RAISED), eq(userId), any(Map.class));
        }

        @Test
        @DisplayName("BOOKING_NOT_FOUND error: abandons idempotency and returns NOT_FOUND outcome")
        void bookingNotFoundError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("BOOKING_NOT_FOUND"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.NOT_FOUND);
            assertThat(outcome.errorCode()).isEqualTo("NOT_FOUND");
            verify(idempotencyService).abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
            verifyNoInteractions(analyticsCommandPort);
        }

        @Test
        @DisplayName("FORBIDDEN error: abandons idempotency and returns FORBIDDEN outcome")
        void forbiddenError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("FORBIDDEN"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.FORBIDDEN);
            assertThat(outcome.errorCode()).isEqualTo("FORBIDDEN");
            verify(idempotencyService).abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
        }

        @Test
        @DisplayName("INVALID_REASON error: returns INVALID_REASON outcome")
        void invalidReasonError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("INVALID_REASON"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.INVALID_REASON);
        }

        @Test
        @DisplayName("INVALID_STATUS error: returns INVALID_STATUS outcome")
        void invalidStatusError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("INVALID_STATUS"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.INVALID_STATUS);
        }

        @Test
        @DisplayName("DISPUTE_WINDOW_EXPIRED error: returns DISPUTE_WINDOW_EXPIRED outcome")
        void disputeWindowExpiredError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("DISPUTE_WINDOW_EXPIRED"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.DISPUTE_WINDOW_EXPIRED);
        }

        @Test
        @DisplayName("DISPUTE_EXISTS error: returns DISPUTE_EXISTS outcome")
        void disputeExistsError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("DISPUTE_EXISTS"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.DISPUTE_EXISTS);
        }

        @Test
        @DisplayName("unknown error code: returns INTERNAL_ERROR outcome")
        void unknownErrorReturnsInternalError() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenReturn(DisputeRaiseResult.error("SOME_NEW_ERROR"));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.INTERNAL_ERROR);
            verify(idempotencyService).abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
        }

        @Test
        @DisplayName("runtime exception from trust port: abandons idempotency and re-throws")
        void runtimeException_abandonsAndRethrows() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence()))
                    .thenThrow(new RuntimeException("Database connection lost"));

            assertThatThrownBy(() -> service.raiseDispute(userId, bookingId, body, idempotencyKey))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Database connection lost");

            verify(idempotencyService).abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
            verifyNoInteractions(analyticsCommandPort);
        }
    }

    @Nested
    @DisplayName("raiseDispute idempotency: IN_PROGRESS claim")
    class InProgressClaim {

        @Test
        @DisplayName("returns IN_PROGRESS outcome and does not call trust port")
        void returnsInProgress() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(trustCommandPort, analyticsCommandPort);
        }
    }

    @Nested
    @DisplayName("raiseDispute idempotency: COMPLETED claim")
    class CompletedClaim {

        @Test
        @DisplayName("replays dispute from trust query when record has resourceId")
        void replaysDispute() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();
            Dispute dispute = buildDispute();
            Map<String, Object> summary = Map.of("id", "dispute-001", "status", "OPEN");

            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    IdempotencyOperations.RAISE_DISPUTE,
                    idempotencyKey,
                    "COMPLETED",
                    "DISPUTE",
                    UUID.fromString("00000000-0000-0000-0000-000000000002"),
                    Instant.now(),
                    Instant.now());

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(trustQueryPort.getDispute(record.resourceId().toString())).thenReturn(Optional.of(dispute));
            when(disputePublicCompositionService.disputeSummary(dispute)).thenReturn(summary);

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(summary);
            verifyNoInteractions(trustCommandPort, analyticsCommandPort);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when record has null resourceId")
        void replayMissingWhenNullResourceId() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    IdempotencyOperations.RAISE_DISPUTE,
                    idempotencyKey,
                    "COMPLETED",
                    "DISPUTE",
                    null,
                    Instant.now(),
                    Instant.now());

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when record is null")
        void replayMissingWhenNullRecord() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when trust query returns empty optional")
        void replayMissingWhenDisputeNotFound() {
            String userId = "user-001";
            String bookingId = "booking-001";
            String idempotencyKey = "idemp-" + UUID.randomUUID();
            DisputeRequest body = buildDisputeRequest();

            IdempotencyRecord record = new IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.fromString("00000000-0000-0000-0000-000000000001"),
                    IdempotencyOperations.RAISE_DISPUTE,
                    idempotencyKey,
                    "COMPLETED",
                    "DISPUTE",
                    UUID.fromString("00000000-0000-0000-0000-000000000002"),
                    Instant.now(),
                    Instant.now());

            when(idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(trustQueryPort.getDispute(record.resourceId().toString())).thenReturn(Optional.empty());

            DisputeRaiseOutcome outcome = service.raiseDispute(userId, bookingId, body, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(DisputeRaiseOutcome.Status.REPLAY_MISSING);
        }
    }
}
