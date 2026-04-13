package mn.tasky.runtime.publicapi.composition;

import java.util.List;
import java.util.Map;

public record MessagingConversationPage(List<Map<String, Object>> data, String nextCursor, boolean hasMore) {}
