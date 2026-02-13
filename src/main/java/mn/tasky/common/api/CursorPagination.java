package mn.tasky.common.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CursorPagination(
    String next,
    @JsonProperty("has_more")
    boolean hasMore
) {
}
