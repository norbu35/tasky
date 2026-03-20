package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.ReliabilityScoreDao;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.review.dao.ReviewDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ReliabilityScoreTests {

    private BookingDao bookingDao;
    private ReviewDao reviewDao;
    private ReliabilityScoreDao reliabilityScoreDao;
    private ProfileDao profileDao;
    private ReliabilityScoreService service;

    private static final String TASKER_ID = "00000000-0000-0000-0000-000000000001";

    @BeforeEach
    void setUp() {
        bookingDao = mock(BookingDao.class);
        reviewDao = mock(ReviewDao.class);
        reliabilityScoreDao = mock(ReliabilityScoreDao.class);
        profileDao = mock(ProfileDao.class);
        service = new ReliabilityScoreService(bookingDao, reviewDao, reliabilityScoreDao, profileDao);
    }

    @Test
    @DisplayName("Cold-start guard: fewer than 5 bookings skips computation")
    void coldStartGuardSkipsComputation() {
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("COMPLETED"), any(Instant.class)))
                .thenReturn(2);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("CANCELLED"), any(Instant.class)))
                .thenReturn(1);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("NO_SHOW"), any(Instant.class)))
                .thenReturn(1);

        service.recompute(TASKER_ID);

        verify(reliabilityScoreDao, never()).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Score formula with known inputs produces expected weighted result")
    void scoreFormulaWithKnownInputs() {
        // 8 completed, 1 cancelled, 1 no-show = 10 total
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("COMPLETED"), any(Instant.class)))
                .thenReturn(8);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("CANCELLED"), any(Instant.class)))
                .thenReturn(1);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("NO_SHOW"), any(Instant.class)))
                .thenReturn(1);

        // Average punctuality rating: 4.0 out of 5
        when(reviewDao.averagePunctualityByRevieweeSince(eq(TASKER_ID), any(Instant.class)))
                .thenReturn(Optional.of(4.0));

        // Profile rating_avg = 4.5
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test User", null, 4.5, 20)));

        service.recompute(TASKER_ID);

        // completion_rate = 8/10 = 0.8
        // punctuality_rate = 4.0/5.0 = 0.8
        // cancellation_rate = 1.0 - (1/10) = 0.9
        // review_avg = 4.5/5.0 = 0.9
        // score = 0.4*0.8 + 0.2*0.8 + 0.2*0.9 + 0.2*0.9
        //       = 0.32 + 0.16 + 0.18 + 0.18 = 0.84
        ArgumentCaptor<Double> scoreCaptor = ArgumentCaptor.forClass(Double.class);
        verify(reliabilityScoreDao).upsert(eq(TASKER_ID), scoreCaptor.capture(), any(), any(), any(), any(), eq(90));

        assertThat(scoreCaptor.getValue()).isCloseTo(0.84, within(0.001));
    }

    @Test
    @DisplayName("Exactly 5 bookings triggers computation (boundary)")
    void exactlyFiveBookingsTriggersComputation() {
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("COMPLETED"), any(Instant.class)))
                .thenReturn(5);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("CANCELLED"), any(Instant.class)))
                .thenReturn(0);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("NO_SHOW"), any(Instant.class)))
                .thenReturn(0);
        when(reviewDao.averagePunctualityByRevieweeSince(eq(TASKER_ID), any(Instant.class)))
                .thenReturn(Optional.empty());
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test User", null, 5.0, 10)));

        service.recompute(TASKER_ID);

        // Should upsert since total == 5 (not < 5)
        verify(reliabilityScoreDao).upsert(eq(TASKER_ID), anyDouble(), any(), any(), any(), any(), eq(90));
    }

    @Test
    @DisplayName("Missing punctuality reviews default to zero")
    void missingPunctualityDefaultsToZero() {
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("COMPLETED"), any(Instant.class)))
                .thenReturn(10);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("CANCELLED"), any(Instant.class)))
                .thenReturn(0);
        when(bookingDao.countByTaskerAndStatusSince(eq(TASKER_ID), eq("NO_SHOW"), any(Instant.class)))
                .thenReturn(0);
        when(reviewDao.averagePunctualityByRevieweeSince(eq(TASKER_ID), any(Instant.class)))
                .thenReturn(Optional.empty());
        when(profileDao.findByUserId(TASKER_ID))
                .thenReturn(Optional.of(new UserProfileState("Test User", null, 0.0, 10)));

        service.recompute(TASKER_ID);

        // completion_rate = 1.0, punctuality = 0.0, cancellation = 1.0, review = 0.0
        // score = 0.4*1.0 + 0.2*0.0 + 0.2*1.0 + 0.2*0.0 = 0.6
        ArgumentCaptor<Double> scoreCaptor = ArgumentCaptor.forClass(Double.class);
        verify(reliabilityScoreDao).upsert(eq(TASKER_ID), scoreCaptor.capture(), any(), any(), any(), any(), eq(90));

        assertThat(scoreCaptor.getValue()).isCloseTo(0.6, within(0.001));
    }
}
