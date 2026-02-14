package mn.tasky.auth.application;

public interface SmsService {

    void sendOtp(String phone, String code);

    default boolean isProductionReady() {
        return false;
    }
}
