package mn.tasky.auth.application;

public interface SmsService {

    void sendOtp(String phone,
                 String code);

    boolean isProductionReady();
}
