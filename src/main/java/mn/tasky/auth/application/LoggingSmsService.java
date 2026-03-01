package mn.tasky.auth.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Development SMS provider that logs OTP codes instead of sending real SMS.
 */
@Service
public class LoggingSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsService.class);
    private final ConcurrentHashMap<String, String> latestOtpByPhone = new ConcurrentHashMap<>();

    /**
     * Stores and logs OTP code instead of sending an actual SMS.
     *
     * @param phone Normalized destination phone number.
     * @param code  OTP code.
     */
    @Override
    public void sendOtp(String phone, String code) {
        latestOtpByPhone.put(phone, code);
        String suffix = phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone;
        log.info("Sending OTP code to phone ending in {}", suffix);
        log.debug("OTP for {} is {}", phone, code);
    }

    /**
     * Indicates that this development implementation is not production-ready.
     *
     * @return always {@code false}.
     */
    @Override
    public boolean isProductionReady() {
        return false;
    }

    /**
     * Returns the most recently generated OTP for a phone in this process.
     *
     * @param phone Normalized phone number.
     * @return Latest OTP code if present.
     */
    public Optional<String> latestOtpForPhone(String phone) {
        return Optional.ofNullable(latestOtpByPhone.get(phone));
    }
}
