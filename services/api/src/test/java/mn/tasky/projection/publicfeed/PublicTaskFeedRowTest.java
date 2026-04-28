package mn.tasky.projection.publicfeed;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PublicTaskFeedRowTest {

    @Test
    @DisplayName("carries the summary-only projection fields")
    void carriesSummaryOnlyProjectionFields() {
        Instant scheduledAt = Instant.parse("2026-04-02T10:00:00Z");
        Instant createdAt = Instant.parse("2026-04-01T10:00:00Z");

        PublicTaskFeedRow row = new PublicTaskFeedRow(
                "task-1",
                "cat-1",
                "Cleaning",
                "Цэвэрлэгээ",
                "https://example.test/icon.svg",
                "Clean apartment",
                50_000,
                "BUDGET",
                "Sukhbaatar, Ulaanbaatar",
                47.9213,
                106.9197,
                "OPEN",
                scheduledAt,
                createdAt);

        assertThat(row.id()).isEqualTo("task-1");
        assertThat(row.categoryId()).isEqualTo("cat-1");
        assertThat(row.categoryName()).isEqualTo("Cleaning");
        assertThat(row.categoryNameMn()).isEqualTo("Цэвэрлэгээ");
        assertThat(row.categoryIconUrl()).isEqualTo("https://example.test/icon.svg");
        assertThat(row.description()).isEqualTo("Clean apartment");
        assertThat(row.budget()).isEqualTo(50_000);
        assertThat(row.pricingMode()).isEqualTo("BUDGET");
        assertThat(row.approximateLocation()).isEqualTo("Sukhbaatar, Ulaanbaatar");
        assertThat(row.approximateLat()).isEqualTo(47.9213);
        assertThat(row.approximateLng()).isEqualTo(106.9197);
        assertThat(row.status()).isEqualTo("OPEN");
        assertThat(row.scheduledAt()).isEqualTo(scheduledAt);
        assertThat(row.createdAt()).isEqualTo(createdAt);
    }
}
