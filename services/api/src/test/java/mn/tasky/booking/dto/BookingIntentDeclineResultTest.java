package mn.tasky.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class BookingIntentDeclineResultTest {

    private static final Instant NOW = Instant.parse("2026-04-28T00:00:00Z");

    @Test
    void successCarriesIntentAndClearsErrorFields() {
        BookingIntentState intent = intentState("DECLINED");

        BookingIntentDeclineResult result = BookingIntentDeclineResult.success(intent);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.intent()).isSameAs(intent);
        assertThat(result.errorCode()).isNull();
        assertThat(result.errorMessage()).isNull();
    }

    @Test
    void errorCarriesFailureDetailsAndClearsIntent() {
        BookingIntentDeclineResult result =
                BookingIntentDeclineResult.error(BookingIntentDeclineResult.CONFLICT, "Intent is no longer pending");

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.intent()).isNull();
        assertThat(result.errorCode()).isEqualTo(BookingIntentDeclineResult.CONFLICT);
        assertThat(result.errorMessage()).isEqualTo("Intent is no longer pending");
    }

    @Test
    void sameValuesAreEqual() {
        BookingIntentState intent = intentState("PENDING");

        BookingIntentDeclineResult first = BookingIntentDeclineResult.success(intent);
        BookingIntentDeclineResult second = BookingIntentDeclineResult.success(intent);

        assertThat(first).isEqualTo(second).hasSameHashCodeAs(second);
    }

    private static BookingIntentState intentState(String status) {
        return new BookingIntentState(
                "intent-1",
                "task-1",
                "tasker-1",
                "customer-1",
                "DIRECT",
                status,
                null,
                null,
                null,
                null,
                null,
                null,
                NOW,
                NOW);
    }
}
