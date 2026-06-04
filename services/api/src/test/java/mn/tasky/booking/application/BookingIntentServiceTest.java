package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingIntentService.CreateResult;
import mn.tasky.booking.dao.BookingIntentDao;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentDeclineResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingIntentServiceTest {

    @Mock
    private BookingIntentDao bookingIntentDao;

    @Mock
    private BookingService bookingService;

    @Mock
    private TaskDao taskDao;

    @Mock
    private TaskApplicationDao taskApplicationDao;

    @Mock
    private NotificationService notificationService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    private BookingIntentService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new BookingIntentService(
                bookingIntentDao,
                bookingService,
                taskDao,
                taskApplicationDao,
                notificationService,
                domainEventOutboxService);
    }

    private TaskState openTask(String taskId, String customerId) {
        return new TaskState(
                taskId,
                customerId,
                "cat1",
                "desc",
                5000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                now,
                "BUDGET",
                null,
                null,
                null,
                null,
                now,
                now);
    }

    private BookingState completedBooking(String bookingId, String customerId, String taskerId, String taskId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                5000,
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

    private BookingIntentState pendingIntent(
            String intentId,
            String taskId,
            String taskerId,
            String customerId,
            String source,
            String originalBookingId) {
        return new BookingIntentState(
                intentId,
                taskId,
                taskerId,
                customerId,
                source,
                "PENDING",
                null,
                originalBookingId,
                null,
                null,
                null,
                null,
                now,
                now);
    }

    private BookingIntentState pendingApplicationSelectionIntent(String intentId) {
        return new BookingIntentState(
                intentId,
                "t1",
                "tk1",
                "c1",
                BookingIntentService.SOURCE_APPLICATION_SELECTION,
                "PENDING",
                "app1",
                null,
                null,
                now.plusSeconds(3600),
                null,
                null,
                now,
                now);
    }

    private TaskApplicationState selectedApplication() {
        return new TaskApplicationState(
                "app1",
                "t1",
                "tk1",
                "Tasker",
                null,
                4.8,
                12,
                false,
                "Ready",
                null,
                "SELECTED",
                null,
                null,
                now,
                now.plusSeconds(3600),
                now);
    }

    private BookingIntentState confirmedIntent(
            String intentId,
            String taskId,
            String taskerId,
            String customerId,
            String source,
            String originalBookingId,
            String confirmedBookingId) {
        return new BookingIntentState(
                intentId,
                taskId,
                taskerId,
                customerId,
                source,
                "CONFIRMED",
                null,
                originalBookingId,
                null,
                null,
                confirmedBookingId,
                now,
                now,
                now);
    }

    // --- createIntent tests ---

    @Test
    void createIntent_missingSource_returnsInvalidRequest() {
        CreateResult result = service.createIntent("c1", "t1", "", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.INVALID_REQUEST);
    }

    @Test
    void createIntent_missingTaskerId_returnsInvalidRequest() {
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.INVALID_REQUEST);
    }

    @Test
    void createIntent_taskNotFound_returnsNotFound() {
        when(taskDao.findById("t1")).thenReturn(Optional.empty());
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.NOT_FOUND);
    }

    @Test
    void createIntent_wrongCustomer_returnsForbidden() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "other")));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.FORBIDDEN);
    }

    @Test
    void createIntent_taskNotOpen_returnsTaskNotOpen() {
        TaskState assigned = new TaskState(
                "t1",
                "c1",
                "cat1",
                "desc",
                5000,
                47.9,
                106.9,
                "UB",
                "ASSIGNED",
                now,
                "BUDGET",
                null,
                null,
                null,
                null,
                now,
                now);
        when(taskDao.findById("t1")).thenReturn(Optional.of(assigned));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.TASK_NOT_OPEN);
    }

    @Test
    void createIntent_instantMatchSource_returnsDeferred() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        CreateResult result = service.createIntent("c1", "t1", "INSTANT_MATCH", "tk1", null);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.DEFERRED);
    }

    @Test
    void createIntent_invalidSource_returnsInvalidSource() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        CreateResult result = service.createIntent("c1", "t1", "UNKNOWN", "tk1", null);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.INVALID_SOURCE);
    }

    @Test
    void createIntent_rebookMissingOriginalBookingId_returnsInvalidRequest() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", null);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.INVALID_REQUEST);
    }

    @Test
    void createIntent_originalBookingNotFound_returnsNotFound() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1")).thenReturn(Optional.empty());
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.NOT_FOUND);
    }

    @Test
    void createIntent_originalBookingWrongOwner_returnsForbidden() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "other", "tk1", "t1")));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.FORBIDDEN);
    }

    @Test
    void createIntent_originalBookingNotCompleted_returnsNotCompleted() {
        BookingState assignedBooking = new BookingState(
                "b1", "t1", "tk1", "c1", 5000, "ASSIGNED", null, true, now, "DIRECT", false, now, 0, null, now, now);
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(assignedBooking));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.NOT_COMPLETED);
    }

    @Test
    void createIntent_taskerMismatch_returnsConflict() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1"))
                .thenReturn(Optional.of(completedBooking("b1", "c1", "otherTasker", "t1")));
        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.CONFLICT);
    }

    @Test
    void createIntent_success_returnsIntent() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));

        BookingIntentState persisted = pendingIntent("newIntent", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById(anyString())).thenReturn(Optional.of(persisted));

        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.intent()).isNotNull();
        assertThat(result.intent().status()).isEqualTo("PENDING");
        verify(bookingIntentDao)
                .insert(
                        anyString(),
                        eq("t1"),
                        eq("tk1"),
                        eq("c1"),
                        eq("REBOOK"),
                        eq("PENDING"),
                        eq("b1"),
                        eq((String) null),
                        eq((Instant) null),
                        any(Instant.class),
                        any(Instant.class));
    }

    @Test
    void createIntent_notPersisted_returnsNotFound() {
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(completedBooking("b1", "c1", "tk1", "t1")));
        when(bookingIntentDao.findById(anyString())).thenReturn(Optional.empty());

        CreateResult result = service.createIntent("c1", "t1", "REBOOK", "tk1", "b1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(CreateResult.NOT_FOUND);
    }

    // --- getIntent tests ---

    @Test
    void getIntent_found() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        assertThat(service.getIntent("i1")).isPresent();
    }

    @Test
    void getIntent_notFound() {
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.empty());
        assertThat(service.getIntent("i1")).isEmpty();
    }

    // --- confirmIntent tests ---

    @Test
    void confirmIntent_notFound() {
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.empty());
        BookingIntentConfirmResult result = service.confirmIntent("c1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.NOT_FOUND);
    }

    @Test
    void confirmIntent_wrongCustomer_returnsForbidden() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "other", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        BookingIntentConfirmResult result = service.confirmIntent("c1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.FORBIDDEN);
    }

    @Test
    void confirmIntent_instantMatch_returnsDeferred() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "INSTANT_MATCH", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.DEFERRED);
    }

    @Test
    void confirmIntent_alreadyConfirmed_returnsExistingBooking() {
        BookingIntentState intent = confirmedIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1", "existingB");
        BookingState existingBooking = completedBooking("existingB", "c1", "tk1", "t1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        when(bookingService.getBooking("existingB")).thenReturn(Optional.of(existingBooking));

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().id()).isEqualTo("existingB");
    }

    @Test
    void confirmIntent_alreadyConfirmed_bookingGone_returnsConflict() {
        BookingIntentState intent = confirmedIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1", "goneBooking");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        when(bookingService.getBooking("goneBooking")).thenReturn(Optional.empty());

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.CONFLICT);
    }

    @Test
    void confirmIntent_statusNotPending_returnsConflict() {
        BookingIntentState intent = new BookingIntentState(
                "i1", "t1", "tk1", "c1", "REBOOK", "EXPIRED", null, "b1", null, null, null, null, now, now);
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.CONFLICT);
    }

    @Test
    void confirmIntent_taskNotFound_returnsNotFound() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        when(taskDao.findById("t1")).thenReturn(Optional.empty());

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.NOT_FOUND);
    }

    @Test
    void confirmIntent_taskNotOpen_returnsTaskNotOpen() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        TaskState assigned = new TaskState(
                "t1",
                "c1",
                "cat1",
                "desc",
                5000,
                47.9,
                106.9,
                "UB",
                "ASSIGNED",
                now,
                "BUDGET",
                null,
                null,
                null,
                null,
                now,
                now);
        when(taskDao.findById("t1")).thenReturn(Optional.of(assigned));

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(BookingIntentConfirmResult.TASK_NOT_OPEN);
    }

    @Test
    void confirmIntent_success() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));

        TaskState task = openTask("t1", "c1");
        when(taskDao.findById("t1")).thenReturn(Optional.of(task));

        BookingState newBooking = completedBooking("newB", "c1", "tk1", "t1");
        when(bookingService.createBooking(eq("t1"), eq("tk1"), eq("c1"), eq(5000), eq(true), any()))
                .thenReturn(newBooking);

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().id()).isEqualTo("newB");
        verify(bookingIntentDao).markConfirmed(eq("i1"), eq("newB"), any(Instant.class), any(Instant.class));
        verify(taskDao).updateStatus(eq("t1"), eq("ASSIGNED"), any(Instant.class));
    }

    @Test
    void confirmIntent_nullBudget_usesZero() {
        BookingIntentState intent = pendingIntent("i1", "t1", "tk1", "c1", "REBOOK", "b1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));

        TaskState task = new TaskState(
                "t1", "c1", "cat1", "desc", null, 47.9, 106.9, "UB", "OPEN", now, "BUDGET", null, null, null, null, now,
                now);
        when(taskDao.findById("t1")).thenReturn(Optional.of(task));

        BookingState newBooking = new BookingState(
                "newB", "t1", "tk1", "c1", 0, "ASSIGNED", null, true, now, "DIRECT", false, now, 0, null, now, now);
        when(bookingService.createBooking(eq("t1"), eq("tk1"), eq("c1"), eq(0), eq(true), any()))
                .thenReturn(newBooking);

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");
        assertThat(result.isSuccess()).isTrue();
        verify(bookingService).createBooking(eq("t1"), eq("tk1"), eq("c1"), eq(0), eq(true), any());
    }

    @Test
    void confirmIntent_applicationSelectionByTasker_confirmsBookingAndClosesOtherApplications() {
        BookingIntentState intent = pendingApplicationSelectionIntent("i1");
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent));
        when(taskDao.findById("t1")).thenReturn(Optional.of(openTask("t1", "c1")));
        when(taskApplicationDao.findByTaskerAndId("tk1", "app1")).thenReturn(Optional.of(selectedApplication()));
        BookingState newBooking = completedBooking("newB", "c1", "tk1", "t1");
        when(bookingService.createBooking(eq("t1"), eq("tk1"), eq("c1"), eq(5000), eq(true), any()))
                .thenReturn(newBooking);

        BookingIntentConfirmResult result = service.confirmIntent("tk1", "i1");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.booking().id()).isEqualTo("newB");
        verify(taskApplicationDao).updateStatus("app1", "ACCEPTED");
        verify(taskApplicationDao).rejectOthers("t1", "app1");
        verify(bookingIntentDao).markConfirmed(eq("i1"), eq("newB"), any(Instant.class), any(Instant.class));
    }

    @Test
    @DisplayName("SCN-BOOK-031: Selected tasker declines and task remains open for other applicants")
    void declineIntent_applicationSelectionByTasker_marksIntentAndApplicationDeclined() {
        BookingIntentState intent = pendingApplicationSelectionIntent("i1");
        BookingIntentState declinedIntent = new BookingIntentState(
                "i1",
                "t1",
                "tk1",
                "c1",
                BookingIntentService.SOURCE_APPLICATION_SELECTION,
                "DECLINED",
                "app1",
                null,
                null,
                now.plusSeconds(3600),
                null,
                null,
                now,
                now);
        when(bookingIntentDao.findById("i1")).thenReturn(Optional.of(intent), Optional.of(declinedIntent));
        when(taskApplicationDao.findByTaskerAndId("tk1", "app1")).thenReturn(Optional.of(selectedApplication()));

        BookingIntentDeclineResult result = service.declineIntent("tk1", "i1");

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.intent().status()).isEqualTo("DECLINED");
        verify(taskApplicationDao).updateStatus("app1", "DECLINED");
        verify(taskDao).updateStatus(eq("t1"), eq("OPEN"), any(Instant.class));
        verify(bookingIntentDao).markDeclined(eq("i1"), any(Instant.class));
    }
}
