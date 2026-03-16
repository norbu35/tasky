package mn.tasky.category.dto;

import java.util.List;

public record CategoryPage(List<CategoryState> data, String nextCursor, boolean hasMore) {}
