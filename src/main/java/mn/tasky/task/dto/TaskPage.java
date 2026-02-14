package mn.tasky.task.dto;

import java.util.List;

public record TaskPage(List<TaskState> data, String nextCursor, boolean hasMore) {
}
