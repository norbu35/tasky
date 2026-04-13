package mn.tasky.marketplace.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskPhotoService;
import mn.tasky.task.application.TaskQueryService;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceQueryHandler implements MarketplaceQueryPort {
    private final TaskQueryService taskQueryService;
    private final TaskPhotoService taskPhotoService;
    private final TaskApplicationService taskApplicationService;

    public MarketplaceQueryHandler(
            TaskQueryService taskQueryService,
            TaskPhotoService taskPhotoService,
            TaskApplicationService taskApplicationService) {
        this.taskQueryService = taskQueryService;
        this.taskPhotoService = taskPhotoService;
        this.taskApplicationService = taskApplicationService;
    }

    @Override
    public TaskPage listTasks(String categoryId, Double lat, Double lng, Double radiusKm, String cursor, int limit) {
        return taskQueryService.listTasks(categoryId, lat, lng, radiusKm, cursor, limit);
    }

    @Override
    public Optional<TaskState> getTask(String id) {
        return taskQueryService.getTask(id);
    }

    @Override
    public TaskPage listMyTasks(String userId, String role, String status, String cursor, int limit) {
        return taskQueryService.listMyTasks(userId, role, status, cursor, limit);
    }

    @Override
    public List<RecentLocation> recentLocations(String userId, int maxResults) {
        return taskQueryService.recentLocations(userId, maxResults);
    }

    @Override
    public TaskApplicationsListResult listTaskApplications(String userId, String taskId, String cursor, int limit) {
        return taskApplicationService.listTaskApplications(userId, taskId, cursor, limit);
    }

    @Override
    public int countApplications(String taskId) {
        return taskApplicationService.countApplications(taskId);
    }

    @Override
    public List<String> buildPhotoAccessUrls(List<String> storageKeys, String customerId) {
        return taskPhotoService.buildPhotoAccessUrls(storageKeys, customerId);
    }

    @Override
    public Optional<String> buildOwnedPhotoAccessUrl(String storageKey, String customerId) {
        return taskPhotoService.buildOwnedPhotoAccessUrl(storageKey, customerId);
    }
}
