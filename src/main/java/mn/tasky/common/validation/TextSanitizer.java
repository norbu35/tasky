package mn.tasky.common.validation;

import java.util.regex.Pattern;

public final class TextSanitizer {

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private TextSanitizer() {
    }

    public static String plainText(String value) {
        if (value == null) {
            return null;
        }
        String withoutTags = HTML_TAG_PATTERN.matcher(value)
                .replaceAll("");
        return MULTI_SPACE_PATTERN.matcher(withoutTags)
                .replaceAll(" ")
                .trim();
    }
}
