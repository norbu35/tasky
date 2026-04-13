package mn.tasky.runtime.adminapi;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "tasky.runtime.admin-api",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class AdminApiRuntimeConfiguration {}
