package mn.tasky.marketplace.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceQueryHandler implements MarketplaceQueryPort {
    private final TaskService taskService;

    public MarketplaceQueryHandler(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    public TaskPage listTasks(String categoryId, Double lat, Double lng, Double radiusKm, String cursor, int limit) {
        return taskService.listTasks(categoryId, lat, lng, radiusKm, cursor, limit);
    }

    @Override
    public Optional<TaskState> getTask(String id) {
        return taskService.getTask(id);
    }

    @Override
    public TaskPage listMyTasks(String userId, String role, String status, String cursor, int limit) {
        return taskService.listMyTasks(userId, role, status, cursor, limit);
    }

    @Override
    public List<RecentLocation> recentLocations(String userId, int maxResults) {
        return taskService.recentLocations(userId, maxResults);
    }

    @Override
    public TaskApplicationsListResult listTaskApplications(String userId, String taskId, String cursor, int limit) {
        return taskService.listTaskApplications(userId, taskId, cursor, limit);
    }

    @Override
    public int countApplications(String taskId) {
        return taskService.countApplications(taskId);
    }

    @Override
    public List<String> buildPhotoAccessUrls(List<String> storageKeys, String customerId) {
        return taskService.buildPhotoAccessUrls(storageKeys, customerId);
    }

    @Override
    public Optional<String> buildOwnedPhotoAccessUrl(String storageKey, String customerId) {
        return taskService.buildOwnedPhotoAccessUrl(storageKey, customerId);
    }
}
