package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.wallet.dto.PayoutRequest;
import mn.tasky.wallet.publicapi.WalletCommandPort;
import mn.tasky.wallet.publicapi.WalletQueryPort;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminPayoutProcessingServiceTests {

    @Mock
    private WalletCommandPort walletCommandPort;

    @Mock
    private WalletQueryPort walletQueryPort;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private IdempotencyService idempotencyService;

    private AdminPayoutProcessingService service;

    @BeforeEach
    void setUp() {
        service = new AdminPayoutProcessingService(
                walletCommandPort, walletQueryPort, featureToggleService, idempotencyService);
    }

    @Nested
    @DisplayName("processPayout — idempotency branches")
    class IdempotencyBranchTests {

        @Test
        @DisplayName("returns IN_PROGRESS when idempotency claim is in progress")
        void processPayout_inProgress() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.IN_PROGRESS);
            verify(walletCommandPort, never()).processPayout(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency completed but record is null")
        void processPayout_replayMissing_nullRecord() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("returns REPLAY_MISSING when idempotency completed but payout not found")
        void processPayout_replayMissing_payoutGone() {
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "PAYOUT",
                    UUID.fromString("00000000-0000-0000-0000-000000000b01"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(walletQueryPort.getPayout("00000000-0000-0000-0000-000000000b01"))
                    .thenReturn(Optional.empty());

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("replays completed payout from idempotency record")
        void processPayout_replaySuccess() {
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "OP",
                    "key1",
                    "COMPLETED",
                    "PAYOUT",
                    UUID.fromString("00000000-0000-0000-0000-000000000b01"),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));
            when(walletQueryPort.getPayout("00000000-0000-0000-0000-000000000b01"))
                    .thenReturn(Optional.of(new PayoutRequest("p1", "user-1", 5000, "PROCESSED", Instant.now())));

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("status", "PROCESSED");
        }
    }

    @Nested
    @DisplayName("processPayout — feature guard")
    class FeatureGuardTests {

        @Test
        @DisplayName("returns FEATURE_DEFERRED when escrow feature is not enabled")
        void processPayout_featureDeferred() {
            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(false);

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.FEATURE_DEFERRED);
            assertThat(outcome.errorMessage()).contains("deferred");
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1");
        }
    }

    @Nested
    @DisplayName("processPayout — weekday guard and execution")
    class WeekdayAndExecutionTests {

        @Test
        @DisplayName("returns INVALID_WEEKDAY on non-processing days")
        void processPayout_invalidWeekday() {
            DayOfWeek today = LocalDate.now(ZoneId.of("Asia/Ulaanbaatar")).getDayOfWeek();
            Assumptions.assumeTrue(
                    today != DayOfWeek.TUESDAY && today != DayOfWeek.FRIDAY,
                    "This test only runs on non-processing weekdays");

            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.INVALID_WEEKDAY);
            assertThat(outcome.errorMessage()).contains("Tuesday and Friday");
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1");
        }

        @Test
        @DisplayName("processes payout successfully on processing days")
        void processPayout_success() {
            DayOfWeek today = LocalDate.now(ZoneId.of("Asia/Ulaanbaatar")).getDayOfWeek();
            Assumptions.assumeTrue(
                    today == DayOfWeek.TUESDAY || today == DayOfWeek.FRIDAY,
                    "This test only runs on Tuesday or Friday");

            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("status", "PROCESSED");
            verify(walletCommandPort).processPayout("admin1", "p1", "weekly");
            verify(idempotencyService)
                    .completeWithResource("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1", "PAYOUT", "p1");
        }

        @Test
        @DisplayName("returns BAD_REQUEST when walletCommandPort throws IllegalArgumentException")
        void processPayout_badRequest() {
            DayOfWeek today = LocalDate.now(ZoneId.of("Asia/Ulaanbaatar")).getDayOfWeek();
            Assumptions.assumeTrue(
                    today == DayOfWeek.TUESDAY || today == DayOfWeek.FRIDAY,
                    "This test only runs on Tuesday or Friday");

            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            org.mockito.Mockito.doThrow(new IllegalArgumentException("not found"))
                    .when(walletCommandPort)
                    .processPayout("admin1", "p1", "weekly");

            AdminPayoutProcessingOutcome outcome = service.processPayout("admin1", "p1", "weekly", "key1");

            assertThat(outcome.status()).isEqualTo(AdminPayoutProcessingOutcome.Status.BAD_REQUEST);
            verify(idempotencyService).abandon("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1");
        }

        @Test
        @DisplayName("abandons idempotency and re-throws on unexpected exception")
        void processPayout_throwsAndAbandons() {
            DayOfWeek today = LocalDate.now(ZoneId.of("Asia/Ulaanbaatar")).getDayOfWeek();
            Assumptions.assumeTrue(
                    today == DayOfWeek.TUESDAY || today == DayOfWeek.FRIDAY,
                    "This test only runs on Tuesday or Friday");

            when(idempotencyService.claim("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1"))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(featureToggleService.isEnabled("escrow_enabled")).thenReturn(true);
            org.mockito.Mockito.doThrow(new RuntimeException("DB error"))
                    .when(walletCommandPort)
                    .processPayout("admin1", "p1", "weekly");

            assertThatThrownBy(() -> service.processPayout("admin1", "p1", "weekly", "key1"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("DB error");

            verify(idempotencyService).abandon("admin1", IdempotencyOperations.PROCESS_PAYOUT, "key1");
        }
    }
}
