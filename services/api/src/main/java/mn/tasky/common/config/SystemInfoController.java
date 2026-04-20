package mn.tasky.common.config;

import java.util.Locale;
import java.util.Map;
import mn.tasky.api.generated.SystemApi;
import mn.tasky.api.generated.model.GetSystemVersion200Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@SuppressWarnings("unchecked")
public class SystemInfoController implements SystemApi {

    private final MessageSource messageSource;

    @Value("${spring.application.name:tasky-server}")
    private String applicationName;

    @Value("${tasky.api.version:v1}")
    private String apiVersion;

    public SystemInfoController(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @Override
    @GetMapping("/version")
    public ResponseEntity<GetSystemVersion200Response> getSystemVersion() {
        Locale locale = LocaleContextHolder.getLocale();
        String status = messageSource.getMessage("system.version", null, locale);

        return (ResponseEntity<GetSystemVersion200Response>)
                (ResponseEntity<?>) ResponseEntity.ok(Map.of("api_version", apiVersion, "status_localized", status));
    }
}
