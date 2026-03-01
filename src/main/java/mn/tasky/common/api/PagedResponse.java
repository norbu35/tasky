package mn.tasky.common.api;

import java.util.List;

public record PagedResponse<T>(List<T> data, CursorPagination cursor) {
}
