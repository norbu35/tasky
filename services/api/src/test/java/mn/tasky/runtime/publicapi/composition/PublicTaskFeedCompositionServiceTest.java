package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import mn.tasky.projection.publicfeed.PublicTaskFeedProjectionService;
import mn.tasky.projection.publicfeed.PublicTaskFeedRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicTaskFeedCompositionServiceTest {

    @Mock
    private PublicTaskFeedProjectionService projectionService;

    private PublicTaskFeedCompositionService service;

    @BeforeEach
    void setUp() {
        service = new PublicTaskFeedCompositionService(projectionService);
    }

    @Test
    @DisplayName("TID-TASK-116-COMPOSITION-FEED maps projection rows to summary-only feed items")
    void mapsProjectionRowsToSummaryOnlyItems() {
        PublicTaskFeedRow row = new PublicTaskFeedRow(
                UUID.randomUUID().toString(),
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
        when(projectionService.listOpenFeed(eq("cat-1"), eq(47.9), eq(106.9), eq(10.0), eq(null), eq(20)))
                .thenReturn(new mn.tasky.projection.publicfeed.PublicTaskFeedPage(java.util.List.of(row), null, false));

        var response = service.listTaskFeed("cat-1", 47.9, 106.9, 10.0, null, 20);

        assertThat(response.data()).hasSize(1);
        Map<String, Object> feedItem = response.data().getFirst();
        assertThat(feedItem)
                .containsKeys(
                        "id",
                        "category",
                        "description",
                        "pricing_mode",
                        "budget",
                        "approximate_location",
                        "approximate_lat",
                        "approximate_lng",
                        "status",
                        "scheduled_at",
                        "created_at")
                .doesNotContainKeys(
                        "customer",
                        "photo_urls",
                        "application_count",
                        "location_text",
                        "location_lat",
                        "location_lng",
                        "intake_answers",
                        "intake_schema_version",
                        "intake_schema_json");
    }

    @Test
    @DisplayName("maps projection row with null scheduledAt safely")
    void mapsProjectionRowsWithNullScheduledAtSafely() {
        PublicTaskFeedRow row = new PublicTaskFeedRow(
                UUID.randomUUID().toString(),
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
                null,
                Instant.parse("2026-04-01T10:00:00Z"));
        when(projectionService.listOpenFeed(eq("cat-1"), eq(47.9), eq(106.9), eq(10.0), eq(null), eq(20)))
                .thenReturn(new mn.tasky.projection.publicfeed.PublicTaskFeedPage(java.util.List.of(row), null, false));

        var response = service.listTaskFeed("cat-1", 47.9, 106.9, 10.0, null, 20);

        assertThat(response.data()).hasSize(1);
        Map<String, Object> feedItem = response.data().getFirst();
        assertThat(feedItem.get("scheduled_at")).isNull();
    }
}
