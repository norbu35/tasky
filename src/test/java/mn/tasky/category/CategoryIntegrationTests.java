package mn.tasky.category;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

class CategoryIntegrationTests extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-020-API-CATEGORIES-PUBLIC public endpoint returns only active categories")
    void publicCategoryEndpointReturnsOnlyActiveCategories() {
        String adminToken = tokenFor("ADMIN", "ACTIVE");
        String customerToken = tokenFor("CUSTOMER", "ACTIVE");

        ResponseEntity<Map> activeCreate = postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name", "Car Wash " + randomSuffix(),
                "name_mn", "Машин угаалга " + randomSuffix(),
                "icon_url", "https://cdn.tasky.local/icons/car-wash.png",
                "sort_order", 120
            )
        );
        assertThat(activeCreate.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String activeId = String.valueOf(activeCreate.getBody().get("id"));

        ResponseEntity<Map> inactiveCreate = postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name", "Pet Care " + randomSuffix(),
                "name_mn", "Амьтан асаргаа " + randomSuffix(),
                "icon_url", "https://cdn.tasky.local/icons/pet-care.png",
                "sort_order", 130
            )
        );
        assertThat(inactiveCreate.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String inactiveId = String.valueOf(inactiveCreate.getBody().get("id"));

        ResponseEntity<Map> deactivate = putWithAuth(
            "/api/v1/admin/categories/" + inactiveId,
            adminToken,
            Map.of("is_active", false)
        );
        assertThat(deactivate.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(deactivate.getBody()).containsEntry("is_active", false);

        ResponseEntity<Map> publicList = getWithAuth(
            "/api/v1/categories?limit=100",
            customerToken
        );
        assertThat(publicList.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> categories = (List<Map<String, Object>>) publicList.getBody().get("data");
        List<String> publicIds = categories.stream()
            .map(item -> String.valueOf(item.get("id")))
            .toList();

        assertThat(categories).allSatisfy(category -> assertThat(category.get("is_active")).isEqualTo(true));
        assertThat(publicIds).contains(activeId);
        assertThat(publicIds).doesNotContain(inactiveId);
    }

    @Test
    @DisplayName("TID-TASK-020-API-CATEGORIES-ADMIN-CRUD admin can create update deactivate and list categories")
    void adminCategoryCrudFlow() {
        String adminToken = tokenFor("ADMIN", "ACTIVE");

        ResponseEntity<Map> created = postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name", "Gardening " + randomSuffix(),
                "name_mn", "Цэцэрлэгжүүлэлт " + randomSuffix(),
                "icon_url", "https://cdn.tasky.local/icons/gardening.png",
                "sort_order", 140
            )
        );

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody()).containsEntry("is_active", true);
        String categoryId = String.valueOf(created.getBody().get("id"));

        ResponseEntity<Map> updated = putWithAuth(
            "/api/v1/admin/categories/" + categoryId,
            adminToken,
            Map.of(
                "name", "Gardening Premium",
                "name_mn", "Цэцэрлэгжүүлэлт Дээд",
                "sort_order", 145,
                "is_active", false
            )
        );

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody()).containsEntry("name", "Gardening Premium");
        assertThat(updated.getBody()).containsEntry("name_mn", "Цэцэрлэгжүүлэлт Дээд");
        assertThat(updated.getBody()).containsEntry("sort_order", 145);
        assertThat(updated.getBody()).containsEntry("is_active", false);

        ResponseEntity<Map> adminList = getWithAuth(
            "/api/v1/admin/categories?limit=100",
            adminToken
        );
        assertThat(adminList.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> allCategories = (List<Map<String, Object>>) adminList.getBody().get("data");
        Map<String, Object> target = allCategories.stream()
            .filter(item -> categoryId.equals(String.valueOf(item.get("id"))))
            .findFirst()
            .orElseThrow();

        assertThat(target.get("is_active")).isEqualTo(false);
        assertThat(target.get("name")).isEqualTo("Gardening Premium");
    }

    @Test
    @DisplayName("invalid cursor returns bad request for category listing")
    void invalidCursorReturnsBadRequest() {
        String customerToken = tokenFor("CUSTOMER", "ACTIVE");

        ResponseEntity<Map> response = getWithAuth(
            "/api/v1/categories?cursor=not-valid-base64",
            customerToken
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "INVALID_CURSOR");
    }

    @Test
    @DisplayName("missing category update returns not found")
    void updateMissingCategoryReturnsNotFound() {
        String adminToken = tokenFor("ADMIN", "ACTIVE");
        String missingId = UUID.randomUUID().toString();

        ResponseEntity<Map> response = putWithAuth(
            "/api/v1/admin/categories/" + missingId,
            adminToken,
            Map.of("name", "No Match")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("code", "CATEGORY_NOT_FOUND");
    }

    @Test
    @DisplayName("TID-TASK-065-API-CURSOR-ENVELOPE common envelope and determinism")
    void commonPaginationEnvelopeAndDeterminism() {
        String adminToken = tokenFor("ADMIN", "ACTIVE");
        String customerToken = tokenFor("CUSTOMER", "ACTIVE");

        // Seed many categories
        for (int i = 0; i < 15; i++) {
            postWithAuth(
                "/api/v1/admin/categories",
                adminToken,
                Map.of(
                    "name", "Batch " + i,
                    "name_mn", "Багц " + i,
                    "icon_url", "https://cdn.tasky.local/icons/batch.png",
                    "sort_order", 500 + i
                )
            );
        }

        // Fetch first page
        ResponseEntity<Map> firstPage = getWithAuth(
            "/api/v1/categories?limit=5",
            customerToken
        );
        assertThat(firstPage.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(firstPage.getBody()).containsKey("cursor");
        Map<String, Object> firstCursor = (Map<String, Object>) firstPage.getBody().get("cursor");
        assertThat(firstCursor).containsKeys("next", "has_more");
        assertThat(firstCursor.get("has_more")).isEqualTo(true);
        String nextCursor = String.valueOf(firstCursor.get("next"));

        // Fetch second page
        ResponseEntity<Map> secondPage = getWithAuth(
            "/api/v1/categories?limit=5&cursor=" + nextCursor,
            customerToken
        );
        assertThat(secondPage.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> firstData = (List<Map<String, Object>>) firstPage.getBody().get("data");
        List<Map<String, Object>> secondData = (List<Map<String, Object>>) secondPage.getBody().get("data");

        // Ensure no overlap (determinism and stable sort)
        List<String> firstIds = firstData.stream().map(i -> String.valueOf(i.get("id"))).toList();
        List<String> secondIds = secondData.stream().map(i -> String.valueOf(i.get("id"))).toList();
        assertThat(firstIds).doesNotContainAnyElementsOf(secondIds);
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(
            url(path),
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private ResponseEntity<Map> putWithAuth(String path, String bearerToken, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(
            url(path),
            HttpMethod.PUT,
            new HttpEntity<>(body, headers),
            Map.class
        );
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);

        return restTemplate.exchange(
            url(path),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private String tokenFor(String role, String status) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(UUID.randomUUID().toString())
            .claim("role", role)
            .claim("status", status)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
            .compact();
    }

    private String randomSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
