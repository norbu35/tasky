package mn.tasky.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Aggregate statistics for the authenticated user, shown on the mobile profile screen.
 *
 * @param jobsCompleted         total bookings completed
 * @param averageRating         weighted average review rating (0 if no reviews)
 * @param responseTimeMinutes   average time to first response (null if not enough data)
 * @param reliabilityScore      reliability score for taskers (null for customers / not yet computed)
 */
public record UserStatsResponse(
        @JsonProperty("jobs_completed") int jobsCompleted,
        @JsonProperty("average_rating") double averageRating,
        @JsonProperty("response_time_minutes") Double responseTimeMinutes,
        @JsonProperty("reliability_score") Double reliabilityScore) {}
