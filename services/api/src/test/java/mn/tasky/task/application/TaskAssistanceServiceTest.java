package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.task.dao.TaskRescueEventDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskAssistanceServiceTest {

    private CategoryQueryPort categoryQueryPort;
    private TaskAssistanceService service;

    @BeforeEach
    void setUp() {
        categoryQueryPort = mock(CategoryQueryPort.class);
        service = new TaskAssistanceService(
                mock(TaskRescueEventDao.class), categoryQueryPort, mock(AnalyticsCommandPort.class));
    }

    @Test
    @DisplayName("category eligibility requires both active category and admin assisted-distribution flag")
    void categoryEligibilityRequiresActiveCategoryAndAdminAssistedDistributionFlag() {
        when(categoryQueryPort.getCategory("active-assisted"))
                .thenReturn(Optional.of(category("active-assisted", true, true)));
        when(categoryQueryPort.getCategory("inactive-assisted"))
                .thenReturn(Optional.of(category("inactive-assisted", false, true)));
        when(categoryQueryPort.getCategory("active-unassisted"))
                .thenReturn(Optional.of(category("active-unassisted", true, false)));

        assertThat(service.isCategoryEligibleForExternalDistribution("active-assisted"))
                .isTrue();
        assertThat(service.isCategoryEligibleForExternalDistribution("inactive-assisted"))
                .isFalse();
        assertThat(service.isCategoryEligibleForExternalDistribution("active-unassisted"))
                .isFalse();
    }

    private CategoryState category(String id, boolean active, boolean assistedDistributionEnabled) {
        return new CategoryState(
                id,
                "Category",
                "Category",
                "https://example.com/icon.png",
                active,
                1,
                true,
                assistedDistributionEnabled,
                1,
                "[]");
    }
}
