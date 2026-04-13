package mn.tasky.runtime;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tasky.runtime")
public class RuntimeSurfaceProperties {
    private final HttpSurface publicApi = new HttpSurface("/api");
    private final HttpSurface adminApi = new HttpSurface("/api/admin");
    private final BackgroundSurface worker = new BackgroundSurface();
    private final BackgroundSurface scheduler = new BackgroundSurface();

    public HttpSurface getPublicApi() {
        return publicApi;
    }

    public HttpSurface getAdminApi() {
        return adminApi;
    }

    public BackgroundSurface getWorker() {
        return worker;
    }

    public BackgroundSurface getScheduler() {
        return scheduler;
    }

    public static class Surface {
        private boolean enabled = true;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }

    public static class HttpSurface extends Surface {
        private String basePath;

        public HttpSurface() {}

        public HttpSurface(String basePath) {
            this.basePath = basePath;
        }

        public String getBasePath() {
            return basePath;
        }

        public void setBasePath(String basePath) {
            this.basePath = basePath;
        }
    }

    public static class BackgroundSurface extends Surface {}
}
