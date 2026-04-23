package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeResolutionResult;
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
class AdminDisputeResolutionServiceTests {

    @Mock
    private TrustCommandPort trustCommandPort;

    @Mock
    private TrustQueryPort trustQueryPort;

    @Mock
    private AdminDisputeCompositionService disputeCompositionService;

    @Mock
    private IdempotencyService idempotencyService;

    private AdminDisputeResolutionService service;

    @BeforeEach
    void setUp() {
        service = new AdminDisputeResolutionService(
                trustCommandPort, trustQueryPort, disputeCompositionService, idempotencyService);
    }

    @Nested
    @DisplayName("resolveDispute")
    class ResolveDisputeTests {

        @Test
        @DisplayName("returns IN_PROGRESS when idempotency claim is in progress")
        void resolveDispute_inProgress() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.IN_PROGRESS);
            verify(trustCommandPort, never()).resolveDispute(anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency completed but record is null")
        void resolveDispute_replayMissing_nullRecord() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency completed but dispute not found")
        void resolveDispute_replayMissing_disputeGone() {
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "DISPUTE",
                    UUID.fromString("00000000-0000-0000-0000-0000000000d1"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(trustQueryPort.getDispute("00000000-0000-0000-0000-0000000000d1"))
                    .thenReturn(Optional.empty());

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("replays completed dispute from idempotency record")
        void resolveDispute_replaySuccess() {
            Dispute dispute = buildDispute("d1");
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "DISPUTE",
                    UUID.fromString("00000000-0000-0000-0000-0000000000d1"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(trustQueryPort.getDispute("00000000-0000-0000-0000-0000000000d1"))
                    .thenReturn(Optional.of(dispute));
            when(disputeCompositionService.adminDisputeResponse(dispute)).thenReturn(Map.of("id", "d1"));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("id", "d1");
        }

        @Test
        @DisplayName("resolves dispute successfully on NEW claim")
        void resolveDispute_success() {
            Dispute dispute = buildDispute("d1");
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes"))
                    .thenReturn(DisputeResolutionResult.success(dispute));
            when(disputeCompositionService.adminDisputeResponse(dispute)).thenReturn(Map.of("id", "d1"));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.SUCCESS);
            verify(idempotencyService)
                    .completeWithResource("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1", "DISPUTE", "d1");
        }

        @Test
        @DisplayName("returns NOT_FOUND when command reports NOT_FOUND")
        void resolveDispute_notFound() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes"))
                    .thenReturn(DisputeResolutionResult.error("NOT_FOUND"));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1");
        }

        @Test
        @DisplayName("returns BAD_REQUEST when command reports other error")
        void resolveDispute_badRequest() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes"))
                    .thenReturn(DisputeResolutionResult.error("ALREADY_RESOLVED"));

            AdminDisputeResolutionOutcome outcome =
                    service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1");

            assertThat(outcome.status()).isEqualTo(AdminDisputeResolutionOutcome.Status.BAD_REQUEST);
            assertThat(outcome.body()).containsEntry("error", "ALREADY_RESOLVED");
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1");
        }

        @Test
        @DisplayName("abandons idempotency and re-throws on unexpected exception")
        void resolveDispute_throwsAndAbandons() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(trustCommandPort.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes"))
                    .thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> service.resolveDispute("admin1", "d1", "FAVOR_CUSTOMER", "notes", "key1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("DB error");

            verify(idempotencyService).abandon("admin1", IdempotencyOperations.RESOLVE_DISPUTE, "key1");
        }
    }

    private Dispute buildDispute(String id) {
        return new Dispute(
                id,
                "b1",
                "user-1",
                "reason",
                "RESOLVED",
                "FAVOR_CUSTOMER",
                "user-1",
                "resolved",
                Instant.now(),
                Instant.now());
    }
}
