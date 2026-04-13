package mn.tasky.runtime.worker;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "tasky.runtime.worker", name = "enabled", havingValue = "true", matchIfMissing = true)
public class WorkerRuntimeConfiguration {}
