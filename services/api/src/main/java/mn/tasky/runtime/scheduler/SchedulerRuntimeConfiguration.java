package mn.tasky.runtime.scheduler;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "tasky.runtime.scheduler",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class SchedulerRuntimeConfiguration {}
