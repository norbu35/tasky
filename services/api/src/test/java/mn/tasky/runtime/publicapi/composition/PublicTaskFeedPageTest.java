package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PublicTaskFeedPageTest {

    @Test
    @DisplayName("preserves feed item maps and cursor metadata")
    void preservesFeedItemMapsAndCursorMetadata() {
        Map<String, Object> feedItem = Map.of("id", "task-1", "status", "OPEN");

        PublicTaskFeedPage page = new PublicTaskFeedPage(List.of(feedItem), "cursor-1", true);

        assertThat(page.data()).containsExactly(feedItem);
        assertThat(page.nextCursor()).isEqualTo("cursor-1");
        assertThat(page.hasMore()).isTrue();
    }
}
