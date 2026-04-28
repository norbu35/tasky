package mn.tasky.projection.publicfeed;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PublicTaskFeedPageTest {

    @Test
    @DisplayName("preserves projection rows and cursor metadata")
    void preservesRowsAndCursorMetadata() {
        PublicTaskFeedRow row = row();

        PublicTaskFeedPage page = new PublicTaskFeedPage(List.of(row), "cursor-1", true);

        assertThat(page.data()).containsExactly(row);
        assertThat(page.nextCursor()).isEqualTo("cursor-1");
        assertThat(page.hasMore()).isTrue();
    }

    private PublicTaskFeedRow row() {
        return new PublicTaskFeedRow(
                "task-1",
                "cat-1",
                "Cleaning",
                "Цэвэрлэгээ",
                null,
                "Clean apartment",
                50_000,
                "BUDGET",
                "Sukhbaatar, Ulaanbaatar",
                47.9213,
                106.9197,
                "OPEN",
                Instant.parse("2026-04-02T10:00:00Z"),
                Instant.parse("2026-04-01T10:00:00Z"));
    }
}
