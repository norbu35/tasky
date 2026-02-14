package mn.tasky.auth.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoggingSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsService.class);
    private final ConcurrentHashMap<String, String> latestOtpByPhone = new ConcurrentHashMap<>();

    @Override
    public void sendOtp(String phone, String code) {
        latestOtpByPhone.put(phone, code);
        String suffix = phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone;
        log.info("Sending OTP code to phone ending in {}", suffix);
        log.debug("OTP for {} is {}", phone, code);
    }

    public Optional<String> latestOtpForPhone(String phone) {
        return Optional.ofNullable(latestOtpByPhone.get(phone));
    }
}
