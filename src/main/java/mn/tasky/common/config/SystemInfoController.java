package mn.tasky.common.config;

import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemInfoController {

    @Value("${spring.application.name:tasky-server}")
    private String applicationName;

    @Value("${tasky.api.version:v1}")
    private String apiVersion;

    @GetMapping("/version")
    public Map<String, String> getVersion() {
        return Map.of(
            "application", applicationName,
            "api_version", apiVersion,
            "timestamp_utc", Instant.now().toString()
        );
    }
}
