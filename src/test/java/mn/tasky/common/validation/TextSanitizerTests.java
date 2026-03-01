package mn.tasky.common.validation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TextSanitizerTests {

    @Test
    void plainTextRemovesHtmlTagsAndNormalizesWhitespace() {
        String sanitized = TextSanitizer.plainText("<b>Hello</b>   <i>world</i>");

        assertThat(sanitized).isEqualTo("Hello world");
    }

    @Test
    void plainTextHandlesMalformedHtmlWithoutLeavingTags() {
        String sanitized = TextSanitizer.plainText("<scr<script>ipt>alert(1)</scri<</script>pt>");

        assertThat(sanitized).doesNotContain("<")
            .doesNotContain(">");
    }
}
