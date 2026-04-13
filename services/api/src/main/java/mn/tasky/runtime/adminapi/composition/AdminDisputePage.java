package mn.tasky.runtime.adminapi.composition;

import java.util.List;
import java.util.Map;

public record AdminDisputePage(List<Map<String, Object>> data, String nextCursor, boolean hasMore) {}
