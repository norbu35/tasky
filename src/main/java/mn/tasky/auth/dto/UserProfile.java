package mn.tasky.auth.dto;

public record UserProfile(
        String id,
        String phone,
        String role,
        String status,
        String fullName,
        String avatarUrl,
        double ratingAvg,
        int completedTasks,
        boolean isPro,
        String createdAt) {}
