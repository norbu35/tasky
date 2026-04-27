package mn.tasky.projection.publicfeed;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class PublicTaskFeedProjectionIntegrationTests extends IntegrationTestBase {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PublicTaskFeedProjectionService service;

    @Test
    @DisplayName("TID-TASK-116-PROJECTION-FEED public feed projection filters and approximates by district")
    void publicFeedProjectionFiltersAndApproximatesByDistrict() {
        UUID customerId = UUID.randomUUID();
        String categoryId = jdbcTemplate.queryForObject(
                "SELECT id::text FROM categories ORDER BY sort_order LIMIT 1", String.class);
        String otherCategoryId = jdbcTemplate.queryForObject(
                "SELECT id::text FROM categories WHERE id::text <> ? ORDER BY sort_order LIMIT 1",
                String.class,
                categoryId);

        insertCustomer(customerId);
        insertTask(
                UUID.randomUUID(),
                customerId,
                categoryId,
                "OPEN",
                47.9214,
                106.9196,
                "Exact Sukhbaatar address",
                Instant.parse("2026-04-03T10:00:00Z"));
        insertTask(
                UUID.randomUUID(),
                customerId,
                otherCategoryId,
                "OPEN",
                47.9133,
                106.8684,
                "Exact Bayangol address",
                Instant.parse("2026-04-03T09:00:00Z"));
        insertTask(
                UUID.randomUUID(),
                customerId,
                categoryId,
                "ASSIGNED",
                47.9214,
                106.9196,
                "Assigned address",
                Instant.parse("2026-04-03T08:00:00Z"));

        PublicTaskFeedPage categoryPage = service.listOpenFeed(categoryId, null, null, null, null, 10);
        PublicTaskFeedPage geoPage = service.listOpenFeed(null, 47.9213, 106.9197, 1.0, null, 10);

        assertThat(categoryPage.data()).hasSize(1);
        PublicTaskFeedRow row = categoryPage.data().getFirst();
        assertThat(row.status()).isEqualTo("OPEN");
        assertThat(row.categoryId()).isEqualTo(categoryId);
        assertThat(row.approximateLocation()).isEqualTo("Sukhbaatar, Ulaanbaatar");
        assertThat(row.approximateLat()).isEqualTo(47.9213);
        assertThat(row.approximateLng()).isEqualTo(106.9197);
        assertThat(row.description()).isEqualTo("Clean apartment");
        assertThat(geoPage.data()).extracting(PublicTaskFeedRow::categoryId).contains(categoryId);
    }

    private void insertCustomer(UUID customerId) {
        jdbcTemplate.update(
                "INSERT INTO users (id, phone, phone_blind_idx, role, status, primary_auth, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'CUSTOMER', 'ACTIVE', 'FACEBOOK', now(), now())",
                customerId,
                "+976" + customerId.toString().substring(0, 8),
                "blind-" + customerId);
        jdbcTemplate.update(
                "INSERT INTO profiles (user_id, full_name, avatar_url, rating_avg, completed_tasks) "
                        + "VALUES (?, 'Projection Customer', null, 0, 0)",
                customerId);
    }

    private void insertTask(
            UUID taskId,
            UUID customerId,
            String categoryId,
            String status,
            double lat,
            double lng,
            String exactAddress,
            Instant createdAt) {
        jdbcTemplate.update(
                "INSERT INTO tasks (id, customer_id, category_id, description, budget, pricing_mode, "
                        + "location_lat, location_lng, location_text, status, scheduled_at, "
                        + "intake_answers_json, intake_schema_version, scope_summary_source, created_at, updated_at) "
                        + "VALUES (?, ?, ?::uuid, 'Clean apartment', 50000, 'BUDGET', ?, ?, ?, ?, "
                        + "?, '{}'::jsonb, 1, 'TEMPLATE', ?, ?)",
                taskId,
                customerId,
                categoryId,
                lat,
                lng,
                exactAddress,
                status,
                Timestamp.from(Instant.parse("2026-04-05T10:00:00Z")),
                Timestamp.from(createdAt),
                Timestamp.from(createdAt));
    }
}
