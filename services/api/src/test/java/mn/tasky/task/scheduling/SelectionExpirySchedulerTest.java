package mn.tasky.task.scheduling;

import static org.mockito.Mockito.verify;

import mn.tasky.task.application.TaskApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SelectionExpirySchedulerTest {

    @Mock
    private TaskApplicationService taskApplicationService;

    private SelectionExpiryScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new SelectionExpiryScheduler(taskApplicationService);
    }

    @Test
    void checkExpiredSelections_delegatesToService() {
        scheduler.checkExpiredSelections();

        verify(taskApplicationService).expireStaleSelections();
    }
}
