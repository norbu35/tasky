package mn.tasky.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
public class SystemInfoController {

    private final MessageSource messageSource;

    @Value("${spring.application.name:tasky-server}")
    private String applicationName;

    @Value("${tasky.api.version:v1}")
    private String apiVersion;

    public SystemInfoController(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @GetMapping("/version")
    public Map<String, String> getVersion() {
        Locale locale = LocaleContextHolder.getLocale();
        String status = messageSource.getMessage("system.version",
                                                 null,
                                                 locale);

        return Map.of(
                "application",
                applicationName,
                "api_version",
                apiVersion,
                "status_localized",
                status,
                "timestamp_utc",
                Instant.now()
                        .toString()
        );
    }
}
