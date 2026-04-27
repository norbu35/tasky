package mn.tasky.projection.publicfeed;

import java.util.List;

public record PublicTaskFeedPage(List<PublicTaskFeedRow> data, String nextCursor, boolean hasMore) {}
