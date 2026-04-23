package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import mn.tasky.location.publicapi.LocationQueryPort;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicTaskCompositionServiceTests {

    @Mock
    private MarketplaceQueryPort marketplaceQueryPort;

    @Mock
    private BookingQueryPort bookingQueryPort;

    @Mock
    private CategoryQueryPort categoryQueryPort;

    @Mock
    private IdentityQueryPort identityQueryPort;

    @Mock
    private LocationQueryPort locationQueryPort;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private PublicTaskCompositionService service;

    @BeforeEach
    void setUp() {
        service = new PublicTaskCompositionService(
                marketplaceQueryPort,
                bookingQueryPort,
                categoryQueryPort,
                identityQueryPort,
                objectMapper,
                locationQueryPort);
    }

    private TaskState buildTask() {
        return buildTask("OPEN");
    }

    private TaskState buildTask(String status) {
        return new TaskState(
                UUID.randomUUID().toString(),
                "customer-001",
                "cat-001",
                "Fix my sink",
                50000,
                47.918,
                106.917,
                "Ulaanbaatar",
                status,
                Instant.parse("2025-07-01T10:00:00Z"),
                "BUDGET",
                List.of("uploads/tasks/customer-001/photo1.jpg"),
                null,
                null,
                null,
                Instant.parse("2025-06-20T08:00:00Z"),
                Instant.parse("2025-06-20T08:00:00Z"));
    }

    private ReverseGeocodeResponse buildReverseGeocode() {
        return new ReverseGeocodeResponse("Khan-Uul, Ulaanbaatar", "Khan-Uul", "Хан-Уул", 47.92, 106.92);
    }

    private CategoryState buildCategory() {
        return new CategoryState(
                "cat-001",
                "Plumbing",
                "Ус хоолой",
                "https://cdn.tasky.mn/icons/plumbing.png",
                true,
                1,
                true,
                1,
                "{\"fields\":[]}");
    }

    private UserProfile buildCustomerProfile() {
        return new UserProfile(
                "customer-001",
                "+97699112233",
                "CUSTOMER",
                "VERIFIED",
                "Batdorj",
                null,
                null,
                4.5,
                10,
                false,
                "2025-01-01T00:00:00Z");
    }

    private TaskApplicationState buildApplication() {
        return new TaskApplicationState(
                "app-001",
                UUID.randomUUID().toString(),
                "tasker-001",
                "Dorj",
                "https://cdn.tasky.mn/avatars/tasker-001.jpg",
                4.8,
                25,
                true,
                "I can fix this",
                45000,
                "PENDING",
                null,
                null,
                null,
                null,
                Instant.parse("2025-06-21T09:00:00Z"));
    }

    @Nested
    @DisplayName("toPublicTaskResponses")
    class ToPublicTaskResponses {

        @Test
        @DisplayName("maps task list into public response list with category, customer profile, and location")
        void mapsTaskListToPublicResponses() {
            TaskState task = buildTask();
            when(locationQueryPort.reverseGeocode(task.locationLat(), task.locationLng()))
                    .thenReturn(buildReverseGeocode());
            when(categoryQueryPort.getCategory(task.categoryId())).thenReturn(Optional.of(buildCategory()));
            when(identityQueryPort.getProfile(task.customerId())).thenReturn(Optional.of(buildCustomerProfile()));
            when(marketplaceQueryPort.buildPhotoAccessUrls(any(), anyString()))
                    .thenReturn(List.of("https://cdn/photo1"));
            when(marketplaceQueryPort.countApplications(task.id())).thenReturn(3);

            List<Map<String, Object>> results = service.toPublicTaskResponses(List.of(task));

            assertThat(results).hasSize(1);
            Map<String, Object> response = results.get(0);
            assertThat(response.get("id")).isEqualTo(task.id());
            assertThat(response.get("description")).isEqualTo("Fix my sink");
            assertThat(response.get("budget")).isEqualTo(50000);
            assertThat(response.get("approximate_location")).isEqualTo("Khan-Uul, Ulaanbaatar");
            assertThat(response.get("application_count")).isEqualTo(3);
            assertThat(response.get("status")).isEqualTo("OPEN");
            assertThat(response.get("category")).isNotNull();
            assertThat(response.get("customer")).isNotNull();
        }

        @Test
        @DisplayName("returns empty list for empty input")
        void returnsEmptyForEmptyInput() {
            List<Map<String, Object>> results = service.toPublicTaskResponses(List.of());

            assertThat(results).isEmpty();
            verifyNoInteractions(marketplaceQueryPort, categoryQueryPort, identityQueryPort, locationQueryPort);
        }

        @Test
        @DisplayName("omits category and customer when ports return empty optional")
        void omitsCategoryAndCustomerWhenEmpty() {
            TaskState task = buildTask();
            when(locationQueryPort.reverseGeocode(task.locationLat(), task.locationLng()))
                    .thenReturn(buildReverseGeocode());
            when(categoryQueryPort.getCategory(task.categoryId())).thenReturn(Optional.empty());
            when(identityQueryPort.getProfile(task.customerId())).thenReturn(Optional.empty());
            when(marketplaceQueryPort.buildPhotoAccessUrls(any(), anyString())).thenReturn(List.of());
            when(marketplaceQueryPort.countApplications(task.id())).thenReturn(0);

            Map<String, Object> response =
                    service.toPublicTaskResponses(List.of(task)).get(0);

            assertThat(response).doesNotContainKey("category");
            assertThat(response).doesNotContainKey("customer");
        }

        @Test
        @DisplayName("handles null photoKeys by passing empty list")
        void handlesNullPhotoKeys() {
            TaskState task = new TaskState(
                    "t1",
                    "c1",
                    "cat1",
                    "desc",
                    100,
                    47.9,
                    106.9,
                    "loc",
                    "OPEN",
                    Instant.now(),
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
            when(locationQueryPort.reverseGeocode(anyDouble(), anyDouble())).thenReturn(buildReverseGeocode());
            when(categoryQueryPort.getCategory(anyString())).thenReturn(Optional.empty());
            when(identityQueryPort.getProfile(anyString())).thenReturn(Optional.empty());
            when(marketplaceQueryPort.buildPhotoAccessUrls(any(), anyString())).thenReturn(List.of());
            when(marketplaceQueryPort.countApplications(anyString())).thenReturn(0);

            Map<String, Object> response =
                    service.toPublicTaskResponses(List.of(task)).get(0);

            assertThat(response.get("photo_urls")).isEqualTo(List.of());
        }
    }

    @Nested
    @DisplayName("toOwnedTaskResponses")
    class ToOwnedTaskResponses {

        @Test
        @DisplayName("includes exact location coordinates and intake answers in owned response")
        void includesExactLocationAndDetails() {
            TaskState task = new TaskState(
                    "t-owned",
                    "c1",
                    "cat1",
                    "Detailed task",
                    80000,
                    47.9184,
                    106.9175,
                    "Sukhbaatar",
                    "ASSIGNED",
                    Instant.parse("2025-07-01T10:00:00Z"),
                    "HOURLY",
                    List.of("uploads/tasks/c1/photo1.jpg"),
                    "{\"q1\":\"a1\"}",
                    1,
                    "GPT",
                    Instant.parse("2025-06-20T08:00:00Z"),
                    Instant.parse("2025-06-21T08:00:00Z"));

            when(categoryQueryPort.getCategory("cat1")).thenReturn(Optional.empty());
            when(marketplaceQueryPort.buildOwnedPhotoAccessUrl("uploads/tasks/c1/photo1.jpg", "c1"))
                    .thenReturn(Optional.of("https://cdn.tasky.mn/uploads/tasks/c1/photo1.jpg"));

            Map<String, Object> response =
                    service.toOwnedTaskResponses(List.of(task)).get(0);

            assertThat(response.get("id")).isEqualTo("t-owned");
            assertThat(response.get("location_lat")).isEqualTo(47.9184);
            assertThat(response.get("location_lng")).isEqualTo(106.9175);
            assertThat(response.get("location_text")).isEqualTo("Sukhbaatar");
            assertThat(response.get("intake_answers")).isEqualTo(Map.of("q1", "a1"));
            assertThat(response.get("intake_schema_version")).isEqualTo(1);
            assertThat(response.get("scope_summary_source")).isEqualTo("GPT");
            assertThat(response.get("photos")).isNotNull();
        }

        @Test
        @DisplayName("returns empty photos when photoKeys is null")
        void returnsEmptyPhotosForNullPhotoKeys() {
            TaskState task = buildTaskWithNullPhotos();

            when(categoryQueryPort.getCategory(anyString())).thenReturn(Optional.empty());

            Map<String, Object> response =
                    service.toOwnedTaskResponses(List.of(task)).get(0);

            assertThat(response.get("photos")).isEqualTo(List.of());
            assertThat(response.get("photo_keys")).isEqualTo(List.of());
        }

        private TaskState buildTaskWithNullPhotos() {
            return new TaskState(
                    "t2",
                    "c2",
                    "cat2",
                    "desc",
                    100,
                    47.9,
                    106.9,
                    "loc",
                    "OPEN",
                    Instant.now(),
                    "BUDGET",
                    null,
                    null,
                    null,
                    null,
                    Instant.now(),
                    Instant.now());
        }
    }

    @Nested
    @DisplayName("toTaskResponseForViewer")
    class ToTaskResponseForViewer {

        @Test
        @DisplayName("returns owned response when viewer is the task customer")
        void returnsOwnedForCustomer() {
            TaskState task = buildTask();
            when(categoryQueryPort.getCategory(anyString())).thenReturn(Optional.empty());

            Map<String, Object> response = service.toTaskResponseForViewer(task, "customer-001");

            assertThat(response.get("customer_id")).isEqualTo("customer-001");
            assertThat(response).containsKey("location_text");
        }

        @Test
        @DisplayName("returns owned response when viewer is booked tasker for the task")
        void returnsOwnedForBookedTasker() {
            TaskState task = buildTask();
            String taskerId = "tasker-001";
            BookingState booking = new BookingState(
                    "b1",
                    task.id(),
                    taskerId,
                    "customer-001",
                    50000,
                    "ASSIGNED",
                    null,
                    true,
                    null,
                    "MANUAL",
                    false,
                    null,
                    0,
                    null,
                    Instant.now(),
                    Instant.now());
            when(bookingQueryPort.listBookings(taskerId, "tasker", null)).thenReturn(List.of(booking));
            when(categoryQueryPort.getCategory(anyString())).thenReturn(Optional.empty());

            Map<String, Object> response = service.toTaskResponseForViewer(task, taskerId);

            assertThat(response.get("customer_id")).isEqualTo("customer-001");
        }

        @Test
        @DisplayName("returns public response when viewer is neither customer nor booked tasker")
        void returnsPublicForOtherViewer() {
            TaskState task = buildTask();
            when(bookingQueryPort.listBookings("stranger", "tasker", null)).thenReturn(List.of());
            when(locationQueryPort.reverseGeocode(anyDouble(), anyDouble())).thenReturn(buildReverseGeocode());
            when(categoryQueryPort.getCategory(anyString())).thenReturn(Optional.empty());
            when(identityQueryPort.getProfile(anyString())).thenReturn(Optional.empty());
            when(marketplaceQueryPort.buildPhotoAccessUrls(any(), anyString())).thenReturn(List.of());
            when(marketplaceQueryPort.countApplications(anyString())).thenReturn(0);

            Map<String, Object> response = service.toTaskResponseForViewer(task, "stranger");

            assertThat(response).containsKey("approximate_location");
            assertThat(response).doesNotContainKey("customer_id");
        }
    }

    @Nested
    @DisplayName("toTaskApplicationResponses")
    class ToTaskApplicationResponses {

        @Test
        @DisplayName("maps application list to response maps with tasker info")
        void mapsApplications() {
            TaskApplicationState app = buildApplication();
            List<Map<String, Object>> results = service.toTaskApplicationResponses(List.of(app));

            assertThat(results).hasSize(1);
            Map<String, Object> response = results.get(0);
            assertThat(response.get("id")).isEqualTo("app-001");
            assertThat(response.get("task_id")).isEqualTo(app.taskId());

            @SuppressWarnings("unchecked")
            Map<String, Object> tasker = (Map<String, Object>) response.get("tasker");
            assertThat(tasker.get("id")).isEqualTo("tasker-001");
            assertThat(tasker.get("full_name")).isEqualTo("Dorj");
            assertThat(tasker.get("rating_avg")).isEqualTo(4.8);
            assertThat(tasker.get("completed_tasks")).isEqualTo(25);
            assertThat(tasker.get("is_pro")).isEqualTo(true);

            assertThat(response.get("message")).isEqualTo("I can fix this");
            assertThat(response.get("quote_price")).isEqualTo(45000);
            assertThat(response.get("status")).isEqualTo("PENDING");
        }

        @Test
        @DisplayName("returns empty list for empty input")
        void returnsEmptyForEmptyInput() {
            assertThat(service.toTaskApplicationResponses(List.of())).isEmpty();
        }

        @Test
        @DisplayName("uses empty string for null avatar URL in application response")
        void handlesNullAvatarUrl() {
            TaskApplicationState app = new TaskApplicationState(
                    "app-2",
                    "t1",
                    "tasker-2",
                    "Bold",
                    null,
                    3.0,
                    5,
                    false,
                    "msg",
                    null,
                    "PENDING",
                    null,
                    null,
                    null,
                    null,
                    Instant.now());

            Map<String, Object> response =
                    service.toTaskApplicationResponses(List.of(app)).get(0);

            @SuppressWarnings("unchecked")
            Map<String, Object> tasker = (Map<String, Object>) response.get("tasker");
            assertThat(tasker.get("avatar_url")).isEqualTo("");
        }
    }

    @Nested
    @DisplayName("recentLocationsResponse")
    class RecentLocationsResponse {

        @Test
        @DisplayName("wraps location list in locations key with lat, lng, text")
        void wrapsLocations() {
            List<RecentLocation> locations = List.of(
                    new RecentLocation(47.918, 106.917, "Khan-Uul District"),
                    new RecentLocation(47.920, 106.920, "Sukhbaatar District"));

            Map<String, Object> response = service.recentLocationsResponse(locations);

            assertThat(response).containsKey("locations");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("locations");
            assertThat(data).hasSize(2);
            assertThat(data.get(0).get("location_lat")).isEqualTo(47.918);
            assertThat(data.get(0).get("location_text")).isEqualTo("Khan-Uul District");
        }

        @Test
        @DisplayName("returns empty locations array for empty input")
        void returnsEmptyForEmptyInput() {
            Map<String, Object> response = service.recentLocationsResponse(List.of());

            assertThat(response.get("locations")).isEqualTo(List.of());
        }
    }
}
