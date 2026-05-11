package mn.tasky.common.i18n;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.Locale;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

@ExtendWith(MockitoExtension.class)
class BackendMessageResolverTest {

    @Mock
    private MessageSource messageSource;

    private BackendMessageResolver resolver;

    private static final Locale DEFAULT_LOCALE = Locale.forLanguageTag("mn");

    @BeforeEach
    void setUp() {
        resolver = new BackendMessageResolver(messageSource);
    }

    @AfterEach
    void resetLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void messageUsesLocaleContextHolderLocale() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        given(messageSource.getMessage("key", new Object[0], "fallback", Locale.ENGLISH))
                .willReturn("resolved");

        assertThat(resolver.message("key", "fallback")).isEqualTo("resolved");
    }

    @Test
    void messagePassesArgsToMessageSource() {
        LocaleContextHolder.setLocale(DEFAULT_LOCALE);
        Object[] args = {"World"};
        given(messageSource.getMessage("greet", args, "hi", DEFAULT_LOCALE)).willReturn("Hello World");

        assertThat(resolver.message("greet", "hi", "World")).isEqualTo("Hello World");
    }

    @Test
    void messageForLocaleResolvesTag() {
        Locale en = Locale.forLanguageTag("en");
        given(messageSource.getMessage("k", new Object[0], "def", en)).willReturn("ok");

        assertThat(resolver.messageForLocale("en", "k", "def")).isEqualTo("ok");
    }

    @Test
    void messageForLocaleFallsBackForBlankTag() {
        given(messageSource.getMessage("k", new Object[0], "def", DEFAULT_LOCALE))
                .willReturn("mn-val");

        assertThat(resolver.messageForLocale("", "k", "def")).isEqualTo("mn-val");
    }

    @Test
    void messageForLocaleFallsBackForNullTag() {
        given(messageSource.getMessage("k", new Object[0], "def", DEFAULT_LOCALE))
                .willReturn("mn-val");

        assertThat(resolver.messageForLocale(null, "k", "def")).isEqualTo("mn-val");
    }

    @Test
    void errorMessagePrefixesErrorCode() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        given(messageSource.getMessage("error.not_found", new Object[0], "Not found", Locale.ENGLISH))
                .willReturn("Item not found");

        assertThat(resolver.errorMessage("not_found", "Not found")).isEqualTo("Item not found");
    }
}
