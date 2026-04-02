package mn.tasky.messaging.application;

import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Advisory-only detector for Mongolian phone numbers in message content.
 * Checks for international format, 8-digit local numbers, and common obfuscations.
 * Detection does not block delivery; it only sets a flag for admin review.
 */
@Component
public class PhoneLeakDetector {

    // +97699001122 or 97699001122 — Mongolian international prefix with optional space separators
    private static final Pattern MONGOLIAN_INTERNATIONAL = Pattern.compile("\\+?976\\s?\\d{4}\\s?\\d{4}");

    // 8-digit local number (99001122) — word boundaries prevent matching longer digit strings
    private static final Pattern LOCAL_EIGHT_DIGIT = Pattern.compile("\\b\\d{8}\\b");

    // Spelled-out "nine seven six" with optional whitespace between words
    private static final Pattern SPELLED_OUT = Pattern.compile("(?i)nine\\s*seven\\s*six");

    /**
     * Returns true if the given content contains any Mongolian phone number pattern.
     *
     * @param content The message text to inspect.
     * @return true if a phone number pattern is detected, false otherwise.
     */
    public boolean containsPhoneNumber(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }
        return MONGOLIAN_INTERNATIONAL.matcher(content).find()
                || LOCAL_EIGHT_DIGIT.matcher(content).find()
                || SPELLED_OUT.matcher(content).find();
    }
}
