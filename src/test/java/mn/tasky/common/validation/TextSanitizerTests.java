package mn.tasky.common.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TextSanitizerTests {

    @Test
    void plainTextRemovesHtmlTagsAndNormalizesWhitespace() {
        String sanitized = TextSanitizer.plainText("<b>Hello</b>   <i>world</i>");

        assertThat(sanitized).isEqualTo("Hello world");
    }

    @Test
    void plainTextHandlesMalformedHtmlWithoutLeavingTags() {
        String sanitized = TextSanitizer.plainText("<scr<script>ipt>alert(1)</scri<</script>pt>");

        assertThat(sanitized).doesNotContain("<").doesNotContain(">");
    }
}
