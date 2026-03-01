package mn.tasky.common.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.function.Function;

public record CursorPagination(
    String next,
    @JsonProperty("has_more")
    boolean hasMore
) {

    public static <T> CursorPagination from(List<T> items,
                                            int limit,
                                            Function<T, String> cursorResolver) {
        if (items == null || items.isEmpty()) {
            return new CursorPagination(null,
                false);
        }
        boolean hasMore = items.size() > limit;
        if (!hasMore) {
            return new CursorPagination(null,
                false);
        }
        String next = cursorResolver.apply(items.get(limit - 1));
        return new CursorPagination(next,
            true);
    }
}
