package mn.tasky.marketplace.application.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskAssistanceService;
import mn.tasky.task.application.TaskCreationService;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.application.TaskLifecycleService;
import mn.tasky.task.application.TaskMutationService;
import mn.tasky.task.application.TaskPhotoService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.TaskWithdrawResult;
import mn.tasky.task.dto.UpdateTask;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MarketplaceCommandHandlerTest {

    @Mock
    private TaskCreationService taskCreationService;

    @Mock
    private TaskMutationService taskMutationService;

    @Mock
    private TaskLifecycleService taskLifecycleService;

    @Mock
    private TaskApplicationService taskApplicationService;

    @Mock
    private TaskPhotoService taskPhotoService;

    @Mock
    private TaskDraftService taskDraftService;

    @Mock
    private TaskAssistanceService taskAssistanceService;

    private MarketplaceCommandHandler handler;

    private final Instant now = Instant.now();
    private final TaskState stubTask = new TaskState(
            "t1", "c1", "cat1", "desc", 100, 1.0, 2.0, "loc", "OPEN", now, "FIXED", null, null, null, null, now, now);

    @BeforeEach
    void setUp() {
        handler = new MarketplaceCommandHandler(
                taskCreationService,
                taskMutationService,
                taskLifecycleService,
                taskApplicationService,
                taskPhotoService,
                taskDraftService,
                taskAssistanceService);
    }

    @Test
    void createTask_delegatesToTaskCreationService() {
        CreateTask cmd = new CreateTask(
                "cat1", "desc", 100, 1.0, 2.0, "loc", now.toString(), "FIXED", null, null, null, null, null);
        TaskCreateResult expected = new TaskCreateResult(stubTask, null, null);
        when(taskCreationService.createTask("c1", cmd)).thenReturn(expected);

        TaskCreateResult result = handler.createTask("c1", cmd);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void updateTask_delegatesToTaskMutationService() {
        UpdateTask cmd = new UpdateTask("updated", 200, 1.0, 2.0, "loc", now.toString(), null);
        TaskUpdateResult expected = new TaskUpdateResult(stubTask, null);
        when(taskMutationService.updateTask("c1", "t1", cmd)).thenReturn(expected);

        TaskUpdateResult result = handler.updateTask("c1", "t1", cmd);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void cancelTask_delegatesToTaskMutationService() {
        TaskCancelResult expected = new TaskCancelResult(stubTask, null);
        when(taskMutationService.cancelTask("c1", "t1")).thenReturn(expected);

        TaskCancelResult result = handler.cancelTask("c1", "t1");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void applyToTask_delegatesToTaskApplicationService() {
        TaskApplyResult expected = new TaskApplyResult(null, null);
        when(taskApplicationService.applyToTask("tasker1", "TASKER", "t1", "msg", 500))
                .thenReturn(expected);

        TaskApplyResult result = handler.applyToTask("tasker1", "TASKER", "t1", "msg", 500);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void acceptApplication_delegatesToTaskApplicationService() {
        BookingIntentCreateResult expected = new BookingIntentCreateResult(Optional.empty(), null, null);
        when(taskApplicationService.acceptApplication("c1", "t1", "a1", true)).thenReturn(expected);

        BookingIntentCreateResult result = handler.acceptApplication("c1", "t1", "a1", true);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void confirmAcceptance_delegatesToTaskApplicationService() {
        TaskAcceptResult expected = new TaskAcceptResult(null, null);
        when(taskApplicationService.confirmAcceptance("tasker1", "t1", "a1")).thenReturn(expected);

        TaskAcceptResult result = handler.confirmAcceptance("tasker1", "t1", "a1");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void withdrawApplication_delegatesToTaskApplicationService() {
        TaskWithdrawResult expected = new TaskWithdrawResult(null, null);
        when(taskApplicationService.withdrawApplication("tasker1", "a1")).thenReturn(expected);

        TaskWithdrawResult result = handler.withdrawApplication("tasker1", "a1");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void createPhotoUploadUrl_delegatesToTaskPhotoService() {
        PresignedUpload upload = new PresignedUpload("url", "key");
        when(taskPhotoService.createPhotoUploadUrl("u1", "image/jpeg")).thenReturn(Optional.of(upload));

        Optional<PresignedUpload> result = handler.createPhotoUploadUrl("u1", "image/jpeg");

        assertThat(result).isPresent();
        assertThat(result.get()).isSameAs(upload);
    }

    @Test
    void createPhotoUploadUrl_returnsEmpty() {
        when(taskPhotoService.createPhotoUploadUrl("u1", "image/png")).thenReturn(Optional.empty());

        Optional<PresignedUpload> result = handler.createPhotoUploadUrl("u1", "image/png");

        assertThat(result).isEmpty();
    }

    @Test
    void updateTaskStatus_delegatesToTaskLifecycleService() {
        handler.updateTaskStatus("t1", "COMPLETED");

        verify(taskLifecycleService).updateTaskStatus("t1", "COMPLETED");
    }

    @Test
    void recordManualRescueIntervention_delegatesToTaskAssistanceService() {
        handler.recordManualRescueIntervention("t1", "pre_match", "admin1");

        verify(taskAssistanceService).recordManualRescue("t1", "pre_match", "admin1");
    }

    @Test
    void createDraft_delegatesToTaskDraftService() {
        TaskDraft draft = new TaskDraft("d1", "c1", "cat1", null, 0, null, null, null, null, now, now);
        when(taskDraftService.createDraft("c1", "cat1")).thenReturn(draft);

        TaskDraft result = handler.createDraft("c1", "cat1");

        assertThat(result).isSameAs(draft);
    }

    @Test
    void updateDraft_delegatesToTaskDraftService() {
        TaskDraft draft = new TaskDraft("d1", "c1", "cat1", "{}", 1, "summary", 1.0, 2.0, "loc", now, now);
        when(taskDraftService.updateDraft("d1", "u1", "{}", "summary", 1.0, 2.0, "loc"))
                .thenReturn(draft);

        TaskDraft result = handler.updateDraft("d1", "u1", "{}", "summary", 1.0, 2.0, "loc");

        assertThat(result).isSameAs(draft);
    }
}
