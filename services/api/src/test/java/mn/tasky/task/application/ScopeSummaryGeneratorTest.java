package mn.tasky.task.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("ScopeSummaryGenerator")
class ScopeSummaryGeneratorTest {

    private ScopeSummaryGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new ScopeSummaryGenerator(new ObjectMapper());
    }

    @Nested
    @DisplayName("generate")
    class Generate {

        @Test
        @DisplayName("generates summary from schema and answers")
        void basicSummary() {
            String schema = "[{\"key\":\"rooms\",\"label\":\"Number of rooms\",\"type\":\"number\"}]";
            String answers = "{\"rooms\":3}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Number of rooms: 3");
            assertThat(result.source()).isEqualTo("TEMPLATE");
        }

        @Test
        @DisplayName("skips fields not present in answers")
        void missingFieldsSkipped() {
            String schema = "[{\"key\":\"rooms\",\"label\":\"Rooms\",\"type\":\"number\"},"
                    + "{\"key\":\"size\",\"label\":\"Size\",\"type\":\"text\"}]";
            String answers = "{\"rooms\":2}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Rooms: 2");
        }

        @Test
        @DisplayName("resolves option labels for single value")
        void optionLabels() {
            String schema = "[{\"key\":\"type\",\"label\":\"Job type\",\"type\":\"select\","
                    + "\"options\":[{\"value\":\"repair\",\"label\":\"Repair\"},"
                    + "{\"value\":\"install\",\"label\":\"Installation\"}]}]";
            String answers = "{\"type\":\"repair\"}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Job type: Repair");
        }

        @Test
        @DisplayName("resolves option labels for list values")
        void optionLabelsList() {
            String schema = "[{\"key\":\"services\",\"label\":\"Services\",\"type\":\"multiselect\","
                    + "\"options\":[{\"value\":\"clean\",\"label\":\"Cleaning\"},"
                    + "{\"value\":\"paint\",\"label\":\"Painting\"}]}]";
            String answers = "{\"services\":[\"clean\",\"paint\"]}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Services: Cleaning, Painting");
        }

        @Test
        @DisplayName("handles list values for non-option types")
        void listValuesNonOption() {
            String schema = "[{\"key\":\"items\",\"label\":\"Items\",\"type\":\"text\"}]";
            String answers = "{\"items\":[\"a\",\"b\",\"c\"]}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Items: a, b, c");
        }

        @Test
        @DisplayName("formats multiple fields in schema order")
        void multipleFields() {
            String schema = "[{\"key\":\"rooms\",\"label\":\"Rooms\",\"type\":\"number\"},"
                    + "{\"key\":\"urgency\",\"label\":\"Urgency\",\"type\":\"text\"}]";
            String answers = "{\"rooms\":3,\"urgency\":\"high\"}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Rooms: 3\nUrgency: high");
        }

        @Test
        @DisplayName("falls back to key-value format on invalid schema")
        void fallbackOnInvalidSchema() {
            String answers = "{\"rooms\":3,\"type\":\"repair\"}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate("not-json", answers);

            assertThat(result.source()).isEqualTo("TEMPLATE");
            assertThat(result.summary()).contains("rooms: 3");
            assertThat(result.summary()).contains("type: repair");
        }

        @Test
        @DisplayName("falls back to key-value format when schema is not array")
        void fallbackOnNonArraySchema() {
            String schema = "{\"key\":\"rooms\"}";
            String answers = "{\"rooms\":3}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.source()).isEqualTo("TEMPLATE");
            assertThat(result.summary()).contains("rooms: 3");
        }

        @Test
        @DisplayName("returns empty summary when both schema and answers are invalid")
        void bothInvalid() {
            ScopeSummaryGenerator.SummaryResult result = generator.generate("not-json", "also-not-json");

            assertThat(result.source()).isEqualTo("TEMPLATE");
            assertThat(result.summary()).isEmpty();
        }

        @Test
        @DisplayName("handles option array as JSON array in answers")
        void optionArrayInAnswersJson() {
            String schema = "[{\"key\":\"services\",\"label\":\"Services\",\"type\":\"multiselect\","
                    + "\"options\":[{\"value\":\"a\",\"label\":\"Alpha\"},{\"value\":\"b\",\"label\":\"Beta\"}]}]";
            String answers = "{\"services\":[\"a\",\"b\"]}";

            ScopeSummaryGenerator.SummaryResult result = generator.generate(schema, answers);

            assertThat(result.summary()).isEqualTo("Services: Alpha, Beta");
        }
    }
}
