package mn.tasky.common.i18n;

import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class BackendMessageResolver {

    private static final Locale DEFAULT_LOCALE = Locale.forLanguageTag("mn");

    private final MessageSource messageSource;

    public BackendMessageResolver(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String message(String key, String defaultMessage, Object... args) {
        return message(LocaleContextHolder.getLocale(), key, defaultMessage, args);
    }

    public String messageForLocale(String localeTag, String key, String defaultMessage, Object... args) {
        return message(localeFromTag(localeTag), key, defaultMessage, args);
    }

    public String errorMessage(String code, String defaultMessage) {
        return message("error." + code, defaultMessage);
    }

    private String message(Locale locale, String key, String defaultMessage, Object... args) {
        return messageSource.getMessage(key, args, defaultMessage, locale == null ? DEFAULT_LOCALE : locale);
    }

    private Locale localeFromTag(String localeTag) {
        if (!StringUtils.hasText(localeTag)) {
            return DEFAULT_LOCALE;
        }
        Locale locale = Locale.forLanguageTag(localeTag);
        return StringUtils.hasText(locale.getLanguage()) ? locale : DEFAULT_LOCALE;
    }
}
