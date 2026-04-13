package mn.tasky.automation.provider.llm;

import java.util.List;
import java.util.Map;
import mn.tasky.automation.provider.ProviderHealth;

/**
 * Contract for LLM providers (OpenAI, Gemini, local models, etc.).
 * Supports text generation, classification, and summarization use cases.
 */
public interface LlmProvider {

    /**
     * Generates text from a prompt.
     *
     * @param prompt    The user/system prompt.
     * @param variables Optional prompt variables for templating.
     * @return Generated text response.
     */
    String generate(String prompt, Map<String, String> variables);

    /**
     * Classifies text into one of the provided categories.
     *
     * @param text       The text to classify.
     * @param categories The possible category labels.
     * @return The predicted category.
     */
    String classify(String text, List<String> categories);

    /**
     * Summarizes text into a shorter form.
     *
     * @param text    The text to summarize.
     * @param maxWords Maximum word count for the summary.
     * @return Summarized text.
     */
    String summarize(String text, int maxWords);

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "openai", "gemini", "logging").
     */
    String providerName();
}
