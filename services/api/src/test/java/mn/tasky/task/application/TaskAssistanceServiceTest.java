package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.task.dao.TaskRescueEventDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskAssistanceServiceTest {

    private CategoryDao categoryDao;
    private TaskAssistanceService service;

    @BeforeEach
    void setUp() {
        categoryDao = mock(CategoryDao.class);
        service = new TaskAssistanceService(mock(TaskRescueEventDao.class), categoryDao, mock(AnalyticsService.class));
    }

    @Test
    @DisplayName("category eligibility requires both active category and admin assisted-distribution flag")
    void categoryEligibilityRequiresActiveCategoryAndAdminAssistedDistributionFlag() {
        when(categoryDao.findById("active-assisted")).thenReturn(Optional.of(category("active-assisted", true, true)));
        when(categoryDao.findById("inactive-assisted"))
                .thenReturn(Optional.of(category("inactive-assisted", false, true)));
        when(categoryDao.findById("active-unassisted"))
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
