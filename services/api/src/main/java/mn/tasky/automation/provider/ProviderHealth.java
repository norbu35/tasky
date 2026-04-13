package mn.tasky.automation.provider;

/**
 * Health status for an external provider.
 *
 * @param healthy     Whether the provider is currently considered operational.
 * @param providerName Human-readable provider name (e.g. "facebook", "firebase", "qpay").
 * @param detail      Optional diagnostic information (error message, latency, etc.).
 */
public record ProviderHealth(boolean healthy, String providerName, String detail) {

    public static ProviderHealth healthy(String providerName) {
        return new ProviderHealth(true, providerName, null);
    }

    public static ProviderHealth unhealthy(String providerName, String detail) {
        return new ProviderHealth(false, providerName, detail);
    }
}
