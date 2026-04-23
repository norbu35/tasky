package mn.tasky.review.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import mn.tasky.review.dto.ReviewEnforcementCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewEnforcementServiceTest {

    @Mock
    private ReviewEnforcementCaseDao reviewEnforcementCaseDao;

    @Mock
    private NotificationService notificationService;

    @Mock
    private DisputeDao disputeDao;

    private ReviewEnforcementService service;

    @BeforeEach
    void setUp() {
        service = new ReviewEnforcementService(reviewEnforcementCaseDao, notificationService, disputeDao);
    }

    private ReviewEnforcementCase makeCase(String id, String bookingId, String userId, String status) {
        return new ReviewEnforcementCase(
                id, bookingId, userId, "BOOKING_COMPLETED", status, false, Instant.now(), null);
    }

    @Test
    void createCasesForBooking_createsBothCases_whenNoneExist() {
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "c1")).thenReturn(Optional.empty());
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "t1")).thenReturn(Optional.empty());

        service.createCasesForBooking("b1", "c1", "t1");

        verify(reviewEnforcementCaseDao).insert(anyString(), eq("b1"), eq("c1"), eq("BOOKING_COMPLETED"));
        verify(reviewEnforcementCaseDao).insert(anyString(), eq("b1"), eq("t1"), eq("BOOKING_COMPLETED"));
    }

    @Test
    void createCasesForBooking_sendsNotifications() {
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "c1")).thenReturn(Optional.empty());
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "t1")).thenReturn(Optional.empty());

        service.createCasesForBooking("b1", "c1", "t1");

        verify(notificationService)
                .sendPushWithEventKey(
                        eq("c1"),
                        eq("Review Your Booking"),
                        eq("Please review your recent booking."),
                        eq("REVIEW_PROMPT"),
                        eq("REVIEW_PROMPT_b1_customer"));
        verify(notificationService)
                .sendPushWithEventKey(
                        eq("t1"),
                        eq("Review Your Booking"),
                        eq("Please review your recent booking."),
                        eq("REVIEW_PROMPT"),
                        eq("REVIEW_PROMPT_b1_tasker"));
    }

    @Test
    void createCasesForBooking_skipsExistingCase_forCustomer() {
        ReviewEnforcementCase existing = makeCase("case1", "b1", "c1", "PENDING");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "c1")).thenReturn(Optional.of(existing));
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "t1")).thenReturn(Optional.empty());

        service.createCasesForBooking("b1", "c1", "t1");

        verify(reviewEnforcementCaseDao, never()).insert(anyString(), eq("b1"), eq("c1"), anyString());
        verify(reviewEnforcementCaseDao).insert(anyString(), eq("b1"), eq("t1"), eq("BOOKING_COMPLETED"));
    }

    @Test
    void createCasesForBooking_skipsExistingCase_forTasker() {
        ReviewEnforcementCase existing = makeCase("case2", "b1", "t1", "PENDING");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "c1")).thenReturn(Optional.empty());
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "t1")).thenReturn(Optional.of(existing));

        service.createCasesForBooking("b1", "c1", "t1");

        verify(reviewEnforcementCaseDao).insert(anyString(), eq("b1"), eq("c1"), eq("BOOKING_COMPLETED"));
        verify(reviewEnforcementCaseDao, never()).insert(anyString(), eq("b1"), eq("t1"), anyString());
    }

    @Test
    void createCasesForBooking_idempotent_whenBothCasesAlreadyExist() {
        ReviewEnforcementCase existingCustomer = makeCase("c1", "b1", "cust", "PENDING");
        ReviewEnforcementCase existingTasker = makeCase("c2", "b1", "task", "PENDING");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "cust")).thenReturn(Optional.of(existingCustomer));
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "task")).thenReturn(Optional.of(existingTasker));

        service.createCasesForBooking("b1", "cust", "task");

        verify(reviewEnforcementCaseDao, never()).insert(anyString(), anyString(), anyString(), anyString());
        verify(notificationService)
                .sendPushWithEventKey(eq("cust"), anyString(), anyString(), anyString(), anyString());
        verify(notificationService)
                .sendPushWithEventKey(eq("task"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void resolveCase_updatesToCompleted_whenCaseIsPending() {
        ReviewEnforcementCase pendingCase = makeCase("case1", "b1", "u1", "PENDING");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "u1")).thenReturn(Optional.of(pendingCase));

        service.resolveCase("b1", "u1");

        verify(reviewEnforcementCaseDao).updateStatus(eq("case1"), eq("COMPLETED"), any(Instant.class));
    }

    @Test
    void resolveCase_skipsUpdate_whenAlreadyCompleted() {
        ReviewEnforcementCase completedCase = makeCase("case1", "b1", "u1", "COMPLETED");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "u1")).thenReturn(Optional.of(completedCase));

        service.resolveCase("b1", "u1");

        verify(reviewEnforcementCaseDao, never()).updateStatus(anyString(), anyString(), any(Instant.class));
    }

    @Test
    void resolveCase_doesNothing_whenNoCaseFound() {
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "u1")).thenReturn(Optional.empty());

        service.resolveCase("b1", "u1");

        verify(reviewEnforcementCaseDao, never()).updateStatus(anyString(), anyString(), any(Instant.class));
    }

    @Test
    void resolveCase_updatesReminded24hCase() {
        ReviewEnforcementCase remindedCase = makeCase("case1", "b1", "u1", "REMINDED_24H");
        when(reviewEnforcementCaseDao.findByBookingAndUser("b1", "u1")).thenReturn(Optional.of(remindedCase));

        service.resolveCase("b1", "u1");

        verify(reviewEnforcementCaseDao).updateStatus(eq("case1"), eq("COMPLETED"), any(Instant.class));
    }

    @Test
    void isUserLocked_returnsTrue_whenOpenCasesExist() {
        when(reviewEnforcementCaseDao.findOpenByUser("u1")).thenReturn(List.of(makeCase("c1", "b1", "u1", "PENDING")));

        assertThat(service.isUserLocked("u1")).isTrue();
    }

    @Test
    void isUserLocked_returnsFalse_whenNoOpenCases() {
        when(reviewEnforcementCaseDao.findOpenByUser("u1")).thenReturn(Collections.emptyList());

        assertThat(service.isUserLocked("u1")).isFalse();
    }

    @Test
    void isUserLocked_returnsTrue_withMultipleOpenCases() {
        when(reviewEnforcementCaseDao.findOpenByUser("u1"))
                .thenReturn(List.of(makeCase("c1", "b1", "u1", "PENDING"), makeCase("c2", "b2", "u1", "REMINDED_24H")));

        assertThat(service.isUserLocked("u1")).isTrue();
    }

    @Test
    void sendReminders_sends24hReminder_forPendingCases() {
        ReviewEnforcementCase pendingCase = makeCase("c1", "b1", "u1", "PENDING");
        when(reviewEnforcementCaseDao.findPendingOlderThan(any(Instant.class))).thenReturn(List.of(pendingCase));
        when(reviewEnforcementCaseDao.findReminded24hOlderThan(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        service.sendReminders();

        verify(reviewEnforcementCaseDao).updateStatus(eq("c1"), eq("REMINDED_24H"), isNull());
        verify(notificationService)
                .sendPush(
                        eq("u1"),
                        eq("Review Reminder"),
                        eq("You haven't reviewed your recent booking yet. Please leave a review."),
                        eq("REVIEW_PROMPT"));
    }

    @Test
    void sendReminders_sends72hReminder_forReminded24hCases() {
        ReviewEnforcementCase remindedCase = makeCase("c2", "b2", "u2", "REMINDED_24H");
        when(reviewEnforcementCaseDao.findPendingOlderThan(any(Instant.class))).thenReturn(Collections.emptyList());
        when(reviewEnforcementCaseDao.findReminded24hOlderThan(any(Instant.class)))
                .thenReturn(List.of(remindedCase));

        service.sendReminders();

        verify(reviewEnforcementCaseDao).updateStatus(eq("c2"), eq("REMINDED_72H"), isNull());
        verify(notificationService)
                .sendPush(
                        eq("u2"),
                        eq("Final Review Reminder"),
                        eq("This is your final reminder to review your recent booking."),
                        eq("REVIEW_PROMPT"));
    }

    @Test
    void sendReminders_handlesBoth24hAnd72hSimultaneously() {
        ReviewEnforcementCase pendingCase = makeCase("c1", "b1", "u1", "PENDING");
        ReviewEnforcementCase remindedCase = makeCase("c2", "b2", "u2", "REMINDED_24H");
        when(reviewEnforcementCaseDao.findPendingOlderThan(any(Instant.class))).thenReturn(List.of(pendingCase));
        when(reviewEnforcementCaseDao.findReminded24hOlderThan(any(Instant.class)))
                .thenReturn(List.of(remindedCase));

        service.sendReminders();

        verify(reviewEnforcementCaseDao).updateStatus("c1", "REMINDED_24H", null);
        verify(reviewEnforcementCaseDao).updateStatus("c2", "REMINDED_72H", null);
        verify(notificationService).sendPush(eq("u1"), eq("Review Reminder"), anyString(), eq("REVIEW_PROMPT"));
        verify(notificationService).sendPush(eq("u2"), eq("Final Review Reminder"), anyString(), eq("REVIEW_PROMPT"));
    }

    @Test
    void sendReminders_noop_whenNoCasesToRemind() {
        when(reviewEnforcementCaseDao.findPendingOlderThan(any(Instant.class))).thenReturn(Collections.emptyList());
        when(reviewEnforcementCaseDao.findReminded24hOlderThan(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        service.sendReminders();

        verify(reviewEnforcementCaseDao, never()).updateStatus(anyString(), anyString(), any());
        verifyNoInteractions(notificationService);
    }

    @Test
    void sendReminders_sendsMultiple24hReminders() {
        ReviewEnforcementCase case1 = makeCase("c1", "b1", "u1", "PENDING");
        ReviewEnforcementCase case2 = makeCase("c2", "b2", "u2", "PENDING");
        when(reviewEnforcementCaseDao.findPendingOlderThan(any(Instant.class))).thenReturn(List.of(case1, case2));
        when(reviewEnforcementCaseDao.findReminded24hOlderThan(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        service.sendReminders();

        verify(reviewEnforcementCaseDao).updateStatus("c1", "REMINDED_24H", null);
        verify(reviewEnforcementCaseDao).updateStatus("c2", "REMINDED_24H", null);
        verify(notificationService).sendPush(eq("u1"), anyString(), anyString(), eq("REVIEW_PROMPT"));
        verify(notificationService).sendPush(eq("u2"), anyString(), anyString(), eq("REVIEW_PROMPT"));
    }

    @Test
    void getOpenCases_delegatesToDao() {
        List<ReviewEnforcementCase> expected =
                List.of(makeCase("c1", "b1", "u1", "PENDING"), makeCase("c2", "b2", "u1", "REMINDED_24H"));
        when(reviewEnforcementCaseDao.findOpenByUser("u1")).thenReturn(expected);

        List<ReviewEnforcementCase> result = service.getOpenCases("u1");

        assertThat(result).isEqualTo(expected);
        verify(reviewEnforcementCaseDao).findOpenByUser("u1");
    }

    @Test
    void getOpenCases_returnsEmpty_whenNoOpenCases() {
        when(reviewEnforcementCaseDao.findOpenByUser("u1")).thenReturn(Collections.emptyList());

        assertThat(service.getOpenCases("u1")).isEmpty();
    }

    @Test
    void expireOldCases_updatesExpirableCases() {
        ReviewEnforcementCase expirable = makeCase("c1", "b1", "u1", "REMINDED_72H");
        when(reviewEnforcementCaseDao.findExpirableOlderThan(any(Instant.class)))
                .thenReturn(List.of(expirable));

        service.expireOldCases();

        verify(reviewEnforcementCaseDao).updateStatus(eq("c1"), eq("EXPIRED"), isNull());
    }

    @Test
    void expireOldCases_handlesMultipleExpirableCases() {
        ReviewEnforcementCase case1 = makeCase("c1", "b1", "u1", "PENDING");
        ReviewEnforcementCase case2 = makeCase("c2", "b2", "u2", "REMINDED_24H");
        ReviewEnforcementCase case3 = makeCase("c3", "b3", "u3", "REMINDED_72H");
        when(reviewEnforcementCaseDao.findExpirableOlderThan(any(Instant.class)))
                .thenReturn(List.of(case1, case2, case3));

        service.expireOldCases();

        verify(reviewEnforcementCaseDao).updateStatus("c1", "EXPIRED", null);
        verify(reviewEnforcementCaseDao).updateStatus("c2", "EXPIRED", null);
        verify(reviewEnforcementCaseDao).updateStatus("c3", "EXPIRED", null);
    }

    @Test
    void expireOldCases_noop_whenNothingExpirable() {
        when(reviewEnforcementCaseDao.findExpirableOlderThan(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        service.expireOldCases();

        verify(reviewEnforcementCaseDao, never()).updateStatus(anyString(), anyString(), any());
    }
}
