package mn.tasky.runtime.publicapi;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "tasky.runtime.public-api",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class PublicApiRuntimeConfiguration {}
