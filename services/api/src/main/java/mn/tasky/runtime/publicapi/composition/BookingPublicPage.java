package mn.tasky.runtime.publicapi.composition;

import java.util.List;
import java.util.Map;

public record BookingPublicPage(List<Map<String, Object>> data, String nextCursor, boolean hasMore) {}
