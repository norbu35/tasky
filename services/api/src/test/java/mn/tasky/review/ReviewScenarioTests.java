package mn.tasky.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import mn.tasky.review.dto.ReviewEnforcementCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for review enforcement scenarios SCN-REVIEW-001 through SCN-REVIEW-006.
 */
class ReviewScenarioTests {

    private static final String BOOKING_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = "customer-1";
    private static final String TASKER_ID = "tasker-1";

    private ReviewEnforcementCaseDao caseDao;
    private NotificationService notificationService;
    private DisputeDao disputeDao; // NOPMD SingularField
    private ReviewEnforcementService service;

    @BeforeEach
    void setUp() {
        caseDao = mock(ReviewEnforcementCaseDao.class);
        notificationService = mock(NotificationService.class);
        disputeDao = mock(DisputeDao.class);
        service = new ReviewEnforcementService(caseDao, notificationService, disputeDao);

        when(disputeDao.existsOpenForUser(anyString())).thenReturn(false);
        when(caseDao.countConsecutiveExpired(anyString())).thenReturn(0);
        when(caseDao.hasInvestigationActive(anyString())).thenReturn(false);
        when(caseDao.findOpenByUser(anyString())).thenReturn(List.of());
    }

    private ReviewEnforcementCase openCase(String userId) {
        return new ReviewEnforcementCase(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                userId,
                "BOOKING_COMPLETED",
                "PENDING",
                false,
                Instant.now(),
                null);
    }

    // ── SCN-REVIEW-001 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-001: Booking completion creates structured review prompts for both customer and tasker")
    void bookingCompletionCreatesCasesForBothParticipants() {
        service.createCasesForBooking(BOOKING_ID, CUSTOMER_ID, TASKER_ID);

        // Two enforcement cases inserted: one per participant
        verify(caseDao).insert(anyString(), eq(BOOKING_ID), eq(CUSTOMER_ID), anyString());
        verify(caseDao).insert(anyString(), eq(BOOKING_ID), eq(TASKER_ID), anyString());
    }

    // ── SCN-REVIEW-002 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-002: Immediate review prompt is sent at completion time")
    void immediateReviewPromptSentOnCompletion() {
        service.createCasesForBooking(BOOKING_ID, CUSTOMER_ID, TASKER_ID);

        // Notifications are now sent via sendPushWithEventKey for dedup on retry
        verify(notificationService)
                .sendPushWithEventKey(eq(CUSTOMER_ID), anyString(), anyString(), eq("REVIEW_PROMPT"), anyString());
        verify(notificationService)
                .sendPushWithEventKey(eq(TASKER_ID), anyString(), anyString(), eq("REVIEW_PROMPT"), anyString());
    }

    // ── SCN-REVIEW-003 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-003: Open review case at 24 hours sends the first reminder")
    void pendingCaseOlderThan24hGetsFirstReminder() {
        ReviewEnforcementCase pending = openCase(CUSTOMER_ID);
        when(caseDao.findPendingOlderThan(any())).thenReturn(List.of(pending));
        when(caseDao.findReminded24hOlderThan(any())).thenReturn(List.of());

        service.sendReminders();

        verify(caseDao).updateStatus(eq(pending.id()), eq("REMINDED_24H"), any());
        verify(notificationService).sendPush(eq(CUSTOMER_ID), anyString(), anyString(), eq("REVIEW_PROMPT"));
    }

    // ── SCN-REVIEW-004 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-004: Open review case at 72 hours sends the final reminder")
    void reminded24hCaseOlderThan72hGetsFinalReminder() {
        ReviewEnforcementCase reminded = new ReviewEnforcementCase(
                UUID.randomUUID().toString(),
                BOOKING_ID,
                TASKER_ID,
                "BOOKING_COMPLETED",
                "REMINDED_24H",
                false,
                Instant.now(),
                null);
        when(caseDao.findPendingOlderThan(any())).thenReturn(List.of());
        when(caseDao.findReminded24hOlderThan(any())).thenReturn(List.of(reminded));

        service.sendReminders();

        verify(caseDao).updateStatus(eq(reminded.id()), eq("REMINDED_72H"), any());
        verify(notificationService).sendPush(eq(TASKER_ID), anyString(), anyString(), eq("REVIEW_PROMPT"));
    }

    // ── SCN-REVIEW-005 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-005: Hard lock is enforced when any open review enforcement case exists")
    void hardLockAppliedWithAnyOpenCase() {
        when(caseDao.findOpenByUser(CUSTOMER_ID)).thenReturn(List.of(openCase(CUSTOMER_ID)));

        boolean locked = service.isUserLocked(CUSTOMER_ID);

        assertThat(locked).isTrue();
    }

    // ── SCN-REVIEW-006 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-REVIEW-006: Hard lock is lifted when the owed review is submitted and the case is resolved")
    void noHardLockWhenNoOpenCases() {
        when(caseDao.findOpenByUser(CUSTOMER_ID)).thenReturn(List.of());

        boolean locked = service.isUserLocked(CUSTOMER_ID);

        assertThat(locked).isFalse();
    }
}
