package mn.tasky.task.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Generates deterministic scope summaries from intake answers and category schema fields.
 * Produces "Label: Value" lines in schema field order.
 */
@Component
public class ScopeSummaryGenerator {

    private static final Logger log = LoggerFactory.getLogger(ScopeSummaryGenerator.class);

    private final ObjectMapper objectMapper;

    public ScopeSummaryGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Generates a scope summary from the schema definition and user answers.
     *
     * @param schemaJson  JSON array of field objects (each with key, label, type).
     * @param answersJson JSON object mapping field keys to answer values.
     * @return Summary result with formatted text and source indicator.
     */
    public SummaryResult generate(String schemaJson, String answersJson) {
        try {
            JsonNode schemaArray = objectMapper.readTree(schemaJson);
            if (!schemaArray.isArray()) {
                throw new IllegalArgumentException("Schema is not a JSON array");
            }
            Map<String, Object> answers = objectMapper.readValue(
                answersJson, new TypeReference<>() {});

            List<String> lines = new ArrayList<>();
            for (JsonNode field : schemaArray) {
                String key = field.get("key").asText();
                String label = field.get("label").asText();

                Object value = answers.get(key);
                if (value == null) {
                    continue;
                }

                String formattedValue = formatValue(value, answersJson, key);
                lines.add(label + ": " + formattedValue);
            }

            String summary = String.join("\n", lines);
            return new SummaryResult(summary, "TEMPLATE");
        } catch (Exception e) {
            log.warn("Failed to generate scope summary from schema, falling back to key-value format", e);
            return fallback(answersJson);
        }
    }

    private String formatValue(Object value, String answersJson, String key) {
        if (value instanceof List<?> listValue) {
            return listValue.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        }
        // Check if the raw JSON node is an array (Jackson may deserialize as list already,
        // but handle the case where ObjectMapper produced something else)
        try {
            JsonNode answersNode = objectMapper.readTree(answersJson);
            JsonNode valueNode = answersNode.get(key);
            if (valueNode != null && valueNode.isArray()) {
                return StreamSupport.stream(valueNode.spliterator(), false)
                    .map(JsonNode::asText)
                    .collect(Collectors.joining(", "));
            }
        } catch (Exception ignored) {
            // fall through to toString
        }
        return String.valueOf(value);
    }

    private SummaryResult fallback(String answersJson) {
        try {
            Map<String, Object> answers = objectMapper.readValue(
                answersJson, new TypeReference<>() {});
            List<String> lines = new ArrayList<>();
            for (Map.Entry<String, Object> entry : answers.entrySet()) {
                Object val = entry.getValue();
                String formatted;
                if (val instanceof List<?> listVal) {
                    formatted = listVal.stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(", "));
                } else {
                    formatted = String.valueOf(val);
                }
                lines.add(entry.getKey() + ": " + formatted);
            }
            return new SummaryResult(String.join("\n", lines), "TEMPLATE");
        } catch (Exception ex) {
            log.warn("Fallback scope summary generation also failed", ex);
            return new SummaryResult("", "TEMPLATE");
        }
    }

    /**
     * Result of scope summary generation.
     *
     * @param summary Formatted summary text.
     * @param source  Source indicator: TEMPLATE or USER_EDITED.
     */
    public record SummaryResult(String summary, String source) {}
}
