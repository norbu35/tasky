package mn.tasky.task.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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
        return generate(schemaJson, answersJson, null, null);
    }

    /**
     * Generates a scope summary with category context for observability.
     *
     * @param schemaJson    JSON array of field objects (each with key, label, type).
     * @param answersJson   JSON object mapping field keys to answer values.
     * @param categoryId    Category identifier for structured logging (nullable).
     * @param schemaVersion Schema version for structured logging (nullable).
     * @return Summary result with formatted text and source indicator.
     */
    public SummaryResult generate(String schemaJson, String answersJson, String categoryId, Integer schemaVersion) {
        try {
            JsonNode schemaArray = objectMapper.readTree(schemaJson);
            if (!schemaArray.isArray()) {
                throw new IllegalArgumentException("Schema is not a JSON array");
            }
            Map<String, Object> answers = objectMapper.readValue(answersJson, new TypeReference<>() {});

            List<String> lines = new ArrayList<>();
            for (JsonNode field : schemaArray) {
                String key = field.get("key").asText();
                String label = field.get("label").asText();

                Object value = answers.get(key);
                if (value == null) {
                    continue;
                }

                String formattedValue = formatValue(value, field, answersJson, key);
                lines.add(label + ": " + formattedValue);
            }

            String summary = String.join("\n", lines);
            return new SummaryResult(summary, "TEMPLATE");
        } catch (Exception e) {
            log.warn(
                    "Scope summary generation failed, falling back to key-value format"
                            + " [category_id={}, schema_version={}]",
                    categoryId,
                    schemaVersion,
                    e);
            return fallback(answersJson, categoryId, schemaVersion);
        }
    }

    private String formatValue(Object value, JsonNode field, String answersJson, String key) {
        // For option types, resolve value → label
        if (field.has("options") && field.get("options").isArray()) {
            java.util.Map<String, String> valueLabelMap = new java.util.HashMap<>();
            for (JsonNode opt : field.get("options")) {
                if (opt.isObject() && opt.has("value") && opt.has("label")) {
                    valueLabelMap.put(
                            opt.get("value").asText(), opt.get("label").asText());
                }
            }

            if (value instanceof List<?> listValue) {
                return listValue.stream()
                        .map(v -> valueLabelMap.getOrDefault(String.valueOf(v), String.valueOf(v)))
                        .collect(Collectors.joining(", "));
            }

            // Check if raw JSON is array (Jackson may produce List or JsonNode array)
            try {
                JsonNode answersNode = objectMapper.readTree(answersJson);
                JsonNode valueNode = answersNode.get(key);
                if (valueNode != null && valueNode.isArray()) {
                    return StreamSupport.stream(valueNode.spliterator(), false)
                            .map(n -> valueLabelMap.getOrDefault(n.asText(), n.asText()))
                            .collect(Collectors.joining(", "));
                }
            } catch (Exception ignored) {
                // fall through
            }

            String strVal = String.valueOf(value);
            return valueLabelMap.getOrDefault(strVal, strVal);
        }

        // Non-option types: format directly
        if (value instanceof List<?> listValue) {
            return listValue.stream().map(String::valueOf).collect(Collectors.joining(", "));
        }
        return String.valueOf(value);
    }

    private SummaryResult fallback(String answersJson, String categoryId, Integer schemaVersion) {
        try {
            Map<String, Object> answers = objectMapper.readValue(answersJson, new TypeReference<>() {});
            List<String> lines = new ArrayList<>();
            for (Map.Entry<String, Object> entry : answers.entrySet()) {
                Object val = entry.getValue();
                String formatted;
                if (val instanceof List<?> listVal) {
                    formatted = listVal.stream().map(String::valueOf).collect(Collectors.joining(", "));
                } else {
                    formatted = String.valueOf(val);
                }
                lines.add(entry.getKey() + ": " + formatted);
            }
            log.warn(
                    "Scope summary used TEMPLATE fallback path"
                            + " [category_id={}, schema_version={}, event=scope_summary_generation_failed_fallback]",
                    categoryId,
                    schemaVersion);
            return new SummaryResult(String.join("\n", lines), "TEMPLATE");
        } catch (Exception ex) {
            log.warn(
                    "Fallback scope summary generation also failed"
                            + " [category_id={}, schema_version={}, event=scope_summary_generation_failed_fallback]",
                    categoryId,
                    schemaVersion,
                    ex);
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
