package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.RebookResult;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RepeatBookingServiceTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private TaskDao taskDao;

    @Mock
    private CategorySchemaVersionDao categorySchemaVersionDao;

    private RepeatBookingService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new RepeatBookingService(bookingService, taskDao, categorySchemaVersionDao);
    }

    private BookingState completedBooking(String bookingId, String customerId, String taskerId, String taskId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "COMPLETED",
                null,
                true,
                now,
                "DIRECT",
                false,
                now,
                0,
                null,
                now,
                now);
    }

    private BookingState assignedBooking(String bookingId, String customerId, String taskerId, String taskId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                true,
                now,
                "DIRECT",
                false,
                now,
                0,
                null,
                now,
                now);
    }

    private TaskState completedTask(String taskId, String customerId) {
        return new TaskState(
                taskId,
                customerId,
                "cat1",
                "Fix sink",
                5000,
                47.9,
                106.9,
                "UB",
                "COMPLETED",
                now,
                "BUDGET",
                null,
                "{\"q\":\"a\"}",
                2,
                null,
                now,
                now);
    }

    private CategorySchemaVersion activeSchema(String categoryId, int version) {
        return new CategorySchemaVersion("csv1", categoryId, version, "{}", "ACTIVE", "admin", now, now);
    }

    @Test
    void rebook_bookingNotFound() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.empty());
        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(RebookResult.NOT_FOUND);
    }

    @Test
    void rebook_bookingNotCompleted() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(assignedBooking("b1", "c1", "tk1", "t1")));
        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(RebookResult.NOT_COMPLETED);
    }

    @Test
    void rebook_wrongCustomer() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "other", "tk1", "t1")));
        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(RebookResult.FORBIDDEN);
    }

    @Test
    void rebook_originalTaskNotFound() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));
        when(taskDao.findById("t1")).thenReturn(Optional.empty());
        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(RebookResult.TASK_NOT_FOUND);
    }

    @Test
    void rebook_success_withActiveSchemaVersion() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));
        when(taskDao.findById("t1")).thenReturn(Optional.of(completedTask("t1", "c1")));
        when(categorySchemaVersionDao.findActiveByCategoryId("cat1")).thenReturn(Optional.of(activeSchema("cat1", 3)));

        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.task()).isNotNull();
        assertThat(result.task().status()).isEqualTo("OPEN");
        assertThat(result.task().scheduledAt()).isNull();
        assertThat(result.task().intakeSchemaVersion()).isEqualTo(3);
        assertThat(result.task().description()).isEqualTo("Fix sink");
        assertThat(result.task().intakeAnswersJson()).isEqualTo("{\"q\":\"a\"}");

        verify(taskDao)
                .insert(
                        anyString(),
                        eq("c1"),
                        eq("cat1"),
                        eq("Fix sink"),
                        eq(5000),
                        eq(47.9),
                        eq(106.9),
                        eq("UB"),
                        eq("OPEN"),
                        isNull(),
                        eq("BUDGET"),
                        eq("{\"q\":\"a\"}"),
                        eq(3),
                        isNull(),
                        any(Instant.class),
                        any(Instant.class));
    }

    @Test
    void rebook_success_fallsBackToOriginalSchemaVersion() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));
        when(taskDao.findById("t1")).thenReturn(Optional.of(completedTask("t1", "c1")));
        when(categorySchemaVersionDao.findActiveByCategoryId("cat1")).thenReturn(Optional.empty());

        RebookResult result = service.rebook("b1", "c1");
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.task().intakeSchemaVersion()).isEqualTo(2);

        verify(taskDao)
                .insert(
                        anyString(),
                        eq("c1"),
                        eq("cat1"),
                        eq("Fix sink"),
                        eq(5000),
                        eq(47.9),
                        eq(106.9),
                        eq("UB"),
                        eq("OPEN"),
                        isNull(),
                        eq("BUDGET"),
                        eq("{\"q\":\"a\"}"),
                        eq(2),
                        isNull(),
                        any(Instant.class),
                        any(Instant.class));
    }

    @Test
    void rebook_copiesAllOriginalFields() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));
        when(taskDao.findById("t1")).thenReturn(Optional.of(completedTask("t1", "c1")));
        when(categorySchemaVersionDao.findActiveByCategoryId("cat1")).thenReturn(Optional.of(activeSchema("cat1", 3)));

        RebookResult result = service.rebook("b1", "c1");
        TaskState newTask = result.task();
        assertThat(newTask.customerId()).isEqualTo("c1");
        assertThat(newTask.categoryId()).isEqualTo("cat1");
        assertThat(newTask.budget()).isEqualTo(5000);
        assertThat(newTask.locationLat()).isEqualTo(47.9);
        assertThat(newTask.locationLng()).isEqualTo(106.9);
        assertThat(newTask.locationText()).isEqualTo("UB");
        assertThat(newTask.pricingMode()).isEqualTo("BUDGET");
    }
}
