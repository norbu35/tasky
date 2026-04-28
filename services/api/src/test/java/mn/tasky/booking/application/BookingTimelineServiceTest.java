package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingTimelineServiceTest {

    @Mock
    private BookingTimelineEventDao dao;

    private BookingTimelineService service;

    @BeforeEach
    void setUp() {
        service = new BookingTimelineService(dao);
    }

    @Test
    void recordEvent_delegates() {
        service.recordEvent("b1", BookingTimelineService.BOOKING_CANCELLED, "u1", null);
        verify(dao).insert(anyString(), eq("b1"), eq("BOOKING_CANCELLED"), eq("u1"), eq(null));
    }

    @Test
    void getEvents_delegates() {
        when(dao.findByBookingId("b1")).thenReturn(List.of());
        assertThat(service.getEvents("b1")).isEmpty();
    }
}
