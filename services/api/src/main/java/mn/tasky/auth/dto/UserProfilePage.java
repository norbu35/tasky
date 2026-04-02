package mn.tasky.auth.dto;

import java.util.List;

public record UserProfilePage(List<UserProfile> data, String nextCursor, boolean hasMore) {}
