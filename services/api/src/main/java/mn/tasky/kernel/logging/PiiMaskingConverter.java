package mn.tasky.kernel.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import java.util.List;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;

/**
 * Logback message converter that masks common PII patterns in log output.
 * Registered in logback-spring.xml for the prod profile only.
 */
public class PiiMaskingConverter extends MessageConverter {

    private static final List<Pattern> PATTERNS = List.of(
            // Email addresses
            Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"),
            // Phone numbers (E.164 or common formats: +976XXXXXXXX, (XXX) XXX-XXXX)
            Pattern.compile("\\+?\\d{1,4}[-.\\s]?\\(?\\d{2,4}\\)?[-.\\s]?\\d{3,4}[-.\\s]?\\d{3,4}"),
            // Bearer tokens / JWT fragments
            Pattern.compile("(Bearer\\s+)[A-Za-z0-9\\-._~+/]+=*"),
            // Token/secret values after key markers
            Pattern.compile("(?<=token[=:\"\\s])[A-Za-z0-9\\-._~+/]+=*"),
            Pattern.compile("(?<=secret[=:\"\\s])[A-Za-z0-9\\-._~+/]+=*"));

    @Override
    public String convert(ILoggingEvent event) {
        String message = event.getFormattedMessage();
        if (message == null) {
            return null;
        }
        for (Pattern pattern : PATTERNS) {
            message = pattern.matcher(message).replaceAll(PiiMaskingConverter::mask);
        }
        return message;
    }

    @SuppressWarnings("PMD.UnusedFormalParameter")
    private static String mask(MatchResult mr) {
        return "***";
    }
}
