package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.UUID;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskSelectResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskApplicationAcceptanceServiceTests {

    @Mock
    private MarketplaceCommandPort marketplaceCommandPort;

    @Mock
    private IdempotencyService idempotencyService;

    private TaskApplicationAcceptanceService service;

    private final String customerId = "customer-001";
    private final String taskId = "task-001";
    private final String applicationId = "app-001";
    private final String idempotencyKey = "idemp-" + UUID.randomUUID();

    private TaskApplicationState defaultApplication() {
        return new TaskApplicationState(
                applicationId,
                taskId,
                "tasker-001",
                "Bold",
                "avatar.png",
                4.8,
                15,
                true,
                "I can do it",
                12000,
                "SELECTED",
                null,
                null,
                null,
                Instant.now().plusSeconds(3600),
                Instant.now());
    }

    @BeforeEach
    void setUp() {
        service = new TaskApplicationAcceptanceService(marketplaceCommandPort, idempotencyService);
    }

    @Nested
    @DisplayName("acceptApplication")
    class AcceptApplication {

        @Test
        @DisplayName("IN_PROGRESS claim returns in-progress outcome")
        void inProgress() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.IN_PROGRESS);
            verifyNoInteractions(marketplaceCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with valid record returns replayed success")
        void completedReplay() {
            mn.tasky.common.idempotency.IdempotencyRecord record = new mn.tasky.common.idempotency.IdempotencyRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "op",
                    "key",
                    "COMPLETED",
                    "TASK_APPLICATION",
                    UUID.randomUUID(),
                    Instant.now(),
                    Instant.now());
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("status", "SELECTED");
            verifyNoInteractions(marketplaceCommandPort);
        }

        @Test
        @DisplayName("COMPLETED claim with null record returns REPLAY_MISSING")
        void completedReplayMissing() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.REPLAY_MISSING);
        }

        @Test
        @DisplayName("NEW claim with disclaimer not accepted returns DISCLAIMER_REQUIRED")
        void disclaimerNotAccepted() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, false, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.DISCLAIMER_REQUIRED);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with successful acceptance returns SUCCESS")
        void newClaimSuccess() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

            TaskApplicationState application = defaultApplication();
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(TaskSelectResult.success(application));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.SUCCESS);
            assertThat(outcome.body()).containsEntry("application_id", applicationId);
            assertThat(outcome.body()).containsEntry("status", "SELECTED");
            verify(idempotencyService)
                    .completeWithResource(
                            customerId,
                            IdempotencyOperations.ACCEPT_APPLICATION,
                            idempotencyKey,
                            "TASK_APPLICATION",
                            applicationId);
        }

        @Test
        @DisplayName("NEW claim with NOT_FOUND error returns NOT_FOUND")
        void notFound() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(TaskSelectResult.NOT_FOUND_RESULT);

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.NOT_FOUND);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
        }

        @Test
        @DisplayName("NEW claim with FORBIDDEN error returns FORBIDDEN")
        void forbidden() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(TaskSelectResult.FORBIDDEN_RESULT);

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.FORBIDDEN);
        }

        @Test
        @DisplayName("NEW claim with TASK_NOT_OPEN error returns TASK_NOT_OPEN")
        void taskNotOpen() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(TaskSelectResult.TASK_NOT_OPEN_RESULT);

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.TASK_NOT_OPEN);
        }

        @Test
        @DisplayName("NEW claim with CONFLICT error returns CONFLICT")
        void conflict() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(TaskSelectResult.CONFLICT_RESULT);

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.CONFLICT);
        }

        @Test
        @DisplayName("NEW claim with unknown error returns INTERNAL_ERROR")
        void unknownError() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenReturn(new TaskSelectResult(null, "WEIRD_CODE"));

            TaskApplicationAcceptanceOutcome outcome =
                    service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey);

            assertThat(outcome.status()).isEqualTo(TaskApplicationAcceptanceOutcome.Status.INTERNAL_ERROR);
        }

        @Test
        @DisplayName("NEW claim with runtime exception abandons and re-throws")
        void runtimeException() {
            when(idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey))
                    .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
            when(marketplaceCommandPort.selectApplication(customerId, taskId, applicationId))
                    .thenThrow(new RuntimeException("DB error"));

            assertThatThrownBy(() -> service.acceptApplication(customerId, taskId, applicationId, true, idempotencyKey))
                    .isInstanceOf(RuntimeException.class);
            verify(idempotencyService).abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
        }
    }
}
