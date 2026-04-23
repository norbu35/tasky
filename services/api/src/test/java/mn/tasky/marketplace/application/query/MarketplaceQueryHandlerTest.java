package mn.tasky.marketplace.application.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.application.TaskPhotoService;
import mn.tasky.task.application.TaskQueryService;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MarketplaceQueryHandlerTest {

    @Mock
    private TaskQueryService taskQueryService;

    @Mock
    private TaskPhotoService taskPhotoService;

    @Mock
    private TaskApplicationService taskApplicationService;

    @Mock
    private TaskDraftService taskDraftService;

    private MarketplaceQueryHandler handler;

    @BeforeEach
    void setUp() {
        handler = new MarketplaceQueryHandler(
                taskQueryService, taskPhotoService, taskApplicationService, taskDraftService);
    }

    @Test
    void listTasks_delegatesToTaskQueryService() {
        TaskPage expected = new TaskPage(List.of(), null, false);
        when(taskQueryService.listTasks("cat1", 1.0, 2.0, 5.0, "cursor1", 10)).thenReturn(expected);

        TaskPage result = handler.listTasks("cat1", 1.0, 2.0, 5.0, "cursor1", 10);

        assertThat(result).isSameAs(expected);
        verify(taskQueryService).listTasks("cat1", 1.0, 2.0, 5.0, "cursor1", 10);
    }

    @Test
    void getTask_delegatesToTaskQueryService() {
        TaskState taskState = new TaskState(
                "t1",
                "c1",
                "cat1",
                "desc",
                100,
                1.0,
                2.0,
                "loc",
                "OPEN",
                Instant.now(),
                "FIXED",
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now());
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(taskState));

        Optional<TaskState> result = handler.getTask("t1");

        assertThat(result).isPresent();
        assertThat(result.get()).isSameAs(taskState);
        verify(taskQueryService).getTask("t1");
    }

    @Test
    void getTask_returnsEmptyWhenNotFound() {
        when(taskQueryService.getTask("missing")).thenReturn(Optional.empty());

        Optional<TaskState> result = handler.getTask("missing");

        assertThat(result).isEmpty();
    }

    @Test
    void listMyTasks_delegatesToTaskQueryService() {
        TaskPage expected = new TaskPage(List.of(), null, false);
        when(taskQueryService.listMyTasks("u1", "CUSTOMER", "OPEN", "c1", 10)).thenReturn(expected);

        TaskPage result = handler.listMyTasks("u1", "CUSTOMER", "OPEN", "c1", 10);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void recentLocations_delegatesToTaskQueryService() {
        List<RecentLocation> expected = List.of(new RecentLocation(1.0, 2.0, "loc"));
        when(taskQueryService.recentLocations("u1", 5)).thenReturn(expected);

        List<RecentLocation> result = handler.recentLocations("u1", 5);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void listTaskApplications_delegatesToTaskApplicationService() {
        TaskApplicationsListResult expected = new TaskApplicationsListResult(List.of(), null);
        when(taskApplicationService.listTaskApplications("u1", "t1", "c1", 10)).thenReturn(expected);

        TaskApplicationsListResult result = handler.listTaskApplications("u1", "t1", "c1", 10);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void countApplications_delegatesToTaskApplicationService() {
        when(taskApplicationService.countApplications("t1")).thenReturn(5);

        int result = handler.countApplications("t1");

        assertThat(result).isEqualTo(5);
    }

    @Test
    void buildPhotoAccessUrls_delegatesToTaskPhotoService() {
        List<String> expected = List.of("url1", "url2");
        when(taskPhotoService.buildPhotoAccessUrls(List.of("k1", "k2"), "c1")).thenReturn(expected);

        List<String> result = handler.buildPhotoAccessUrls(List.of("k1", "k2"), "c1");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void buildOwnedPhotoAccessUrl_delegatesToTaskPhotoService() {
        when(taskPhotoService.buildOwnedPhotoAccessUrl("k1", "c1")).thenReturn(Optional.of("url1"));

        Optional<String> result = handler.buildOwnedPhotoAccessUrl("k1", "c1");

        assertThat(result).contains("url1");
    }

    @Test
    void buildOwnedPhotoAccessUrl_returnsEmpty() {
        when(taskPhotoService.buildOwnedPhotoAccessUrl("k1", "c1")).thenReturn(Optional.empty());

        Optional<String> result = handler.buildOwnedPhotoAccessUrl("k1", "c1");

        assertThat(result).isEmpty();
    }

    @Test
    void getDraft_delegatesToTaskDraftService() {
        TaskDraft draft =
                new TaskDraft("d1", "c1", "cat1", null, 0, null, null, null, null, Instant.now(), Instant.now());
        when(taskDraftService.getDraft("d1", "c1")).thenReturn(Optional.of(draft));

        Optional<TaskDraft> result = handler.getDraft("d1", "c1");

        assertThat(result).isPresent();
        assertThat(result.get()).isSameAs(draft);
    }

    @Test
    void getDraft_returnsEmptyWhenNotFound() {
        when(taskDraftService.getDraft("missing", "u1")).thenReturn(Optional.empty());

        Optional<TaskDraft> result = handler.getDraft("missing", "u1");

        assertThat(result).isEmpty();
    }
}
