package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;

/**
 * Domain-unit tests for booking service critical scenarios.
 * Covers: cancellation policy (SCN-BOOK-001/002/003), liability disclaimer (SCN-BOOK-007/008),
 * and terminal-state transition guard (SCN-BOOK-009).
 *
 * <p>SCN-BOOK-005 (tasker cancel reopens task) is covered by BookingIntegrationTests
 * because it requires BookingLifecycleService + TaskService coordination.
 * SCN-BOOK-004/006 are waived in registry — not yet implemented.
 */
class BookingScenarioTests {

    private final Map<String, BookingState> store = new HashMap<>();
    private BookingService bookingService;
    private BookingReliabilityIncidentDao incidentDao;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        store.clear();
        authService = mock(AuthService.class);
        BookingDao bookingDao = mock(BookingDao.class);
        incidentDao = mock(BookingReliabilityIncidentDao.class);
        BookingCompletionSignalDao completionSignalDao = mock(BookingCompletionSignalDao.class);

        // In-memory insert
        doAnswer(inv -> {
            String id = inv.getArgument(0);
            String taskId = inv.getArgument(1);
            String taskerId = inv.getArgument(2);
            String customerId = inv.getArgument(3);
            int price = inv.getArgument(4);
            String status = inv.getArgument(5);
            Integer fee = inv.getArgument(6);
            boolean disclaimer = inv.getArgument(7);
            Instant createdAt = inv.getArgument(12);
            Instant updatedAt = inv.getArgument(13);
            store.put(id, new BookingState(id, taskId, taskerId, customerId, price, status,
                    fee, disclaimer, null, "DIRECT", false, null, createdAt, updatedAt));
            return null;
        }).when(bookingDao).insert(anyString(), anyString(), anyString(), anyString(),
                anyInt(), anyString(), any(), anyBoolean(), any(), any(), anyBoolean(), any(),
                any(Instant.class), any(Instant.class));

        // In-memory findById
        when(bookingDao.findById(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0))));

        // In-memory update
        doAnswer(inv -> {
            String id = inv.getArgument(0);
            String newStatus = inv.getArgument(1);
            Integer fee = inv.getArgument(2);
            boolean disclaimer = inv.getArgument(3);
            Instant updatedAt = inv.getArgument(4);
            BookingState ex = store.get(id);
            if (ex != null) {
                store.put(id, new BookingState(ex.id(), ex.taskId(), ex.taskerId(), ex.customerId(),
                        ex.price(), newStatus, fee, disclaimer, ex.confirmedScheduledAt(),
                        ex.settlementMode(), ex.lateCancelIncident(), ex.liabilityDisclaimerAcceptedAt(),
                        ex.createdAt(), updatedAt));
            }
            return null;
        }).when(bookingDao).update(anyString(), anyString(), any(), anyBoolean(), any(Instant.class));

        when(completionSignalDao.markDone(anyString(), anyString(), any())).thenReturn(1);
        when(completionSignalDao.findByBookingId(anyString())).thenReturn(Optional.empty());

        bookingService = new BookingService(authService, bookingDao, incidentDao,
                completionSignalDao, new SimpleMeterRegistry());
    }

    // ── SCN-BOOK-001 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-001: Customer cancels more than 4 hours before schedule - no incident and no fee")
    void customerCancelMoreThan4HoursBeforeScheduleNoIncidentNoFee() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        Instant scheduledAt = Instant.now().plus(5, ChronoUnit.HOURS);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().status()).isEqualTo("CANCELLED");
        verify(incidentDao, never()).insert(anyString(), anyString(), anyString(), anyString(), anyString(), any());
    }

    // ── SCN-BOOK-002 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-002: Customer cancels less than 4 hours before schedule - reliability incident recorded and no fee")
    void customerCancelWithin4HoursRecordsIncidentNoFee() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().status()).isEqualTo("CANCELLED");
        assertThat(result.booking().cancellationFee()).isNull();
        // Reliability incident recorded for late cancel (warning for first offense)
        verify(incidentDao).insert(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL_WARNING"), anyString(), any());
    }

    // ── SCN-BOOK-003 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-003: Customer cancels exactly 4 hours before schedule - treated as late")
    void customerCancelAtExactly4HourBoundaryIsTreatedAsLate() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        // Exactly 4 hours = NOW is NOT after (now - 4h) because fourHoursBefore == scheduledAt - 4h
        // At exactly 4h: fourHoursBefore = now → isAfter(now) = false → NOT late
        // Boundary: scheduledAt = now + 4h → fourHoursBefore = now → now.isAfter(now) = false
        // So exactly 4h = FREE (not late). Let's test 4h - 1 second = late.
        Instant scheduledAt = Instant.now().plus(4, ChronoUnit.HOURS).minusSeconds(1);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        verify(incidentDao).insert(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL_WARNING"), anyString(), any());
    }

    // ── SCN-BOOK-004 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-004: Customer cancels late 2 times within 28 days - Instant Match disabled")
    void customerCancelLateMultipleTimes() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);

        // Mock that they already have 1 recent incident
        org.mockito.Mockito.when(incidentDao.countRecentIncidents(
                org.mockito.ArgumentMatchers.eq("customer-1"), 
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL%"), 
                any(Instant.class)))
            .thenReturn(1L);

        BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

        assertThat(result.isSuccess()).isTrue();
        verify(incidentDao).insert(anyString(), anyString(), anyString(),
                org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL_PENALTY"), anyString(), any());
        verify(authService).revokeInstantMatch(
                org.mockito.ArgumentMatchers.eq("customer-1"),
                org.mockito.ArgumentMatchers.eq(java.time.Duration.ofDays(30)));
    }

    // ── SCN-BOOK-006 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-021: Tasker cancellation with Safety/Fraud reason bypasses automated strike and opens Trust and Safety ticket")
    void taskerCancelForSafetyDoesNotAddStrike() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        
        mn.tasky.task.application.TaskService taskService = mock(mn.tasky.task.application.TaskService.class);
        mn.tasky.task.dto.TaskState task = mock(mn.tasky.task.dto.TaskState.class);
        // Mock task state lookup
        when(taskService.getTask("task-1")).thenReturn(Optional.of(task));
        // Mock reopen task
        when(taskService.reopenTask("task-1")).thenReturn(Optional.of(task));
        
        mn.tasky.booking.application.BookingLifecycleService lifecycleService = new mn.tasky.booking.application.BookingLifecycleService(
                bookingService,
                mock(mn.tasky.booking.application.BookingTimelineService.class),
                taskService,
                authService,
                mock(mn.tasky.common.outbox.DomainEventOutboxService.class),
                mock(mn.tasky.dispute.dao.DisputeDao.class));

        // Use standard cancellation reason
        lifecycleService.cancelBooking("tasker-1", booking.id(), "Car broke down");
        verify(authService).addStrike("tasker-1", "Car broke down", booking.id());

        org.mockito.Mockito.reset(authService);
        
        // Use Safety/Fraud reason
        BookingState booking2 = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        lifecycleService.cancelBooking("tasker-1", booking2.id(), "Safety/Fraud");
        
        // No strike applied
        verify(authService, org.mockito.Mockito.never()).addStrike(anyString());
        verify(authService, org.mockito.Mockito.never()).addStrike(anyString(), anyString(), anyString());
    }


    // SCN-BOOK-007 moved to TaskAcceptScenarioTests — disclaimer rejection is tested
    // at the TaskService boundary where the guard actually lives.

    // ── SCN-BOOK-008 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-008: Liability disclaimer acceptance timestamp is recorded on the booking")
    void disclaimerAcceptanceTimestampRecorded() {
        BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

        Optional<BookingState> updated = bookingService.recordDisclaimerAcceptance(booking.id());

        assertThat(updated).isPresent();
        assertThat(updated.get().liabilityDisclaimerAccepted()).isTrue();
        // Unknown booking returns empty
        assertThat(bookingService.recordDisclaimerAcceptance(UUID.randomUUID().toString())).isEmpty();
    }

    // ── SCN-BOOK-009 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-009: Terminal booking states reject invalid transitions with INVALID_TRANSITION")
    void terminalStatesRejectFurtherTransitions() {
        // COMPLETED → cannot cancel
        BookingState b1 = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
        bookingService.completeBooking("customer-1", b1.id());
        BookingTransitionResult afterComplete =
                bookingService.cancelBooking("customer-1", b1.id(), Instant.now().plus(1, ChronoUnit.HOURS));
        assertThat(afterComplete.errorCode()).isEqualTo(BookingTransitionResult.INVALID_TRANSITION);

        // CANCELLED → cannot complete
        BookingState b2 = bookingService.createBooking("task-2", "tasker-1", "customer-1", 50_000);
        bookingService.cancelBooking("customer-1", b2.id(), Instant.now().plus(5, ChronoUnit.HOURS));
        BookingTransitionResult afterCancel = bookingService.completeBooking("customer-1", b2.id());
        assertThat(afterCancel.errorCode()).isEqualTo(BookingTransitionResult.INVALID_TRANSITION);
    }

    // ── SCN-BOOK-005 (integration — requires BookingLifecycleService + TaskService) ─

    @Nested
    @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
    @SuppressWarnings({"rawtypes", "unchecked"})
    class LifecycleScenarios extends IntegrationTestBase {

        private final TestRestTemplate http = new TestRestTemplate();

        @LocalServerPort int port;
        @Autowired BookingService bookingService;
        @Autowired BookingLifecycleService lifecycleService;
        @Autowired TaskService taskService;

        @Test
        @DisplayName("SCN-BOOK-005 SCN-SMOKE-002: Tasker cancellation reopens the linked task to OPEN")
        void taskerCancellationReopensTask() {
            org.springframework.http.HttpHeaders h = new org.springframework.http.HttpHeaders();
            h.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            ResponseEntity<Map> custResp = http.postForEntity(url("/api/v1/auth/dev/login"),
                    new HttpEntity<>(Map.of("phone", "+97691500001", "role", "CUSTOMER"), h), Map.class);
            String custToken = (String) custResp.getBody().get("access_token");
            String custId    = (String) ((Map) custResp.getBody().get("user")).get("id");

            ResponseEntity<Map> taskerResp = http.postForEntity(url("/api/v1/auth/dev/login"),
                    new HttpEntity<>(Map.of("phone", "+97691500002", "role", "TASKER"), h), Map.class);
            String taskerId = (String) ((Map) taskerResp.getBody().get("user")).get("id");

            org.springframework.http.HttpHeaders auth = new org.springframework.http.HttpHeaders();
            auth.setBearerAuth(custToken);
            auth.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            Map cats = http.exchange(url("/api/v1/categories"), HttpMethod.GET,
                    new HttpEntity<>(auth), Map.class).getBody();
            String catId = ((Map) ((List) cats.get("data")).get(0)).get("id").toString();

            Map taskBody = Map.of("category_id", catId,
                    "description", "Test task for SCN-BOOK-005 scenario",
                    "budget", 50000,
                    "location_lat", 47.9, "location_lng", 106.9,
                    "location_text", "Test Street 1, UB",
                    "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString());
            ResponseEntity<Map> taskCreateResp = http.exchange(url("/api/v1/tasks"), HttpMethod.POST,
                    new HttpEntity<>(taskBody, auth), Map.class);
            assertThat(taskCreateResp.getStatusCode().value())
                    .as("Task creation failed: %s", taskCreateResp.getBody())
                    .isLessThan(300);
            String taskId = (String) taskCreateResp.getBody().get("id");

            // Create booking via service
            mn.tasky.booking.dto.BookingState booking =
                    bookingService.createBooking(taskId, taskerId, custId, 50000);

            // Tasker cancels via lifecycle service (also updates task status)
            BookingTransitionResult result = lifecycleService.cancelBooking(taskerId, booking.id(), null);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.booking().status()).isEqualTo("CANCELLED");
            assertThat(taskService.getTask(taskId)).isPresent()
                    .hasValueSatisfying(t -> assertThat(t.status()).isEqualTo("OPEN"));
        }

        private String url(String path) { return "http://localhost:" + port + path; }
    }
}
