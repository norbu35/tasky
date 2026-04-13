# Tasky V2 AI Integration Contract

**Date:** 2026-04-13
**Status:** draft
**Scope:** Rules for AI-assisted features in Tasky v2

## Deterministic Authority

Deterministic services remain authoritative for high-risk state changes. AI-assisted workflows may:

- summarize
- prioritizeize
- classify
- recommend
- rewrite content with strict policy
- power internal support copilots

AI-assisted workflows are **forbidden** from making final decisions on:

- payment authorization
- moderation bans
- payout authorization
- verification approval
- unaudited state transitions

These require separate approval before being allowed.

## LLM Provider Contract

All LLM integrations go through the `LlmProvider` interface in `mn.tasky.automation.provider.llm`:

```java
public interface LlmProvider {
    String generate(String prompt, Map<String, String> variables);
    String classify(String text, List<String> categories);
    String summarize(String text, int maxWords);
    ProviderHealth health();
    String providerName();
}
```

### Selection

The active LLM provider is selected via `tasky.llm.provider`:

| Value     | Description                              |
| --------- | ---------------------------------------- |
| `logging` | Development stub; logs prompts (default) |
| `openai`  | OpenAI API (future)                      |
| `gemini`  | Google Gemini API (future)               |

### Production Activation

Before switching from `logging` to a production LLM provider:

1. Implement `LlmProvider` for the target API
2. Add `@ConditionalOnProperty(name = "tasky.llm.provider", havingValue = "<provider>")`
3. Add the provider's API key config under `tasky.llm.<provider>.*`
4. Write evaluation tests (see below)

## Evaluation Requirements

Every AI-assisted workflow must record:

- **Model version** — which model was used (e.g., `gpt-4o-2024-05-13`)
- **Prompt version** — which prompt template version
- **Trace/decision ID** — unique identifier for the AI interaction
- **Redaction policy** — what PII was removed before sending to the LLM
- **Evaluation evidence** — precision/recall or quality metrics before scale-up

## Provider Boundary Rules

1. **No direct vendor logic in controllers** — all LLM calls go through `LlmProvider`
2. **No direct vendor logic in broad orchestration services** — same rule
3. **Provider activation requires** config validation, health checks, timeouts, and fallback policy
4. **PII must be redacted** before any data leaves the system boundary
5. **All AI interactions must be logged** with structured fields: `model`, `prompt_version`, `trace_id`

## Health Checks

Each `LlmProvider` implementation must implement `health()` to return a `ProviderHealth` record.
The health check should verify:

- API key is configured
- Basic connectivity (optional: a lightweight test prompt)
- Rate limit status (if available)
