package mn.tasky.auth.application;

/**
 * Contract for OTP SMS providers.
 */
public interface SmsService {

    /**
     * Sends one OTP to a phone number.
     *
     * @param phone Normalized destination phone number.
     * @param code  OTP code.
     */
    void sendOtp(String phone,
                 String code);

    /**
     * Indicates whether this provider is suitable for production.
     *
     * @return {@code true} when provider is production-ready.
     */
    boolean isProductionReady();
}
