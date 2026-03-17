package mn.tasky.messaging;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.messaging.application.PhoneLeakDetector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PhoneLeakDetectorTests {

    private PhoneLeakDetector detector;

    @BeforeEach
    void setUp() {
        detector = new PhoneLeakDetector();
    }

    @Test
    void detectsMongolianInternationalFormatWithPlus() {
        assertThat(detector.containsPhoneNumber("+97699001122")).isTrue();
    }

    @Test
    void detectsMongolianInternationalFormatWithoutPlus() {
        assertThat(detector.containsPhoneNumber("97699001122")).isTrue();
    }

    @Test
    void detectsEightDigitLocalNumber() {
        assertThat(detector.containsPhoneNumber("99001122")).isTrue();
    }

    @Test
    void detectsSpelledOutNineSevenSix() {
        assertThat(detector.containsPhoneNumber("nine seven six")).isTrue();
    }

    @Test
    void doesNotFlagShortNumber() {
        assertThat(detector.containsPhoneNumber("50000")).isFalse();
    }

    @Test
    void doesNotFlagSevenDigitNumber() {
        assertThat(detector.containsPhoneNumber("1234567")).isFalse();
    }

    @Test
    void doesNotFlagPlainText() {
        assertThat(detector.containsPhoneNumber("Hello world")).isFalse();
    }
}
