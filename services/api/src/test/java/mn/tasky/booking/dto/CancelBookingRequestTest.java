package mn.tasky.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CancelBookingRequestTest {

    @Test
    void storesProvidedReason() {
        CancelBookingRequest request = new CancelBookingRequest("[SAFETY_FRAUD] suspicious behavior");

        assertThat(request.reason()).isEqualTo("[SAFETY_FRAUD] suspicious behavior");
    }

    @Test
    void allowsNullReason() {
        CancelBookingRequest request = new CancelBookingRequest(null);

        assertThat(request.reason()).isNull();
    }
}
