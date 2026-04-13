package mn.tasky.automation.provider.llm;

import java.util.List;
import java.util.Map;
import mn.tasky.automation.provider.ProviderHealth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development LLM provider that logs prompts instead of calling an AI API.
 * Useful for testing AI-integration points without incurring API costs.
 * Activated when tasky.llm.provider=logging (default).
 */
@Component
@ConditionalOnProperty(name = "tasky.llm.provider", havingValue = "logging", matchIfMissing = true)
public class LoggingLlmProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingLlmProvider.class);

    @Override
    public String generate(String prompt, Map<String, String> variables) {
        log.info("LLM generate: prompt={} variables={}", prompt, variables);
        return "[logging stub] " + prompt;
    }

    @Override
    public String classify(String text, List<String> categories) {
        log.info("LLM classify: text={} categories={}", text, categories);
        return categories.isEmpty() ? "unknown" : categories.get(0);
    }

    @Override
    public String summarize(String text, int maxWords) {
        log.info("LLM summarize: text={} maxWords={}", text, maxWords);
        return text.length() > maxWords ? text.substring(0, maxWords) + "..." : text;
    }

    @Override
    public ProviderHealth health() {
        return ProviderHealth.healthy(providerName());
    }

    @Override
    public String providerName() {
        return "logging";
    }
}
