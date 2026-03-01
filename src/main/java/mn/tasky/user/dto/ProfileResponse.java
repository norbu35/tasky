package mn.tasky.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ProfileResponse(
    String id,
    String phone,
    String role,
    String status,
    @JsonProperty("full_name") String fullName,
    @JsonProperty("avatar_url") String avatarUrl,
    @JsonProperty("rating_avg") double ratingAvg,
    @JsonProperty("completed_tasks") int completedTasks,
    @JsonProperty("is_pro") boolean isPro,
    @JsonProperty("created_at") String createdAt) {
}
