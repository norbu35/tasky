package mn.tasky.task.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.runtime.publicapi.composition.PublicTaskCompositionService;
import mn.tasky.runtime.publicapi.composition.PublicTaskFeedCompositionService;
import mn.tasky.runtime.publicapi.composition.TaskApplicationAcceptanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

@ExtendWith(MockitoExtension.class)
class TaskControllerFeedTests {

    @Mock
    private MarketplaceCommandPort marketplaceCommandPort;

    @Mock
    private MarketplaceQueryPort marketplaceQueryPort;

    @Mock
    private PublicTaskCompositionService taskCompositionService;

    @Mock
    private PublicTaskFeedCompositionService taskFeedCompositionService;

    @Mock
    private TaskApplicationAcceptanceService taskApplicationAcceptanceService;

    private TaskController controller;

    @BeforeEach
    void setUp() {
        controller = new TaskController(
                marketplaceCommandPort,
                marketplaceQueryPort,
                taskCompositionService,
                taskFeedCompositionService,
                taskApplicationAcceptanceService);
    }

    @Test
    @DisplayName("TID-TASK-116-CONTROLLER-FEED listTasks uses feed composition without rich public task composition")
    void listTasksUsesFeedCompositionOnly() {
        var feedPage = new mn.tasky.runtime.publicapi.composition.PublicTaskFeedPage(
                List.of(Map.<String, Object>of("id", "task-1")), null, false);
        when(taskFeedCompositionService.listTaskFeed("cat-1", 47.9, 106.9, 10.0, null, 20))
                .thenReturn(feedPage);

        var response = controller.listTasks("cat-1", 47.9, 106.9, 10.0, null, 20, new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(PagedResponse.class);
        @SuppressWarnings("unchecked")
        PagedResponse<Map<String, Object>> body = (PagedResponse<Map<String, Object>>) response.getBody();
        assertThat(body.data()).containsExactly(Map.<String, Object>of("id", "task-1"));
        assertThat(body.cursor()).isEqualTo(new CursorPagination(null, false));
        verify(taskFeedCompositionService).listTaskFeed("cat-1", 47.9, 106.9, 10.0, null, 20);
        verify(taskCompositionService, org.mockito.Mockito.never()).toPublicTaskResponses(anyList());
        verifyNoInteractions(marketplaceQueryPort);
    }
}
