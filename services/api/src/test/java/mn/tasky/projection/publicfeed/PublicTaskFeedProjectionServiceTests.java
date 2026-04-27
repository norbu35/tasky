package mn.tasky.projection.publicfeed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicTaskFeedProjectionServiceTests {

    @Mock
    private PublicTaskFeedProjectionDao projectionDao;

    private PublicTaskFeedProjectionService service;

    @BeforeEach
    void setUp() {
        service = new PublicTaskFeedProjectionService(projectionDao);
    }

    @Nested
    @DisplayName("listOpenFeed")
    class ListOpenFeed {

        @Test
        @DisplayName("returns deterministic cursor pages")
        void returnsCursorPages() {
            PublicTaskFeedRow row1 = row(UUID.randomUUID(), Instant.parse("2026-04-01T10:00:00Z"));
            PublicTaskFeedRow row2 = row(UUID.randomUUID(), Instant.parse("2026-04-01T09:00:00Z"));
            PublicTaskFeedRow row3 = row(UUID.randomUUID(), Instant.parse("2026-04-01T08:00:00Z"));
            when(projectionDao.findOpenFeed(
                            org.mockito.ArgumentMatchers.<String>isNull(),
                            isNull(),
                            isNull(),
                            isNull(),
                            isNull(),
                            isNull(),
                            eq(3)))
                    .thenReturn(List.of(row1, row2, row3));

            PublicTaskFeedPage page = service.listOpenFeed(null, null, null, null, null, 2);

            assertThat(page.data()).containsExactly(row1, row2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isNotBlank();
        }

        @Test
        @DisplayName("passes category and geo-radius filters to the projection DAO")
        void passesFilters() {
            when(projectionDao.findOpenFeed(eq("cat-1"), eq(47.9), eq(106.9), eq(5000.0), isNull(), isNull(), eq(21)))
                    .thenReturn(List.of());

            service.listOpenFeed("cat-1", 47.9, 106.9, 5.0, null, 20);

            verify(projectionDao)
                    .findOpenFeed(eq("cat-1"), eq(47.9), eq(106.9), eq(5000.0), isNull(), isNull(), eq(21));
        }

        @Test
        @DisplayName("rejects malformed cursors")
        void rejectsMalformedCursor() {
            assertThatThrownBy(() -> service.listOpenFeed(null, null, null, null, "not-a-cursor", 20))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cursor is invalid");
        }
    }

    private PublicTaskFeedRow row(UUID id, Instant createdAt) {
        return new PublicTaskFeedRow(
                id.toString(),
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
                Instant.parse("2026-04-02T10:00:00Z"),
                createdAt);
    }
}
