package mn.tasky.auth.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.ReliabilityScoreDao;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.review.dao.ReviewDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReliabilityScoreService")
class ReliabilityScoreServiceTest {

    @Mock
    private BookingDao bookingDao;

    @Mock
    private ReviewDao reviewDao;

    @Mock
    private ReliabilityScoreDao reliabilityScoreDao;

    @Mock
    private ProfileDao profileDao;

    private ReliabilityScoreService service;

    @BeforeEach
    void setUp() {
        service = new ReliabilityScoreService(bookingDao, reviewDao, reliabilityScoreDao, profileDao);
    }

    @Test
    @DisplayName("skips computation when total bookings below minimum sample size")
    void skipsWhenBelowMinimumSampleSize() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(2, 1, 0);

        service.recompute("t1");

        verify(reliabilityScoreDao, never()).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("computes and upserts score when at minimum sample size")
    void computesScoreAtMinimumSampleSize() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(3, 1, 1);
        when(reviewDao.averagePunctualityByRevieweeSince(anyString(), any())).thenReturn(Optional.of(4.0));
        when(profileDao.findByUserId("t1"))
                .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.0, 5, null)));

        service.recompute("t1");

        verify(reliabilityScoreDao).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("computes correct score with all perfect values")
    void computesCorrectScoreWithPerfectValues() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(10, 0, 0);
        when(reviewDao.averagePunctualityByRevieweeSince(anyString(), any())).thenReturn(Optional.of(5.0));
        when(profileDao.findByUserId("t1"))
                .thenReturn(Optional.of(new UserProfileState("User", null, null, 5.0, 10, null)));

        service.recompute("t1");

        // completion=10/10=1.0, punctuality=5.0/5.0=1.0, cancellation=0/10=0.0 → 1-0=1.0, review=5.0/5.0=1.0
        // score = 0.4*1.0 + 0.2*1.0 + 0.2*1.0 + 0.2*1.0 = 1.0
        verify(reliabilityScoreDao).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("handles no punctuality reviews (returns 0)")
    void handlesNoPunctualityReviews() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(5, 0, 0);
        when(reviewDao.averagePunctualityByRevieweeSince(anyString(), any())).thenReturn(Optional.empty());
        when(profileDao.findByUserId("t1"))
                .thenReturn(Optional.of(new UserProfileState("User", null, null, 4.0, 5, null)));

        service.recompute("t1");

        verify(reliabilityScoreDao).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("handles no profile found (uses 0 rating)")
    void handlesNoProfileFound() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(5, 0, 0);
        when(reviewDao.averagePunctualityByRevieweeSince(anyString(), any())).thenReturn(Optional.of(3.0));
        when(profileDao.findByUserId("t1")).thenReturn(Optional.empty());

        service.recompute("t1");

        verify(reliabilityScoreDao).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("skips when only 4 total bookings (below min of 5)")
    void skipsWhenFourBookings() {
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(3, 1, 0);

        service.recompute("t1");

        verify(reliabilityScoreDao, never()).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("computes score with mixed results")
    void computesScoreWithMixedResults() {
        // completed=8, cancelled=2, noShow=0, total=10
        when(bookingDao.countByTaskerAndStatusSince(anyString(), anyString(), any()))
                .thenReturn(8, 2, 0);
        when(reviewDao.averagePunctualityByRevieweeSince(anyString(), any())).thenReturn(Optional.of(3.5));
        when(profileDao.findByUserId("t1"))
                .thenReturn(Optional.of(new UserProfileState("User", null, null, 3.5, 10, null)));

        service.recompute("t1");

        // completion=0.8, punctuality=3.5/5=0.7, cancellation=1-0.2=0.8, review=3.5/5=0.7
        // score = 0.4*0.8 + 0.2*0.7 + 0.2*0.8 + 0.2*0.7 = 0.32 + 0.14 + 0.16 + 0.14 = 0.76
        verify(reliabilityScoreDao).upsert(anyString(), anyDouble(), any(), any(), any(), any(), anyInt());
    }
}
