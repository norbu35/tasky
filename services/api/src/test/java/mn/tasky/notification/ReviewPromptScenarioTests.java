package mn.tasky.notification;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for the review prompt notification scenario.
 * Covers: SCN-NOTIF-007.
 *
 * <p>Verifies that when a booking completes, both participants receive a REVIEW_PROMPT
 * notification with event-keyed dedup. No Spring context.
 */
class ReviewPromptScenarioTests {

    private static final String BOOKING_ID = "booking-42";
    private static final String CUSTOMER_ID = "customer-abc";
    private static final String TASKER_ID = "tasker-xyz";

    private ReviewEnforcementCaseDao reviewEnforcementCaseDao;
    private NotificationService notificationService;
    private ReviewEnforcementService reviewEnforcementService;

    @BeforeEach
    void setUp() {
        reviewEnforcementCaseDao = mock(ReviewEnforcementCaseDao.class);
        notificationService = mock(NotificationService.class);
        DisputeDao disputeDao = mock(DisputeDao.class);

        // Default: no existing enforcement cases (idempotency check passes)
        when(reviewEnforcementCaseDao.findByBookingAndUser(anyString(), anyString()))
                .thenReturn(Optional.empty());

        reviewEnforcementService =
                new ReviewEnforcementService(reviewEnforcementCaseDao, notificationService, disputeDao);
    }

    // ── SCN-NOTIF-007 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-007: Review obligation notification is sent to both participants")
    void completionPromptSendsReviewNotificationToBothParticipants() {
        // When a reviewable terminal outcome calls createCasesForBooking
        reviewEnforcementService.createCasesForBooking(BOOKING_ID, CUSTOMER_ID, TASKER_ID);

        // Then a REVIEW_PROMPT notification is sent to the customer with event-keyed dedup
        verify(notificationService)
                .sendPushWithEventKey(
                        eq(CUSTOMER_ID),
                        eq("Review Your Booking"),
                        eq("Please review your recent booking."),
                        eq("REVIEW_PROMPT"),
                        eq("REVIEW_PROMPT_" + BOOKING_ID + "_customer"));

        // And a REVIEW_PROMPT notification is sent to the tasker with event-keyed dedup
        verify(notificationService)
                .sendPushWithEventKey(
                        eq(TASKER_ID),
                        eq("Review Your Booking"),
                        eq("Please review your recent booking."),
                        eq("REVIEW_PROMPT"),
                        eq("REVIEW_PROMPT_" + BOOKING_ID + "_tasker"));

        // And enforcement cases are created for both participants
        verify(reviewEnforcementCaseDao).insert(anyString(), eq(BOOKING_ID), eq(CUSTOMER_ID), eq("BOOKING_COMPLETED"));
        verify(reviewEnforcementCaseDao).insert(anyString(), eq(BOOKING_ID), eq(TASKER_ID), eq("BOOKING_COMPLETED"));
    }
}
