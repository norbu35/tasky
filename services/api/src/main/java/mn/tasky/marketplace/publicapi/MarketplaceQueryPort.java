package mn.tasky.marketplace.publicapi;

import java.util.List;
import java.util.Optional;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;

public interface MarketplaceQueryPort {
    TaskPage listTasks(String categoryId, Double lat, Double lng, Double radiusKm, String cursor, int limit);

    Optional<TaskState> getTask(String id);

    TaskPage listMyTasks(String userId, String role, String status, String cursor, int limit);

    List<RecentLocation> recentLocations(String userId, int maxResults);

    TaskApplicationsListResult listTaskApplications(String userId, String taskId, String cursor, int limit);

    int countApplications(String taskId);

    List<String> buildPhotoAccessUrls(List<String> storageKeys, String customerId);

    Optional<String> buildOwnedPhotoAccessUrl(String storageKey, String customerId);

    Optional<TaskDraft> getDraft(String draftId, String userId);
}
