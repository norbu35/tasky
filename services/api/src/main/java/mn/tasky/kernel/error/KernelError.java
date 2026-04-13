package mn.tasky.kernel.error;

public record KernelError(String code, String message, String traceId, boolean retryable) {}
