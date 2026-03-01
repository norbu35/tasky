package mn.tasky.common.validation;

import java.util.regex.Pattern;

import org.jsoup.Jsoup;

public final class TextSanitizer {

    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private TextSanitizer() {
    }

    public static String plainText(String value) {
        if (value == null) {
            return null;
        }
        String withoutTags = Jsoup.parse(value).text().replace("<", "").replace(">", "");
        return MULTI_SPACE_PATTERN.matcher(withoutTags).replaceAll(" ").trim();
    }
}
