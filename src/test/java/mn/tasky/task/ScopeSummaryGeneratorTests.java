package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.task.application.ScopeSummaryGenerator;
import mn.tasky.task.application.ScopeSummaryGenerator.SummaryResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ScopeSummaryGeneratorTests {

    private ScopeSummaryGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new ScopeSummaryGenerator(new ObjectMapper());
    }

    @Test
    @DisplayName("Valid schema + answers generates Label: Value summary lines in schema order")
    void validSchemaAndAnswers() {
        String schema =
                """
            [
              {"key":"location","label":"Location","type":"dropdown","required":true,"options":["UB","Darkhan"]},
              {"key":"size","label":"Size","type":"single_select","required":true,"options":["Small","Large"]},
              {"key":"urgent","label":"Urgent?","type":"yes_no","required":false}
            ]
            """;
        String answers = """
            {"location":"UB","size":"Large","urgent":true}
            """;

        SummaryResult result = generator.generate(schema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).isEqualTo("Location: UB\nSize: Large\nUrgent?: true");
    }

    @Test
    @DisplayName("Missing answers only includes answered fields")
    void missingAnswersSkipsFields() {
        String schema =
                """
            [
              {"key":"location","label":"Location","type":"dropdown"},
              {"key":"size","label":"Size","type":"single_select"},
              {"key":"notes","label":"Notes","type":"text"}
            ]
            """;
        String answers = """
            {"location":"UB"}
            """;

        SummaryResult result = generator.generate(schema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).isEqualTo("Location: UB");
    }

    @Test
    @DisplayName("Array values are joined with comma separator")
    void arrayValuesJoinedWithComma() {
        String schema =
                """
            [
              {"key":"skills","label":"Skills Needed","type":"multi_select","options":["Plumbing","Electric","Paint"]}
            ]
            """;
        String answers = """
            {"skills":["Plumbing","Electric"]}
            """;

        SummaryResult result = generator.generate(schema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).isEqualTo("Skills Needed: Plumbing, Electric");
    }

    @Test
    @DisplayName("Malformed schema falls back to key-value summary")
    void malformedSchemaFallsBack() {
        String malformedSchema = "not valid json [";
        String answers = """
            {"location":"UB","size":"Large"}
            """;

        SummaryResult result = generator.generate(malformedSchema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        // Fallback uses key: value format
        assertThat(result.summary()).contains("location: UB");
        assertThat(result.summary()).contains("size: Large");
    }

    @Test
    @DisplayName("Null schema falls back to key-value summary")
    void nullSchemaFallsBack() {
        String answers = """
            {"color":"red","count":5}
            """;

        SummaryResult result = generator.generate(null, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).contains("color: red");
        assertThat(result.summary()).contains("count: 5");
    }

    @Test
    @DisplayName("Schema that is not an array falls back to key-value summary")
    void schemaNotArrayFallsBack() {
        String schema = """
            {"key":"location","label":"Location"}
            """;
        String answers = """
            {"location":"UB"}
            """;

        SummaryResult result = generator.generate(schema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).contains("location: UB");
    }

    @Test
    @DisplayName("Malformed schema with array values in answers falls back with list formatting")
    void fallbackWithArrayValues() {
        String malformedSchema = "not valid json [";
        String answers = """
            {"skills":["Plumbing","Electric"],"location":"UB"}
            """;

        SummaryResult result = generator.generate(malformedSchema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).contains("skills: Plumbing, Electric");
        assertThat(result.summary()).contains("location: UB");
    }

    @Test
    @DisplayName("Both malformed schema and malformed answers produce empty summary")
    void bothMalformedFallsBackToEmpty() {
        String malformedSchema = "not valid json";
        String malformedAnswers = "not valid json either";

        SummaryResult result = generator.generate(malformedSchema, malformedAnswers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).isEmpty();
    }

    @Test
    @DisplayName("Empty answers produce empty summary")
    void emptyAnswers() {
        String schema =
                """
            [
              {"key":"location","label":"Location","type":"text"}
            ]
            """;
        String answers = "{}";

        SummaryResult result = generator.generate(schema, answers);

        assertThat(result.source()).isEqualTo("TEMPLATE");
        assertThat(result.summary()).isEmpty();
    }
}
