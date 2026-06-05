package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("BookingIntentCreationOutcome")
class BookingIntentCreationOutcomeTest {

    @Test
    @DisplayName("inProgress creates an IN_PROGRESS status outcome")
    void inProgressOutcome() {
        BookingIntentCreationOutcome outcome = BookingIntentCreationOutcome.inProgress();
        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.IN_PROGRESS);
        assertThat(outcome.body()).isNull();
        assertThat(outcome.errorCode()).isNull();
        assertThat(outcome.errorMessage()).isNull();
    }

    @Test
    @DisplayName("replayMissing creates a REPLAY_MISSING status outcome")
    void replayMissingOutcome() {
        BookingIntentCreationOutcome outcome = BookingIntentCreationOutcome.replayMissing();
        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.REPLAY_MISSING);
        assertThat(outcome.body()).isNull();
        assertThat(outcome.errorCode()).isNull();
        assertThat(outcome.errorMessage()).isNull();
    }

    @Test
    @DisplayName("success creates a SUCCESS status outcome with body")
    void successOutcome() {
        Map<String, Object> mockBody = Map.of("intentId", "12345");
        BookingIntentCreationOutcome outcome = BookingIntentCreationOutcome.success(mockBody);
        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.SUCCESS);
        assertThat(outcome.body()).isEqualTo(mockBody);
        assertThat(outcome.errorCode()).isNull();
        assertThat(outcome.errorMessage()).isNull();
    }

    @Test
    @DisplayName("failure creates a failure status outcome with error details")
    void failureOutcome() {
        BookingIntentCreationOutcome outcome = BookingIntentCreationOutcome.failure(
                BookingIntentCreationOutcome.Status.NOT_FOUND, "ERR_404", "Not found");
        assertThat(outcome.status()).isEqualTo(BookingIntentCreationOutcome.Status.NOT_FOUND);
        assertThat(outcome.body()).isNull();
        assertThat(outcome.errorCode()).isEqualTo("ERR_404");
        assertThat(outcome.errorMessage()).isEqualTo("Not found");
    }
}
