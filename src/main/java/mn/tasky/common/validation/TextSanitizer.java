package mn.tasky.common.validation;

import org.jsoup.Jsoup;

import java.util.regex.Pattern;

public final class TextSanitizer {

    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private TextSanitizer() {
    }

    public static String plainText(String value) {
        if (value == null) {
            return null;
        }
        String withoutTags = Jsoup.parse(value)
                .text()
                .replace("<",
                         "")
                .replace(">",
                         "");
        return MULTI_SPACE_PATTERN.matcher(withoutTags)
                .replaceAll(" ")
                .trim();
    }
}
