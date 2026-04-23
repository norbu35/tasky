package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("LoggingSmsService")
class LoggingSmsServiceTest {

    private LoggingSmsService service;

    @BeforeEach
    void setUp() {
        service = new LoggingSmsService();
    }

    @Test
    @DisplayName("isProductionReady returns false")
    void isProductionReadyReturnsFalse() {
        assertThat(service.isProductionReady()).isFalse();
    }

    @Test
    @DisplayName("sendOtp stores the code and it is retrievable")
    void sendOtpStoresCode() {
        service.sendOtp("99112233", "123456");

        assertThat(service.latestOtpForPhone("99112233")).contains("123456");
    }

    @Test
    @DisplayName("latestOtpForPhone returns empty when no OTP sent")
    void latestOtpForPhoneReturnsEmptyWhenNone() {
        assertThat(service.latestOtpForPhone("99112233")).isEmpty();
    }

    @Test
    @DisplayName("sendOtp overwrites previous code for same phone")
    void sendOtpOverwritesPreviousCode() {
        service.sendOtp("99112233", "111111");
        service.sendOtp("99112233", "222222");

        assertThat(service.latestOtpForPhone("99112233")).contains("222222");
    }

    @Test
    @DisplayName("sendOtp tracks phones independently")
    void sendOtpTracksPhonesIndependently() {
        service.sendOtp("99112233", "111111");
        service.sendOtp("99887766", "222222");

        assertThat(service.latestOtpForPhone("99112233")).contains("111111");
        assertThat(service.latestOtpForPhone("99887766")).contains("222222");
    }

    @Test
    @DisplayName("sendOtp handles short phone number")
    void sendOtpHandlesShortPhone() {
        service.sendOtp("123", "654321");

        assertThat(service.latestOtpForPhone("123")).contains("654321");
    }
}
